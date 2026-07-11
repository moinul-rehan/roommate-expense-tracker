import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

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
export async function getMemberMealSummary<
  T extends { id: string; first_name: string; last_name: string | null }
>(supabase: SupabaseClient, monthKey: string, members: T[]) {
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

type MemberRef = { first_name: string; last_name: string | null; avatar_url: string | null } | null;

/** Every daily-meal entry for the month, newest first, with the member's name. */
export async function getDailyMealRecords(supabase: SupabaseClient, monthKey: string) {
  const { data } = await supabase
    .from("daily_meals")
    .select("id, meal_date, count, user_id, member:user_id(first_name, last_name, avatar_url)")
    .eq("month_key", monthKey)
    .order("meal_date", { ascending: false });

  return (data ?? []) as unknown as {
    id: string;
    meal_date: string;
    count: number;
    user_id: string;
    member: MemberRef;
  }[];
}

/**
 * Daily-meal entries pivoted into a date x member grid: one row per date that
 * has any entries, one column per member, cell = that member's meal count on
 * that date (0 if none).
 */
export function pivotDailyMealsByDate<T extends { id: string; first_name: string; last_name: string | null }>(
  records: { meal_date: string; count: number; user_id: string }[],
  members: T[]
) {
  const dateMap = new Map<string, Map<string, number>>();
  for (const r of records) {
    if (!dateMap.has(r.meal_date)) dateMap.set(r.meal_date, new Map());
    const byUser = dateMap.get(r.meal_date)!;
    byUser.set(r.user_id, (byUser.get(r.user_id) ?? 0) + Number(r.count));
  }

  const dates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a));

  const rows = dates.map((date) => ({
    date,
    counts: members.map((m) => dateMap.get(date)?.get(m.id) ?? 0),
  }));

  const totals = members.map((m) =>
    records.filter((r) => r.user_id === m.id).reduce((sum, r) => sum + Number(r.count), 0)
  );

  return { rows, totals };
}

/** Every meal-deposit entry for the month, newest first, with the member's name. */
export async function getDepositRecords(supabase: SupabaseClient, monthKey: string) {
  const { data } = await supabase
    .from("meal_deposits")
    .select("id, deposit_date, amount, note, member:user_id(first_name, last_name, avatar_url)")
    .eq("month_key", monthKey)
    .order("deposit_date", { ascending: false });

  return (data ?? []) as unknown as {
    id: string;
    deposit_date: string;
    amount: number;
    note: string | null;
    member: MemberRef;
  }[];
}

/** Every bazaar (meal cost) entry for the month, newest first, with the spender's name. */
export async function getBazaarRecords(supabase: SupabaseClient, monthKey: string) {
  const { data } = await supabase
    .from("bazaar_entries")
    .select("id, entry_date, amount, description, member:spent_by(first_name, last_name, avatar_url)")
    .eq("month_key", monthKey)
    .order("entry_date", { ascending: false });

  return (data ?? []) as unknown as {
    id: string;
    entry_date: string;
    amount: number;
    description: string | null;
    member: MemberRef;
  }[];
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
