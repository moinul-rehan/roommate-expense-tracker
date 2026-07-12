"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/data/notifications";
import { getActiveMonthKey } from "@/lib/data/months";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";

function revalidateUtilityPaths() {
  revalidatePath("/utilities");
  revalidatePath("/utilities/statement");
  revalidatePath("/utilities/history");
  revalidatePath("/dashboard");
  revalidatePath("/months");
}

export type AddExpenseState = { error?: string } | undefined;

/**
 * Utility Expense Ledger only — records a shared cost. Never generates a
 * member bill on its own (see src/lib/data/finance.ts getMonthlyDues); only
 * an adjustment entered on Member Utility Statements does that.
 *
 * Payment Source side effects:
 *   member          → that member already paid the vendor directly: credit
 *                      their due via a negative utility_adjustment. Cottage
 *                      Balance is untouched — the money never entered the
 *                      shared fund.
 *   cottage_balance → paid from the shared fund: debit Cottage Balance.
 *   none            → recorded only, no balance or due change.
 */
export async function addExpense(
  _prevState: AddExpenseState,
  formData: FormData
): Promise<AddExpenseState> {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin" && !profile.can_add_expenses) {
    return { error: "You don't have permission to add utility expenses." };
  }

  const supabase = await createClient();

  const categoryValue = String(formData.get("category") ?? "");
  const customCategory = String(formData.get("custom_category") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim() || null;
  const expenseDate = String(formData.get("expense_date") ?? "") || undefined;
  const paymentSource = String(formData.get("payment_source") ?? "none");
  const paidByMember = String(formData.get("paid_by_member") ?? "");

  const category =
    categoryValue === "other"
      ? customCategory
      : categoryValue in UTILITY_CATEGORY_LABELS
        ? categoryValue
        : "";
  if (!category) return { error: "Enter a category name." };
  const categoryLabel = UTILITY_CATEGORY_LABELS[category] ?? category;

  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };
  if (!["member", "cottage_balance", "none"].includes(paymentSource)) {
    return { error: "Pick a valid payment source." };
  }
  if (paymentSource === "member" && !paidByMember) {
    return { error: "Select which member paid." };
  }

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      category,
      amount,
      description,
      paid_by: paymentSource === "member" ? paidByMember : profile.id,
      expense_date: expenseDate,
      split_type: "custom",
      payment_source: paymentSource,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (expenseError || !expense) {
    return { error: `Could not save the expense: ${expenseError?.message ?? "unknown error"}` };
  }

  if (paymentSource === "cottage_balance") {
    const { error: balanceError } = await supabase.from("cottage_balance_transactions").insert({
      amount,
      direction: "out",
      reason: description ?? categoryLabel,
      related_expense_id: expense.id,
      created_by: profile.id,
    });
    if (balanceError) {
      return { error: "Expense saved but Cottage Balance could not be updated. Contact admin." };
    }
  } else if (paymentSource === "member") {
    const activeMonthKey = await getActiveMonthKey(supabase, profile.cottage_id);
    const { error: adjError } = await supabase.from("utility_adjustments").insert({
      cottage_id: profile.cottage_id,
      month_key: activeMonthKey,
      user_id: paidByMember,
      category,
      amount: -amount,
      payment_source: "none",
      payment_member_id: null,
      created_by: profile.id,
    });
    if (adjError) {
      return { error: "Expense saved but the member credit could not be applied. Contact admin." };
    }

    await notifyUsers(supabase, profile.cottage_id, [paidByMember], {
      type: "utility_expense_credit",
      title: `Credited for ${categoryLabel}`,
      body: `${amount.toFixed(2)} reduced from your utility due — you paid this directly.`,
      link: "/utilities",
    });
  }

  revalidateUtilityPaths();
  return undefined;
}

export type AddMemberUtilityDepositState = { error?: string } | undefined;

/**
 * Member Utility Deposit — a member paying money toward their own utility
 * due. Single transaction, two effects: reduces that member's Remaining Due
 * (via utility_deposits, read by getMonthlyDues) and credits Cottage
 * Balance (the money physically entered the shared fund).
 */
export async function addMemberUtilityDeposit(
  _prevState: AddMemberUtilityDepositState,
  formData: FormData
): Promise<AddMemberUtilityDepositState> {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin") {
    return { error: "Only an admin can record a Member Utility Deposit." };
  }

  const supabase = await createClient();
  const userId = String(formData.get("user_id") ?? "");
  const amount = Number(formData.get("amount"));
  const depositDate = String(formData.get("deposit_date") ?? "") || undefined;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!userId) return { error: "Select a member." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };

  const { data: member } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (!member) return { error: "Pick a valid member." };

  const activeMonthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const { error } = await supabase.from("utility_deposits").insert({
    cottage_id: profile.cottage_id,
    month_key: activeMonthKey,
    user_id: userId,
    source_type: "member",
    amount,
    deposit_date: depositDate,
    note,
    created_by: profile.id,
  });
  if (error) return { error: `Could not save the deposit: ${error.message}` };

  const { error: balanceError } = await supabase.from("cottage_balance_transactions").insert({
    amount,
    direction: "in",
    reason: note ?? "Member Utility Deposit",
    created_by: profile.id,
  });
  if (balanceError) {
    return { error: "Deposit saved but Cottage Balance could not be updated. Contact admin." };
  }

  await notifyUsers(supabase, profile.cottage_id, [userId], {
    type: "utility_deposit",
    title: "Utility deposit recorded",
    body: `${amount.toFixed(2)} added toward your utility due.`,
    link: "/utilities",
  });

  revalidateUtilityPaths();
  return undefined;
}

export type AddCottageDepositState = { error?: string } | undefined;

/** Cottage Deposit — the cottage's own money entering the fund directly. Credits Cottage Balance only; no member account changes. */
export async function addCottageDeposit(
  _prevState: AddCottageDepositState,
  formData: FormData
): Promise<AddCottageDepositState> {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin") {
    return { error: "Only an admin can record a Cottage Deposit." };
  }

  const supabase = await createClient();
  const amount = Number(formData.get("amount"));
  const depositDate = String(formData.get("deposit_date") ?? "") || undefined;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };

  const activeMonthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const { error } = await supabase.from("utility_deposits").insert({
    cottage_id: profile.cottage_id,
    month_key: activeMonthKey,
    user_id: null,
    source_type: "addition",
    amount,
    deposit_date: depositDate,
    note,
    created_by: profile.id,
  });
  if (error) return { error: `Could not save the deposit: ${error.message}` };

  const { error: balanceError } = await supabase.from("cottage_balance_transactions").insert({
    amount,
    direction: "in",
    reason: note ?? "Cottage Deposit",
    created_by: profile.id,
  });
  if (balanceError) {
    return { error: "Deposit saved but Cottage Balance could not be updated. Contact admin." };
  }

  revalidateUtilityPaths();
  return undefined;
}
