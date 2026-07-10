"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { currentMonthKey } from "@/lib/data/finance";
import { notifyUsers } from "@/lib/data/notifications";

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

  const { data: members } = await supabase.from("profiles").select("id").eq("is_active", true);
  await notifyUsers(
    supabase,
    profile.cottage_id,
    (members ?? []).map((m) => m.id).filter((id) => id !== profile.id),
    {
      type: "month_closed",
      title: `${monthKey} utility month closed`,
      body: "Expenses and settlements in this month are now locked.",
      link: "/months",
    }
  );

  revalidatePath("/months");
  revalidatePath("/history");
  revalidatePath("/utilities");
  return { success: `${monthKey} is now closed. Expenses and settlements in it are locked.` };
}

function nextMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(year, month, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function closeCurrentMealMonth(): Promise<CloseMonthState> {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();
  const monthKey = currentMonthKey();

  const { error } = await supabase.rpc("close_meal_month", {
    p_month_key: monthKey,
    p_next_month_key: nextMonthKey(monthKey),
  });

  if (error) {
    return { error: "Could not close the meal month." };
  }

  const { data: members } = await supabase.from("profiles").select("id").eq("is_active", true);
  await notifyUsers(
    supabase,
    profile.cottage_id,
    (members ?? []).map((m) => m.id).filter((id) => id !== profile.id),
    {
      type: "meal_month_closed",
      title: `${monthKey} meal month closed`,
      body: "Meal balances have been carried into next month's Utility ledger.",
      link: "/months",
    }
  );

  revalidatePath("/months");
  revalidatePath("/meal");
  revalidatePath("/dashboard");
  return { success: `${monthKey} meal month is closed and archived. Balances carried into ${nextMonthKey(monthKey)}'s Utility ledger.` };
}
