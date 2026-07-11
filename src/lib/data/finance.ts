import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getUtilityCarryIns } from "./meal";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";

export { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";

/** Returns the latest rent_assignment per user (most recent effective_from wins). */
export async function getCurrentRents(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("rent_assignments")
    .select("id, user_id, monthly_rent_amount, effective_from, notes")
    .order("effective_from", { ascending: false })
    .order("created_at", { ascending: false });

  const currentByUser = new Map<
    string,
    { id: string; monthly_rent_amount: number; effective_from: string; notes: string | null }
  >();

  for (const row of data ?? []) {
    if (!currentByUser.has(row.user_id)) {
      currentByUser.set(row.user_id, {
        id: row.id,
        monthly_rent_amount: row.monthly_rent_amount,
        effective_from: row.effective_from,
        notes: row.notes,
      });
    }
  }

  return currentByUser;
}

export function monthRange(monthKey: string) {
  // monthKey: "YYYY-MM"
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

type ExpenseSplitRow = { user_id: string; share_amount: number; expenses: { expense_date: string; category: string } | null };

/**
 * Per-user, per-category expense_splits totals within [start, end) for the
 * given month. Used both to build the "rent vs other" due split and the
 * per-member cost breakdown card on the dashboard.
 */
export async function getExpenseSharesByCategoryForMonth(
  supabase: SupabaseClient,
  monthKey: string
) {
  const { start, end } = monthRange(monthKey);

  const { data } = await supabase
    .from("expense_splits")
    .select("user_id, share_amount, expenses!inner(expense_date, category)")
    .gte("expenses.expense_date", start)
    .lt("expenses.expense_date", end);

  const byUser = new Map<string, Map<string, number>>();

  for (const row of (data ?? []) as unknown as ExpenseSplitRow[]) {
    const category = row.expenses?.category ?? "other";
    const amount = Number(row.share_amount);
    if (!byUser.has(row.user_id)) byUser.set(row.user_id, new Map());
    const categories = byUser.get(row.user_id)!;
    categories.set(category, (categories.get(category) ?? 0) + amount);
  }

  return byUser;
}


/**
 * Per-user, per-category totals from admin-entered utility_adjustments
 * (Utilities → Generate Utility Statement) for the given month. Same shape
 * as getExpenseSharesByCategoryForMonth so the two merge into one map —
 * amounts are signed (negative = reduces due, e.g. a discount).
 */
export async function getUtilityAdjustmentsByCategoryForMonth(
  supabase: SupabaseClient,
  cottageId: string,
  monthKey: string
) {
  const { data } = await supabase
    .from("utility_adjustments")
    .select("user_id, category, amount")
    .eq("cottage_id", cottageId)
    .eq("month_key", monthKey);

  const byUser = new Map<string, Map<string, number>>();
  for (const row of data ?? []) {
    if (!byUser.has(row.user_id)) byUser.set(row.user_id, new Map());
    const categories = byUser.get(row.user_id)!;
    categories.set(row.category, (categories.get(row.category) ?? 0) + Number(row.amount));
  }
  return byUser;
}

function mergeCategoryTotals(
  a: Map<string, Map<string, number>>,
  b: Map<string, Map<string, number>>
) {
  const merged = new Map<string, Map<string, number>>();
  for (const [userId, categories] of a) {
    merged.set(userId, new Map(categories));
  }
  for (const [userId, categories] of b) {
    const existing = merged.get(userId) ?? new Map<string, number>();
    for (const [category, amount] of categories) {
      existing.set(category, (existing.get(category) ?? 0) + amount);
    }
    merged.set(userId, existing);
  }
  return merged;
}

/**
 * Full per-user, per-category utility breakdown for the month: recorded
 * expenses (expense_splits) plus admin adjustments (utility_adjustments).
 * This is the authoritative source for "what does each member owe" —
 * getMonthlyDues, the Dashboard cost card, and the Utility Statement page
 * all read from this so the numbers never disagree with each other.
 */
export async function getFullCategoryTotalsForMonth(
  supabase: SupabaseClient,
  cottageId: string,
  monthKey: string
) {
  const [expenseTotals, adjustmentTotals] = await Promise.all([
    getExpenseSharesByCategoryForMonth(supabase, monthKey),
    getUtilityAdjustmentsByCategoryForMonth(supabase, cottageId, monthKey),
  ]);
  return mergeCategoryTotals(expenseTotals, adjustmentTotals);
}

/** Category → amount breakdown for one member's utility costs this month. */
export function getMemberCategoryBreakdown(
  categoryTotalsByUser: Map<string, Map<string, number>>,
  userId: string
) {
  const categories = categoryTotalsByUser.get(userId);
  if (!categories) return [];
  return Array.from(categories.entries())
    .map(([category, amount]) => ({
      category,
      label: UTILITY_CATEGORY_LABELS[category] ?? category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/** Net settlements paid by each user within [start, end): positive reduces their due. */
export async function getSettlementsForMonth(supabase: SupabaseClient, monthKey: string) {
  const { start, end } = monthRange(monthKey);

  const { data } = await supabase
    .from("settlements")
    .select("from_user, to_user, amount, settled_on")
    .gte("settled_on", start)
    .lt("settled_on", end);

  const paidByUser = new Map<string, number>();
  for (const row of data ?? []) {
    paidByUser.set(row.from_user, (paidByUser.get(row.from_user) ?? 0) + Number(row.amount));
  }
  return paidByUser;
}

/**
 * How much other members owe `userId` this month: shares other members owe on
 * expenses `userId` paid for, minus settlements `userId` has already received.
 */
export async function getAmountOwedToUser(
  supabase: SupabaseClient,
  userId: string,
  monthKey: string
) {
  const { start, end } = monthRange(monthKey);

  const { data: paidExpenses } = await supabase
    .from("expenses")
    .select("id")
    .eq("paid_by", userId)
    .gte("expense_date", start)
    .lt("expense_date", end);

  const expenseIds = (paidExpenses ?? []).map((e) => e.id);

  let frontedByOthers = 0;
  if (expenseIds.length > 0) {
    const { data: splits } = await supabase
      .from("expense_splits")
      .select("user_id, share_amount")
      .in("expense_id", expenseIds)
      .neq("user_id", userId);
    frontedByOthers = (splits ?? []).reduce((sum, s) => sum + Number(s.share_amount), 0);
  }

  const { data: received } = await supabase
    .from("settlements")
    .select("amount")
    .eq("to_user", userId)
    .gte("settled_on", start)
    .lt("settled_on", end);

  const receivedTotal = (received ?? []).reduce((sum, s) => sum + Number(s.amount), 0);

  return frontedByOthers - receivedTotal;
}

/** Current Cottage Balance for a cottage (sum of in/out transactions). */
export async function getCottageBalance(supabase: SupabaseClient, cottageId: string) {
  const { data } = await supabase
    .from("cottage_balance_transactions")
    .select("amount, direction")
    .eq("cottage_id", cottageId);

  return (data ?? []).reduce(
    (sum, t) => sum + (t.direction === "in" ? Number(t.amount) : -Number(t.amount)),
    0
  );
}

/**
 * Monthly due per user = house_rent utility share + other utility shares
 * (including admin adjustments) + carried-in meal due - settlements paid,
 * for the given month. "Rent" here is the member's share of any House Rent
 * category expense (which utilities/actions.ts auto-populates from their
 * assigned rent_assignments amount) — not rent_assignments itself, so it
 * only counts once a House Rent expense has actually been recorded for the
 * month.
 */
export async function getMonthlyDues(supabase: SupabaseClient, cottageId: string, monthKey: string) {
  const [categoryTotals, settlements, carryIns] = await Promise.all([
    getFullCategoryTotalsForMonth(supabase, cottageId, monthKey),
    getSettlementsForMonth(supabase, monthKey),
    getUtilityCarryIns(supabase, cottageId, monthKey),
  ]);

  const userIds = new Set([...categoryTotals.keys(), ...settlements.keys(), ...carryIns.keys()]);
  const dues = new Map<
    string,
    { rent: number; expenses: number; carryIn: number; paid: number; due: number }
  >();

  for (const userId of userIds) {
    const categories = categoryTotals.get(userId);
    const rent = categories?.get("house_rent") ?? 0;
    let expenses = 0;
    for (const [category, amount] of categories ?? []) {
      if (category !== "house_rent") expenses += amount;
    }
    const carryIn = carryIns.get(userId) ?? 0;
    const paid = settlements.get(userId) ?? 0;
    dues.set(userId, { rent, expenses, carryIn, paid, due: rent + expenses + carryIn - paid });
  }

  return dues;
}
