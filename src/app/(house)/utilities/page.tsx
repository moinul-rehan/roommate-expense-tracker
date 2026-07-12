import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getCottageBalance, getMonthlyDues, getMonthlyExpenseTotal } from "@/lib/data/finance";
import { getActiveMonthKey, defaultDateForMonth } from "@/lib/data/months";
import { AddExpenseForm } from "./AddExpenseForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function UtilitiesPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const [{ data: members }, cottageBalance, totalUtilityExpense, dues] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("is_active", true)
      .order("last_name"),
    getCottageBalance(supabase, profile.cottage_id),
    getMonthlyExpenseTotal(supabase, monthKey),
    getMonthlyDues(supabase, profile.cottage_id, monthKey),
  ]);

  const outstandingFromMembers = Array.from(dues.values()).reduce((sum, d) => sum + Math.max(0, d.due), 0);
  const collectedThisMonth = Array.from(dues.values()).reduce((sum, d) => sum + d.paid, 0);

  const canAddExpenses = profile.role === "super_admin" || profile.can_add_expenses;
  const defaultDate = defaultDateForMonth(monthKey);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Utility Details — {monthKey}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage all shared utility expenses. This page does not generate member bills — that
          happens on Member Utility Statements.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-0">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">
              Cottage Balance
            </CardDescription>
            <CardTitle className="text-2xl font-semibold">{cottageBalance.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 text-xs text-muted-foreground">
            Previous + deposits − cottage-paid expenses
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">
              Total Utility Expense
            </CardDescription>
            <CardTitle className="text-2xl font-semibold">{totalUtilityExpense.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 text-xs text-muted-foreground">
            Total shared expenses of this month
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">
              Outstanding From Members
            </CardDescription>
            <CardTitle className="text-2xl font-semibold">{outstandingFromMembers.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 text-xs text-muted-foreground">
            Total remaining amount members still need to pay
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">
              Collected This Month
            </CardDescription>
            <CardTitle className="text-2xl font-semibold">{collectedThisMonth.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 text-xs text-muted-foreground">
            Total amount collected from members this month
          </CardContent>
        </Card>
      </div>

      {canAddExpenses ? (
        <AddExpenseForm members={members ?? []} defaultDate={defaultDate} />
      ) : (
        <Card className="p-4 text-sm text-muted-foreground">
          You don&apos;t have permission to add utility expenses — ask your admin.
        </Card>
      )}
    </div>
  );
}
