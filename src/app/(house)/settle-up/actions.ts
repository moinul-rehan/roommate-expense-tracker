"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";

export type RecordSettlementState = { error?: string } | undefined;

export async function recordSettlement(
  _prevState: RecordSettlementState,
  formData: FormData
): Promise<RecordSettlementState> {
  const profile = await getCurrentProfile();

  const fromUser = String(formData.get("from_user") ?? "");
  const toUser = String(formData.get("to_user") ?? "");
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim() || null;
  const settledOn = String(formData.get("settled_on") ?? "") || undefined;

  if (!fromUser || !toUser || fromUser === toUser) {
    return { error: "Choose who paid and who received." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }

  // Only an involved party or a super_admin can record this settlement — the
  // DB also enforces this via RLS, but checking here gives a clean error.
  if (profile.role !== "super_admin" && profile.id !== fromUser && profile.id !== toUser) {
    return { error: "You can only record settlements you're part of." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("settlements").insert({
    from_user: fromUser,
    to_user: toUser,
    amount,
    note,
    settled_on: settledOn,
    recorded_by: profile.id,
  });

  if (error) {
    return { error: "Could not record the settlement." };
  }

  revalidatePath("/settle-up");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  return undefined;
}
