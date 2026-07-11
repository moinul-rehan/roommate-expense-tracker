import { Wallet, Receipt, HandCoins, UtensilsCrossed, ShoppingBasket } from "lucide-react";
import { getDisplayName, getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import {
  getExpenseSharesByCategoryForMonth,
  getMemberCategoryBreakdown,
  getMonthlyDues,
} from "@/lib/data/finance";
import { getActiveMonthKey } from "@/lib/data/months";
import { getMemberMealSummary } from "@/lib/data/meal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="flex-row items-center gap-4 rounded-2xl p-5">
      <div className="flex size-[54px] shrink-0 items-center justify-center rounded-2xl bg-accent">
        <Icon className="size-6 text-accent-foreground" />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="truncate text-xl font-semibold text-foreground">{value}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  );
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);

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
        <h2 className="mb-3 text-lg font-semibold text-foreground">Utility overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl p-5">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Your utility costs
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 px-0 text-sm">
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
            icon={Wallet}
            label="Total to pay"
            value={`${totalToPay.toFixed(2)} tk`}
            hint="All utility costs owed this month"
          />
          <StatCard
            icon={HandCoins}
            label="Already paid"
            value={`${myDue.paid.toFixed(2)} tk`}
            hint="Settled so far this month"
          />
          <StatCard
            icon={Receipt}
            label="Balance / due"
            value={`${myDue.due.toFixed(2)} tk`}
            hint="Total to pay minus already paid"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Meal overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={UtensilsCrossed}
            label="Meal rate"
            value={mealRate.toFixed(2)}
            hint="Total bazaar ÷ total meals"
          />
          <StatCard icon={UtensilsCrossed} label="Total meals" value={String(totalMeals)} />
          <StatCard icon={ShoppingBasket} label="Total bazaar" value={totalBazaar.toFixed(2)} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Member meal summary</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mealRows.map((r) => (
            <Card key={r.id} className="rounded-2xl p-5">
              <CardHeader className="px-0 pt-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Avatar size="sm">
                    <AvatarImage src={r.avatar_url ?? undefined} alt={getDisplayName(r)} />
                    <AvatarFallback>{r.first_name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {getDisplayName(r)}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 px-0 text-sm">
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
            <Card className="rounded-2xl p-4 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              No meal data yet.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
