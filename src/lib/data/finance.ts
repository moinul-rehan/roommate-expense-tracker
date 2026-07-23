import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";

export { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";

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

/**
 * Per-user, per-category totals from admin-entered utility_adjustments
 * (Utilities → Member Utility Statements) for the given month. Amounts are
 * signed — positive increases a member's due (a cost line), negative reduces
 * it (a discount, a "paid directly" credit, a manual carry-over, etc).
 *
 * This is the sole source of "what does each member owe" — Utility Expenses
 * recorded on the Utility Details page are a separate ledger (see
 * getMonthlyExpenseTotal) and never generate member bills on their own; only
 * an adjustment entered here does. See src/app/(house)/utilities/actions.ts.
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

/** Total of every recorded Utility Expense (Utility Expense Ledger) within the month, regardless of payment source. */
export async function getMonthlyExpenseTotal(supabase: SupabaseClient, monthKey: string) {
  const { start, end } = monthRange(monthKey);
  const { data } = await supabase
    .from("expenses")
    .select("amount")
    .gte("expense_date", start)
    .lt("expense_date", end);
  return (data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
}

export type UtilityExpenseRow = {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  payment_source: string;
  payer: { first_name: string; last_name: string | null } | null;
};

/** Full Utility Expense History for the month, newest first — history only, no calculations. */
export async function getMonthlyExpenseHistory(
  supabase: SupabaseClient,
  monthKey: string
): Promise<UtilityExpenseRow[]> {
  const { start, end } = monthRange(monthKey);
  const { data } = await supabase
    .from("expenses")
    .select("id, category, amount, description, expense_date, payment_source, payer:paid_by(first_name, last_name)")
    .gte("expense_date", start)
    .lt("expense_date", end)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as Array<Omit<UtilityExpenseRow, "amount"> & { amount: number | string }>).map(
    (row) => ({ ...row, amount: Number(row.amount) })
  );
}

/** Admin-recorded Member Utility Deposits per user within the month: reduces that member's due (and credits Cottage Balance — see addMemberUtilityDeposit). Cottage Deposits are excluded here — they credit Cottage Balance only, never any member's due. */
export async function getUtilityDepositsForMonth(
  supabase: SupabaseClient,
  cottageId: string,
  monthKey: string
) {
  const { data } = await supabase
    .from("utility_deposits")
    .select("user_id, amount")
    .eq("cottage_id", cottageId)
    .eq("month_key", monthKey)
    .eq("source_type", "member");

  const byUser = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.user_id) continue;
    byUser.set(row.user_id, (byUser.get(row.user_id) ?? 0) + Number(row.amount));
  }
  return byUser;
}

export type UtilityDepositRow = {
  id: string;
  user_id: string | null;
  amount: number;
  deposit_date: string;
  note: string | null;
  source_type: "member" | "addition";
};

/** Full utility deposit history for the month (both member and addition rows), newest first. */
export async function getUtilityDepositHistory(
  supabase: SupabaseClient,
  cottageId: string,
  monthKey: string
): Promise<UtilityDepositRow[]> {
  const { data } = await supabase
    .from("utility_deposits")
    .select("id, user_id, amount, deposit_date, note, source_type")
    .eq("cottage_id", cottageId)
    .eq("month_key", monthKey)
    .order("deposit_date", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    amount: Number(row.amount),
    deposit_date: row.deposit_date,
    note: row.note,
    source_type: row.source_type,
  }));
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

export type DefaultCostRow = { id: string; user_id: string; amount: number; notes: string | null };

/** Admin-configured per-member default costs (Internet, Servant, etc — same every month), grouped by category. */
export async function getDefaultCosts(supabase: SupabaseClient, cottageId: string) {
  const { data } = await supabase
    .from("default_costs")
    .select("id, category, user_id, amount, notes")
    .eq("cottage_id", cottageId);

  const byCategory = new Map<string, DefaultCostRow[]>();
  for (const row of data ?? []) {
    const list = byCategory.get(row.category) ?? [];
    list.push({ id: row.id, user_id: row.user_id, amount: Number(row.amount), notes: row.notes });
    byCategory.set(row.category, list);
  }
  return byCategory;
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
 * Member Utility Due = Assigned Utility Costs (utility_adjustments, signed)
 * − Member Utility Deposits, for the given month. "Rent" is broken out as
 * its own field purely for display (the house_rent category adjustment,
 * typically populated from a Default Cost template — see getDefaultCosts).
 *
 * Utility Expenses recorded on the Utility Details page never factor in
 * here directly — they're a separate ledger and only affect a member's due
 * once the admin turns them into an adjustment on Member Utility Statements.
 * Likewise, a previous month's Meal Due/Advance only carries in if the admin
 * manually adds it as an adjustment — never automatically.
 */
export async function getMonthlyDues(supabase: SupabaseClient, cottageId: string, monthKey: string) {
  const [categoryTotals, deposits] = await Promise.all([
    getUtilityAdjustmentsByCategoryForMonth(supabase, cottageId, monthKey),
    getUtilityDepositsForMonth(supabase, cottageId, monthKey),
  ]);

  const userIds = new Set([...categoryTotals.keys(), ...deposits.keys()]);
  const dues = new Map<string, { rent: number; expenses: number; paid: number; due: number }>();

  for (const userId of userIds) {
    const categories = categoryTotals.get(userId);
    const rent = categories?.get("house_rent") ?? 0;
    let expenses = 0;
    for (const [category, amount] of categories ?? []) {
      if (category !== "house_rent") expenses += amount;
    }
    const paid = deposits.get(userId) ?? 0;
    dues.set(userId, { rent, expenses, paid, due: rent + expenses - paid });
  }

  return dues;
}
