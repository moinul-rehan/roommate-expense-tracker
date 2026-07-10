"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";

export type AddExpenseState = { error?: string } | undefined;

const CATEGORIES = ["servant", "electricity", "internet", "other"] as const;

export async function addExpense(
  _prevState: AddExpenseState,
  formData: FormData
): Promise<AddExpenseState> {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const category = String(formData.get("category") ?? "");
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim() || null;
  const paidBy = String(formData.get("paid_by") ?? "");
  const expenseDate = String(formData.get("expense_date") ?? "") || undefined;
  const splitType = formData.get("split_type") === "custom" ? "custom" : "equal";

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Pick a valid category." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }
  if (!paidBy) {
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

  let shares: { user_id: string; share_amount: number }[];

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

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      category,
      amount,
      description,
      paid_by: paidBy,
      expense_date: expenseDate,
      split_type: splitType,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (expenseError || !expense) {
    return { error: "Could not save the expense." };
  }

  const { error: splitsError } = await supabase
    .from("expense_splits")
    .insert(shares.map((s) => ({ expense_id: expense.id, ...s })));

  if (splitsError) {
    return { error: "Expense saved but splits failed. Contact admin." };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  return undefined;
}
