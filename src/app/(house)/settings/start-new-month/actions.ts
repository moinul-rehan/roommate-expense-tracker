"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { currentMonthKey } from "@/lib/data/finance";

export type CloseMonthState = { error?: string; success?: string } | undefined;

export async function closeCurrentMonth(): Promise<CloseMonthState> {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();
  const monthKey = currentMonthKey();

  const { error } = await supabase.from("month_closures").insert({
    cottage_id: profile.cottage_id,
    month_key: monthKey,
    closed_by: profile.id,
  });

  if (error) {
    return { error: "Could not close the month. It may already be closed." };
  }

  revalidatePath("/settings/start-new-month");
  revalidatePath("/history");
  revalidatePath("/expenses");
  return { success: `${monthKey} is now closed. Expenses and settlements in it are locked.` };
}
