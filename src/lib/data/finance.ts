import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type ExpenseSplitRow = { user_id: string; share_amount: number; expenses: { expense_date: string; category: string } | null };

/** Sum of each user's expense_splits share within [start, end). */
export async function getExpenseSharesForMonth(
  supabase: SupabaseClient,
  monthKey: string
) {
  const { start, end } = monthRange(monthKey);

  const { data } = await supabase
    .from("expense_splits")
    .select("user_id, share_amount, expenses!inner(expense_date, category)")
    .gte("expenses.expense_date", start)
    .lt("expenses.expense_date", end);

  const totals = new Map<string, number>();
  for (const row of (data ?? []) as unknown as ExpenseSplitRow[]) {
    totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + Number(row.share_amount));
  }
  return totals;
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

/** Monthly due per user = rent + expense shares - settlements paid, for the given month. */
export async function getMonthlyDues(supabase: SupabaseClient, monthKey: string) {
  const [rents, shares, settlements] = await Promise.all([
    getCurrentRents(supabase),
    getExpenseSharesForMonth(supabase, monthKey),
    getSettlementsForMonth(supabase, monthKey),
  ]);

  const userIds = new Set([...rents.keys(), ...shares.keys()]);
  const dues = new Map<string, { rent: number; expenses: number; paid: number; due: number }>();

  for (const userId of userIds) {
    const rent = rents.get(userId)?.monthly_rent_amount ?? 0;
    const expenses = shares.get(userId) ?? 0;
    const paid = settlements.get(userId) ?? 0;
    dues.set(userId, { rent, expenses, paid, due: rent + expenses - paid });
  }

  return dues;
}
