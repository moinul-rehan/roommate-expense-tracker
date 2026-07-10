import Link from "next/link";
import { getDisplayName, getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import {
  currentMonthKey,
  getExpenseSharesByCategoryForMonth,
  getMemberCategoryBreakdown,
  getMonthlyDues,
  monthRange,
} from "@/lib/data/finance";
import { getMemberMealSummary } from "@/lib/data/meal";
import { getNotifications } from "@/lib/data/notifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-xs font-medium tracking-wide uppercase">
          {label}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold">{value}</CardTitle>
      </CardHeader>
      {hint && (
        <CardContent className="pt-0 text-xs text-muted-foreground">{hint}</CardContent>
      )}
    </Card>
  );
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const monthKey = currentMonthKey();
  const { start, end } = monthRange(monthKey);

  const [dues, categoryTotals, recentExpenses, { data: members }, notifications] =
    await Promise.all([
      getMonthlyDues(supabase, monthKey),
      getExpenseSharesByCategoryForMonth(supabase, monthKey),
      supabase
        .from("expenses")
        .select("id, category, amount, description, expense_date, payer:paid_by(first_name, last_name)")
        .gte("expense_date", start)
        .lt("expense_date", end)
        .order("expense_date", { ascending: false })
        .limit(8),
      supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true).order("last_name"),
      getNotifications(supabase, profile.id, 5),
    ]);

  const myDue = dues.get(profile.id) ?? { rent: 0, expenses: 0, paid: 0, due: 0 };
  const myCostBreakdown = getMemberCategoryBreakdown(categoryTotals, profile.id);
  const totalToPay = myDue.rent + myDue.expenses;
  const { rows: mealRows, mealRate, totalBazaar, totalMeals } = await getMemberMealSummary(
    supabase,
    monthKey,
    members ?? []
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Utility overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription className="text-xs font-medium tracking-wide uppercase">
                Your utility costs
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 pt-0 text-sm">
              {myCostBreakdown.map((c) => (
                <div key={c.category} className="flex justify-between">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-medium text-foreground">{c.amount.toFixed(2)} tk</span>
                </div>
              ))}
              {!myCostBreakdown.length && (
                <p className="text-muted-foreground">No utility costs yet this month.</p>
              )}
            </CardContent>
          </Card>
          <StatCard
            label="Total to pay"
            value={`${totalToPay.toFixed(2)} tk`}
            hint="All utility costs owed this month"
          />
          <StatCard
            label="Already paid"
            value={`${myDue.paid.toFixed(2)} tk`}
            hint="Settled so far this month"
          />
          <StatCard
            label="Balance / due"
            value={`${myDue.due.toFixed(2)} tk`}
            hint="Total to pay minus already paid"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Meal overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Meal rate" value={mealRate.toFixed(2)} hint="Total bazaar ÷ total meals" />
          <StatCard label="Total meals" value={String(totalMeals)} />
          <StatCard label="Total bazaar" value={totalBazaar.toFixed(2)} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Member meal summary</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mealRows.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  {getDisplayName(r)}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Total meals</p>
                  <p className="font-medium text-foreground">{r.meals}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deposit</p>
                  <p className="font-medium text-foreground">{r.deposit.toFixed(2)} tk</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Meal cost</p>
                  <p className="font-medium text-foreground">{r.cost.toFixed(2)} tk</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p
                    className={cn(
                      "font-semibold",
                      r.balance < 0 ? "text-destructive" : "text-emerald-600"
                    )}
                  >
                    {r.balance.toFixed(2)} tk
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {!mealRows.length && (
            <Card className="p-4 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              No meal data yet.
            </Card>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Recent activity</h2>
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Paid by</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentExpenses.data?.map((e) => {
                const payer = e.payer as unknown as { first_name: string; last_name: string | null } | null;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{e.expense_date}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{e.category}</TableCell>
                    <TableCell className="text-muted-foreground">{e.description ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {payer ? getDisplayName(payer) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(e.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!recentExpenses.data?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    No expenses recorded this month yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          <Link href="/notifications" className="text-sm text-muted-foreground hover:text-foreground underline">
            View all
          </Link>
        </div>
        <Card className="p-0">
          <Table>
            <TableBody>
              {notifications.map((n) => (
                <TableRow key={n.id} className={n.is_read ? undefined : "bg-accent/40"}>
                  <TableCell className="font-medium text-foreground">{n.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {!notifications.length && (
                <TableRow>
                  <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                    No notifications yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
