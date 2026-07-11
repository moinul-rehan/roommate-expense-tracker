import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthlyDues } from "./finance";
import { getMealTotals } from "./meal";

/** The cottage's single authoritative "current month" — drives Dashboard/Meal/Utilities. */
export async function getActiveMonthKey(supabase: SupabaseClient, cottageId: string) {
  const { data } = await supabase
    .from("cottages")
    .select("active_month_key")
    .eq("id", cottageId)
    .single();
  return (data?.active_month_key as string | undefined) ?? new Date().toISOString().slice(0, 7);
}

/** Today's date if it falls within `monthKey`, otherwise the 1st of that month — a sane default for date pickers when the active month isn't the real calendar month. */
export function defaultDateForMonth(monthKey: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return today.slice(0, 7) === monthKey ? today : `${monthKey}-01`;
}

export function nextMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(year, month, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type MonthSummary = {
  monthKey: string;
  closedAt: string | null;
  totalUtilityDue: number;
  totalBazaar: number;
  totalMeals: number;
  mealRate: number;
};

async function getMonthSummary(supabase: SupabaseClient, monthKey: string): Promise<Omit<MonthSummary, "monthKey" | "closedAt">> {
  const [dues, mealTotals] = await Promise.all([
    getMonthlyDues(supabase, monthKey),
    getMealTotals(supabase, monthKey),
  ]);

  const totalUtilityDue = Array.from(dues.values()).reduce((sum, d) => sum + d.due, 0);

  return {
    totalUtilityDue,
    totalBazaar: mealTotals.totalBazaar,
    totalMeals: mealTotals.totalMeals,
    mealRate: mealTotals.mealRate,
  };
}

export async function getActiveMonthSummary(supabase: SupabaseClient, monthKey: string): Promise<MonthSummary> {
  const summary = await getMonthSummary(supabase, monthKey);
  return { monthKey, closedAt: null, ...summary };
}

/** Locked (history) months for a cottage, newest first, each with a quick summary. */
export async function getMonthHistory(supabase: SupabaseClient, cottageId: string): Promise<MonthSummary[]> {
  const { data: closures } = await supabase
    .from("month_closures")
    .select("month_key, closed_at")
    .eq("cottage_id", cottageId)
    .order("month_key", { ascending: false });

  const rows = closures ?? [];

  return Promise.all(
    rows.map(async (row) => {
      const summary = await getMonthSummary(supabase, row.month_key);
      return { monthKey: row.month_key, closedAt: row.closed_at, ...summary };
    })
  );
}
