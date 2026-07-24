import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getActiveMonthKey } from "@/lib/data/months";
import {
  getMonthlyExpenseHistory,
  getUtilityDepositHistory,
  getMonthlyExpenseTotal,
  getCottageBalance,
  getMonthlyDues,
  UTILITY_CATEGORY_LABELS,
} from "@/lib/data/finance";
import { UtilityHistoryPdf } from "./UtilityHistoryPdf";

export async function GET() {
  const profile = await getCurrentProfile();

  if (profile.role !== "super_admin" && !profile.can_add_expenses) {
    return new Response("Forbidden", { status: 403 });
  }

  const supabase = await createClient();

  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const [{ data: members }, expenses, deposits, totalUtilityExpense, cottageBalance, dues, adjustmentsQuery] =
    await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true).order("last_name"),
      getMonthlyExpenseHistory(supabase, monthKey),
      getUtilityDepositHistory(supabase, profile.cottage_id, monthKey),
      getMonthlyExpenseTotal(supabase, monthKey),
      getCottageBalance(supabase, profile.cottage_id),
      getMonthlyDues(supabase, profile.cottage_id, monthKey),
      supabase
        .from("utility_adjustments")
        .select("id, user_id, category, amount")
        .eq("cottage_id", profile.cottage_id)
        .eq("month_key", monthKey)
        .order("created_at"),
    ]);

  const memberList = members ?? [];
  const membersById = new Map(memberList.map((m) => [m.id, m]));

  const memberDeposits = deposits
    .filter((d) => d.source_type === "member")
    .map((d) => ({ ...d, member: d.user_id ? (membersById.get(d.user_id) ?? null) : null }));
  const cottageDeposits = deposits.filter((d) => d.source_type === "addition");

  const outstandingFromMembers = Array.from(dues.values()).reduce((sum, d) => sum + Math.max(0, d.due), 0);
  const collectedThisMonth = Array.from(dues.values()).reduce((sum, d) => sum + d.paid, 0);

  const adjustmentsByUser = new Map<string, { category: string; amount: number }[]>();
  const categoryTotalsMap = new Map<string, number>();
  for (const row of adjustmentsQuery.data ?? []) {
    const list = adjustmentsByUser.get(row.user_id) ?? [];
    list.push({ category: row.category, amount: Number(row.amount) });
    adjustmentsByUser.set(row.user_id, list);
    categoryTotalsMap.set(row.category, (categoryTotalsMap.get(row.category) ?? 0) + Number(row.amount));
  }

  const categoryTotals = Array.from(categoryTotalsMap.entries())
    .map(([category, amount]) => ({ category: UTILITY_CATEGORY_LABELS[category] ?? category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const memberStatements = memberList.map((m) => {
    const lines = (adjustmentsByUser.get(m.id) ?? []).map((a) => ({
      label: UTILITY_CATEGORY_LABELS[a.category] ?? a.category,
      amount: a.amount,
    }));
    const due = dues.get(m.id) ?? { rent: 0, expenses: 0, paid: 0, due: 0 };
    return {
      id: m.id,
      name: getDisplayName(m),
      lines,
      assignedCost: due.rent + due.expenses,
      paid: due.paid,
      due: due.due,
    };
  });

  const buffer = await renderToBuffer(
    UtilityHistoryPdf({
      monthKey,
      cottageBalance,
      totalUtilityExpense,
      outstandingFromMembers,
      collectedThisMonth,
      categoryTotals,
      memberStatements,
      expenses,
      memberDeposits,
      cottageDeposits,
    })
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="utility-history-${monthKey}.pdf"`,
    },
  });
}
