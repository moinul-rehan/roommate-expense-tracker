"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";

export type SaveDefaultCostState = { error?: string } | undefined;

/** Upserts one default-cost row per member for a category (a template, not a history — re-saving replaces the amount). */
export async function saveDefaultCost(
  _prevState: SaveDefaultCostState,
  formData: FormData
): Promise<SaveDefaultCostState> {
  const admin = await requireSuperAdmin();
  const supabase = await createClient();

  const category = String(formData.get("category") ?? "").trim();
  const memberIds = String(formData.get("member_ids") ?? "")
    .split(",")
    .filter(Boolean);

  if (!category) return { error: "Pick a category." };
  if (!memberIds.length) return { error: "No members to save." };

  const rows = memberIds
    .map((userId) => ({
      cottage_id: admin.cottage_id,
      category,
      user_id: userId,
      amount: Number(formData.get(`amount_${userId}`) ?? 0) || 0,
      notes: String(formData.get(`notes_${userId}`) ?? "").trim() || null,
      set_by: admin.id,
      updated_at: new Date().toISOString(),
    }))
    .filter((row) => row.amount > 0);

  if (!rows.length) return { error: "Enter at least one member amount." };

  const { error } = await supabase
    .from("default_costs")
    .upsert(rows, { onConflict: "cottage_id,category,user_id" });

  if (error) return { error: "Could not save the default cost." };

  revalidatePath("/settings/rent");
  revalidatePath("/utilities/statement");
  return undefined;
}

export async function deleteDefaultCostCategory(category: string) {
  const admin = await requireSuperAdmin();
  const supabase = await createClient();
  await supabase
    .from("default_costs")
    .delete()
    .eq("cottage_id", admin.cottage_id)
    .eq("category", category);
  revalidatePath("/settings/rent");
  revalidatePath("/utilities/statement");
}
