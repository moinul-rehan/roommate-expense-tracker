"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/data/notifications";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";

export type AddAdjustmentState = { error?: string } | undefined;

export async function addUtilityAdjustment(
  _prevState: AddAdjustmentState,
  formData: FormData
): Promise<AddAdjustmentState> {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();

  const monthKey = String(formData.get("month_key") ?? "");
  const categoryValue = String(formData.get("category") ?? "");
  const customCategory = String(formData.get("custom_category") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const paidBy = String(formData.get("paid_by") ?? "");
  const adjustmentType = formData.get("adjustment_type") === "reduce" ? "reduce" : "increase";
  const applyTo = formData.get("apply_to") === "all" ? "all" : "specific";
  const splitMode = formData.get("split_mode") === "custom" ? "custom" : "equal";
  const targetUserId = String(formData.get("target_user_id") ?? "");

  if (!monthKey) return { error: "Missing month." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };

  // Standard picks store the same slug the expenses table uses (e.g.
  // "electricity") so this merges correctly with recorded expenses in the
  // same category instead of showing up as a separate line. Custom "Other"
  // entries store the raw typed text as their own category key.
  const category =
    categoryValue === "other"
      ? customCategory
      : categoryValue in UTILITY_CATEGORY_LABELS
        ? categoryValue
        : "";
  if (!category) return { error: "Enter a category name." };
  const categoryLabel = UTILITY_CATEGORY_LABELS[category] ?? category;

  const { data: activeMembers } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_active", true);
  const memberIds = (activeMembers ?? []).map((m) => m.id);
  if (memberIds.length === 0) return { error: "No active members." };

  if (applyTo === "specific" && !memberIds.includes(targetUserId)) {
    return { error: "Pick a valid member." };
  }

  const sign = adjustmentType === "reduce" ? -1 : 1;
  let shares: { user_id: string; amount: number }[] = [];

  if (applyTo === "specific") {
    shares = [{ user_id: targetUserId, amount: amount * sign }];
  } else if (splitMode === "equal") {
    const base = Math.floor((amount / memberIds.length) * 100) / 100;
    const remainder = Math.round((amount - base * memberIds.length) * 100) / 100;
    shares = memberIds.map((id, i) => ({
      user_id: id,
      amount: (i === 0 ? base + remainder : base) * sign,
    }));
  } else {
    const rawShares = memberIds.map((id) => ({
      user_id: id,
      amount: Number(formData.get(`share_${id}`) ?? 0),
    }));
    const total = Math.round(rawShares.reduce((sum, s) => sum + s.amount, 0) * 100) / 100;
    if (Math.abs(total - amount) > 0.01) {
      return { error: `Assigned amounts (${total}) must add up to the entered amount (${amount}).` };
    }
    shares = rawShares.filter((s) => s.amount > 0).map((s) => ({ ...s, amount: s.amount * sign }));
  }

  const isCottageBalance = paidBy === "cottage_balance";
  const isMemberPaid = !isCottageBalance && paidBy !== "none" && memberIds.includes(paidBy);
  const paymentMemberId = isMemberPaid ? paidBy : null;

  const { error: insertError } = await supabase.from("utility_adjustments").insert(
    shares.map((s) => ({
      cottage_id: profile.cottage_id,
      month_key: monthKey,
      user_id: s.user_id,
      category,
      amount: s.amount,
      payment_source: isCottageBalance ? "cottage_balance" : isMemberPaid ? "member" : "none",
      payment_member_id: paymentMemberId,
      created_by: profile.id,
    }))
  );

  if (insertError) return { error: `Could not save the adjustment: ${insertError.message}` };

  if (isCottageBalance) {
    const { error: balanceError } = await supabase.from("cottage_balance_transactions").insert({
      amount,
      direction: "out",
      reason: categoryLabel,
      created_by: profile.id,
    });
    if (balanceError) {
      return { error: "Adjustment saved but Cottage Balance could not be updated. Contact admin." };
    }
  }

  await notifyUsers(
    supabase,
    profile.cottage_id,
    shares.map((s) => s.user_id).filter((id) => id !== profile.id),
    {
      type: "utility_adjustment",
      title: `Utility statement updated: ${categoryLabel}`,
      body: `${adjustmentType === "reduce" ? "-" : "+"}${amount.toFixed(2)}`,
      link: "/utilities/statement",
    }
  );

  revalidatePath("/utilities/statement");
  revalidatePath("/dashboard");
  revalidatePath("/months");
  revalidatePath("/history");
  return undefined;
}

export async function deleteUtilityAdjustment(id: string) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("utility_adjustments").delete().eq("id", id);
  revalidatePath("/utilities/statement");
  revalidatePath("/dashboard");
  revalidatePath("/months");
  revalidatePath("/history");
}
