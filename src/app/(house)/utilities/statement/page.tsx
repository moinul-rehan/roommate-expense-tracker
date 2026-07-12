import { requireSuperAdmin, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getMonthlyDues, getDefaultCosts } from "@/lib/data/finance";
import { getActiveMonthKey, formatMonthKey } from "@/lib/data/months";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtilityAdjustmentForm } from "./UtilityAdjustmentForm";
import { DeleteAdjustmentButton } from "./DeleteAdjustmentButton";
import { cn } from "@/lib/utils";

export default async function UtilityStatementPage() {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();
  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const [{ data: members }, dues, adjustmentsQuery, defaultCosts] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("is_active", true)
      .order("last_name"),
    getMonthlyDues(supabase, profile.cottage_id, monthKey),
    supabase
      .from("utility_adjustments")
      .select("id, user_id, category, amount")
      .eq("cottage_id", profile.cottage_id)
      .eq("month_key", monthKey)
      .order("created_at"),
    getDefaultCosts(supabase, profile.cottage_id),
  ]);

  const defaultCostsByCategory = Object.fromEntries(
    Array.from(defaultCosts.entries()).map(([category, rows]) => [
      category,
      Object.fromEntries(rows.map((r) => [r.user_id, r.amount])),
    ])
  );

  const adjustmentsByUser = new Map<string, { id: string; category: string; amount: number }[]>();
  for (const row of adjustmentsQuery.data ?? []) {
    const list = adjustmentsByUser.get(row.user_id) ?? [];
    list.push({ id: row.id, category: row.category, amount: Number(row.amount) });
    adjustmentsByUser.set(row.user_id, list);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Member Utility Statements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate the final utility bill for {formatMonthKey(monthKey)} — every cost line,
          discount and manual adjustment shown here is what distributes money to members. Utility
          Expenses recorded on Utility Details don&apos;t appear until added here.
        </p>
      </div>

      <UtilityAdjustmentForm members={members ?? []} monthKey={monthKey} defaultCosts={defaultCostsByCategory} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Member Statements</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(members ?? []).map((m) => {
            const lines = adjustmentsByUser.get(m.id) ?? [];
            const due = dues.get(m.id) ?? { rent: 0, expenses: 0, paid: 0, due: 0 };
            const assignedCost = due.rent + due.expenses;
            const remaining = due.due;
            const isPaid = assignedCost > 0 && remaining <= 0;

            return (
              <Card key={m.id} className="rounded-2xl p-5">
                <CardHeader className="px-0 pt-0 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                    {getDisplayName(m)}
                    {isPaid && (
                      <Badge className="bg-emerald-600/15 text-emerald-600">Paid</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 px-0 text-sm">
                  <div className="flex flex-col gap-1.5">
                    {lines.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                          {UTILITY_CATEGORY_LABELS[a.category] ?? a.category}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className={cn("font-medium", a.amount >= 0 ? "text-destructive" : "text-emerald-600")}>
                            {a.amount >= 0 ? "+" : "−"}
                            {Math.abs(a.amount).toFixed(2)} tk
                          </span>
                          <DeleteAdjustmentButton id={a.id} />
                        </span>
                      </div>
                    ))}

                    {!lines.length && <p className="text-muted-foreground">No statement lines yet.</p>}
                  </div>

                  <div className="flex flex-col gap-1 border-t pt-2">
                    <div className="flex justify-between font-semibold text-foreground">
                      <span>Assigned Cost</span>
                      <span>{assignedCost.toFixed(2)} tk</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Paid</span>
                      <span>{due.paid.toFixed(2)} tk</span>
                    </div>
                    <div
                      className={cn(
                        "flex justify-between text-base font-semibold",
                        remaining < 0 ? "text-emerald-600" : "text-destructive"
                      )}
                    >
                      <span>{remaining < 0 ? "Advance Balance" : "Remaining Due"}</span>
                      <span>{Math.abs(remaining).toFixed(2)} tk</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!members?.length && (
            <Card className="p-4 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              No active members yet.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
