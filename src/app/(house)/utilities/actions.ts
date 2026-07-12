"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/data/notifications";
import { getCurrentRents } from "@/lib/data/finance";
import { getActiveMonthKey } from "@/lib/data/months";

export type AddExpenseState = { error?: string } | undefined;

const CATEGORIES = [
  "house_rent",
  "electricity",
  "servant",
  "trash",
  "internet",
  "filter_kit",
  "other",
] as const;

export async function addExpense(
  _prevState: AddExpenseState,
  formData: FormData
): Promise<AddExpenseState> {
  const profile = await getCurrentProfile();

  if (profile.role !== "super_admin" && !profile.can_add_expenses) {
    return { error: "You don't have permission to add expenses." };
  }

  const supabase = await createClient();

  const category = String(formData.get("category") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const paymentSource = formData.get("payment_source") === "cottage_balance" ? "cottage_balance" : "member";
  const paidBy = paymentSource === "member" ? String(formData.get("paid_by") ?? "") : profile.id;
  const expenseDate = String(formData.get("expense_date") ?? "") || undefined;
  const splitType = formData.get("split_type") === "custom" ? "custom" : "equal";
  const isHouseRent = category === "house_rent";

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Pick a valid category." };
  }
  if (category === "house_rent" && profile.role !== "super_admin") {
    return { error: "Only a super admin can add House Rent." };
  }
  if (paymentSource === "member" && !paidBy) {
    return { error: "Select who paid." };
  }

  const { data: activeMembers } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_active", true);

  const memberIds = (activeMembers ?? []).map((m) => m.id);
  if (memberIds.length === 0) {
    return { error: "No active members to split with." };
  }

  let amount: number;
  let shares: { user_id: string; share_amount: number }[] = [];

  if (isHouseRent) {
    // House Rent is never typed in manually — each member's share is their
    // currently assigned rent (Settings → Rent), so the ledger stays in sync
    // with whatever the admin has set there.
    const rents = await getCurrentRents(supabase);
    shares = memberIds
      .map((id) => ({ user_id: id, share_amount: rents.get(id)?.monthly_rent_amount ?? 0 }))
      .filter((s) => s.share_amount > 0);
    amount = Math.round(shares.reduce((sum, s) => sum + s.share_amount, 0) * 100) / 100;

    if (amount <= 0) {
      return { error: "No members have an assigned rent yet — set it under Settings → Rent first." };
    }
  } else {
    amount = Number(formData.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: "Enter a valid amount." };
    }

    if (paymentSource === "member") {
      if (splitType === "equal") {
        const base = Math.floor((amount / memberIds.length) * 100) / 100;
        const remainder = Math.round((amount - base * memberIds.length) * 100) / 100;
        shares = memberIds.map((id, i) => ({
          user_id: id,
          share_amount: i === 0 ? base + remainder : base,
        }));
      } else {
        shares = memberIds
          .map((id) => ({
            user_id: id,
            share_amount: Number(formData.get(`share_${id}`) ?? 0),
          }))
          .filter((s) => s.share_amount > 0);

        const total = Math.round(shares.reduce((sum, s) => sum + s.share_amount, 0) * 100) / 100;
        if (Math.abs(total - amount) > 0.01) {
          return { error: `Custom shares (${total}) must add up to the total amount (${amount}).` };
        }
      }
    }
  }

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      category,
      amount,
      description,
      paid_by: paidBy,
      expense_date: expenseDate,
      split_type: isHouseRent ? "custom" : splitType,
      payment_source: paymentSource,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (expenseError || !expense) {
    return { error: "Could not save the expense." };
  }

  if (paymentSource === "cottage_balance") {
    const { error: balanceError } = await supabase.from("cottage_balance_transactions").insert({
      amount,
      direction: "out",
      reason: description ?? `${category} expense`,
      related_expense_id: expense.id,
      created_by: profile.id,
    });
    if (balanceError) {
      return { error: "Expense saved but Cottage Balance could not be updated. Contact admin." };
    }
  } else {
    const { error: splitsError } = await supabase
      .from("expense_splits")
      .insert(shares.map((s) => ({ expense_id: expense.id, ...s })));

    if (splitsError) {
      return { error: "Expense saved but splits failed. Contact admin." };
    }
  }

  await notifyUsers(
    supabase,
    profile.cottage_id,
    memberIds.filter((id) => id !== profile.id),
    {
      type: "utility_expense",
      title: "New utility expense added",
      body: `${description ?? category} — ${amount.toFixed(2)}`,
      link: "/utilities",
    }
  );

  revalidatePath("/utilities");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  return undefined;
}

export type AddUtilityDepositState = { error?: string } | undefined;

export async function addUtilityDeposit(
  _prevState: AddUtilityDepositState,
  formData: FormData
): Promise<AddUtilityDepositState> {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin") {
    return { error: "Only an admin can record utility deposits." };
  }

  const supabase = await createClient();
  const source = String(formData.get("source") ?? "");
  const isAddition = source === "addition";
  const userId = isAddition ? null : source;
  const amount = Number(formData.get("amount"));
  const depositDate = String(formData.get("deposit_date") ?? "") || undefined;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!source) return { error: "Select a source." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };

  if (!isAddition) {
    const { data: member } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId as string)
      .eq("is_active", true)
      .maybeSingle();
    if (!member) return { error: "Pick a valid member." };
  }

  const activeMonthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const { error } = await supabase.from("utility_deposits").insert({
    cottage_id: profile.cottage_id,
    month_key: activeMonthKey,
    user_id: userId,
    source_type: isAddition ? "addition" : "member",
    amount,
    deposit_date: depositDate,
    note,
    created_by: profile.id,
  });

  if (error) {
    return { error: `Could not save the deposit: ${error.message}` };
  }

  if (isAddition) {
    // The cottage's own previously-held money entering the system — credit
    // the Cottage Balance directly. It doesn't reduce anyone's due, so it's
    // never included in getUtilityDepositsForMonth's due-reduction map.
    const { error: balanceError } = await supabase.from("cottage_balance_transactions").insert({
      amount,
      direction: "in",
      reason: note ?? "Utility deposit addition",
      created_by: profile.id,
    });
    if (balanceError) {
      return { error: "Deposit saved but Cottage Balance could not be updated. Contact admin." };
    }
  } else {
    await notifyUsers(supabase, profile.cottage_id, [userId as string], {
      type: "utility_deposit",
      title: "Utility deposit recorded",
      body: `${amount.toFixed(2)} added toward your utility due.`,
      link: "/utilities",
    });
  }

  revalidatePath("/utilities");
  revalidatePath("/utilities/statement");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  return undefined;
}

export type AddCottageCostState = { error?: string } | undefined;

export async function addCottageCost(
  _prevState: AddCottageCostState,
  formData: FormData
): Promise<AddCottageCostState> {
  const profile = await getCurrentProfile();

  if (profile.role !== "super_admin" && !profile.can_add_expenses) {
    return { error: "You don't have permission to add expenses." };
  }

  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const spentBy = String(formData.get("spent_by") ?? "");
  const expenseDate = String(formData.get("expense_date") ?? "") || undefined;
  const borneByPayer = formData.get("borne_by_payer") === "on";

  if (!name) return { error: "Enter a cost name." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };
  if (!spentBy) return { error: "Select who spent it." };

  const isCottageBalance = spentBy === "cottage_balance";

  const { data: activeMembers } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_active", true);

  const memberIds = (activeMembers ?? []).map((m) => m.id);
  if (memberIds.length === 0) {
    return { error: "No active members to split with." };
  }
  if (!isCottageBalance && !memberIds.includes(spentBy)) {
    return { error: "Pick a valid member." };
  }

  let shares: { user_id: string; share_amount: number }[] = [];
  let splitType: "equal" | "custom" = "equal";

  if (!isCottageBalance) {
    if (borneByPayer) {
      splitType = "custom";
      shares = [{ user_id: spentBy, share_amount: amount }];
    } else {
      const base = Math.floor((amount / memberIds.length) * 100) / 100;
      const remainder = Math.round((amount - base * memberIds.length) * 100) / 100;
      shares = memberIds.map((id, i) => ({
        user_id: id,
        share_amount: i === 0 ? base + remainder : base,
      }));
    }
  }

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      category: "other",
      amount,
      description: name,
      paid_by: isCottageBalance ? profile.id : spentBy,
      expense_date: expenseDate,
      split_type: splitType,
      payment_source: isCottageBalance ? "cottage_balance" : "member",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (expenseError || !expense) {
    return { error: "Could not save the cost." };
  }

  if (isCottageBalance) {
    const { error: balanceError } = await supabase.from("cottage_balance_transactions").insert({
      amount,
      direction: "out",
      reason: name,
      related_expense_id: expense.id,
      created_by: profile.id,
    });
    if (balanceError) {
      return { error: "Cost saved but Cottage Balance could not be updated. Contact admin." };
    }
  } else {
    const { error: splitsError } = await supabase
      .from("expense_splits")
      .insert(shares.map((s) => ({ expense_id: expense.id, ...s })));

    if (splitsError) {
      return { error: "Cost saved but splits failed. Contact admin." };
    }
  }

  await notifyUsers(
    supabase,
    profile.cottage_id,
    memberIds.filter((id) => id !== profile.id),
    {
      type: "utility_expense",
      title: "New utility cost added",
      body: `${name} — ${amount.toFixed(2)}`,
      link: "/utilities",
    }
  );

  revalidatePath("/utilities");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  return undefined;
}
