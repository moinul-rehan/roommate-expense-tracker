"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";

export type SetRentState = { error?: string } | undefined;

export async function setRent(
  _prevState: SetRentState,
  formData: FormData
): Promise<SetRentState> {
  const admin = await requireSuperAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const amount = Number(formData.get("monthly_rent_amount"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!userId || !Number.isFinite(amount) || amount < 0) {
    return { error: "Enter a valid rent amount." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("rent_assignments").insert({
    user_id: userId,
    monthly_rent_amount: amount,
    set_by: admin.id,
    notes,
  });

  if (error) {
    return { error: "Could not save rent." };
  }

  revalidatePath("/admin/rent");
  revalidatePath("/dashboard");
  return undefined;
}
