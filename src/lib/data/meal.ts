import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentMonthKey } from "./finance";

/** Current meal month plus the last two (most recent first). Archived months are excluded. */
export function recentMealMonthKeys(monthKey = currentMonthKey()): string[] {
  const [year, month] = monthKey.split("-").map(Number);
  const keys: string[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export async function getArchivedMealMonths(supabase: SupabaseClient, cottageId: string) {
  const { data } = await supabase
    .from("meal_months")
    .select("month_key, closed_at")
    .eq("cottage_id", cottageId)
    .eq("is_archived", true)
    .order("month_key", { ascending: false });
  return data ?? [];
}

export async function getMealTotals(supabase: SupabaseClient, monthKey: string) {
  const [{ data: bazaar }, { data: meals }, { data: deposits }] = await Promise.all([
    supabase.from("bazaar_entries").select("amount").eq("month_key", monthKey),
    supabase.from("daily_meals").select("user_id, count").eq("month_key", monthKey),
    supabase.from("meal_deposits").select("user_id, amount").eq("month_key", monthKey),
  ]);

  const totalBazaar = (bazaar ?? []).reduce((sum, b) => sum + Number(b.amount), 0);
  const totalMeals = (meals ?? []).reduce((sum, m) => sum + Number(m.count), 0);
  const mealRate = totalMeals > 0 ? totalBazaar / totalMeals : 0;

  const mealsByUser = new Map<string, number>();
  for (const m of meals ?? []) {
    mealsByUser.set(m.user_id, (mealsByUser.get(m.user_id) ?? 0) + Number(m.count));
  }

  const depositsByUser = new Map<string, number>();
  for (const d of deposits ?? []) {
    depositsByUser.set(d.user_id, (depositsByUser.get(d.user_id) ?? 0) + Number(d.amount));
  }

  return { totalBazaar, totalMeals, mealRate, mealsByUser, depositsByUser };
}

/** Per-member meal summary: meals eaten, meal cost, deposit, balance (deposit - cost). */
export async function getMemberMealSummary(
  supabase: SupabaseClient,
  monthKey: string,
  members: { id: string; first_name: string; last_name: string | null }[]
) {
  const { mealRate, mealsByUser, depositsByUser, totalBazaar, totalMeals } = await getMealTotals(
    supabase,
    monthKey
  );

  const rows = members.map((m) => {
    const meals = mealsByUser.get(m.id) ?? 0;
    const deposit = depositsByUser.get(m.id) ?? 0;
    const cost = meals * mealRate;
    return { ...m, meals, deposit, cost, balance: deposit - cost };
  });

  return { rows, mealRate, totalBazaar, totalMeals };
}

export async function getUtilityCarryIns(
  supabase: SupabaseClient,
  cottageId: string,
  monthKey: string
) {
  const { data } = await supabase
    .from("utility_carry_ins")
    .select("user_id, amount, source_month_key")
    .eq("cottage_id", cottageId)
    .eq("month_key", monthKey);

  const byUser = new Map<string, number>();
  for (const row of data ?? []) {
    byUser.set(row.user_id, (byUser.get(row.user_id) ?? 0) + Number(row.amount));
  }
  return byUser;
}
