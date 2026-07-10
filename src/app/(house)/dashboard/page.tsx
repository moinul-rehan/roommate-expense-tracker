import { getDisplayName, getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import {
  currentMonthKey,
  getExpenseSharesByCategoryForMonth,
  getMemberCategoryBreakdown,
  getMonthlyDues,
} from "@/lib/data/finance";
import { getMemberMealSummary } from "@/lib/data/meal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const [dues, categoryTotals, { data: members }] = await Promise.all([
    getMonthlyDues(supabase, monthKey),
    getExpenseSharesByCategoryForMonth(supabase, monthKey),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .eq("is_active", true)
      .order("last_name"),
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
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Avatar size="sm">
                    <AvatarImage src={r.avatar_url ?? undefined} alt={getDisplayName(r)} />
                    <AvatarFallback>{r.first_name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
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
    </div>
  );
}
