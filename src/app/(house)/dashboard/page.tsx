import { Wallet, Receipt, HandCoins, UtensilsCrossed, ShoppingBasket } from "lucide-react";
import { getDisplayName, getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getCottageBalance, getMonthlyDues, getMonthlyExpenseTotal } from "@/lib/data/finance";
import { getActiveMonthKey } from "@/lib/data/months";
import { getMemberMealSummary } from "@/lib/data/meal";
import { getMyNextBazaarDuty } from "@/lib/data/bazaar-duty";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";
import { formatDate } from "@/lib/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UtilityBreakdownDialog } from "./UtilityBreakdownDialog";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const statCardTones = {
  blue: "bg-[#FBEAE5] text-[#DE7356]",
  green: "bg-[#63B64E]/15 text-[#63B64E]",
  orange: "bg-[#FA9033]/15 text-[#FA9033]",
  red: "bg-[#FF4F4F]/15 text-[#FF4F4F]",
} as const;

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
  paid = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof statCardTones;
  paid?: boolean;
}) {
  return (
    <Card className="flex-row items-center gap-4 rounded-2xl p-5">
      <div className={cn("flex size-[54px] shrink-0 items-center justify-center rounded-2xl", statCardTones[tone])}>
        <Icon className="size-6" />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          {paid && <Badge className="bg-emerald-600/15 text-emerald-600">Paid</Badge>}
        </div>
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

  const [dues, cottageBalance, totalUtilityExpense, { data: members }, myBazaarDuty, myAdjustmentsQuery] =
    await Promise.all([
      getMonthlyDues(supabase, profile.cottage_id, monthKey),
      getCottageBalance(supabase, profile.cottage_id),
      getMonthlyExpenseTotal(supabase, monthKey),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .eq("is_active", true)
        .order("last_name"),
      getMyNextBazaarDuty(supabase, profile.id),
      supabase
        .from("utility_adjustments")
        .select("id, category, amount")
        .eq("cottage_id", profile.cottage_id)
        .eq("month_key", monthKey)
        .eq("user_id", profile.id)
        .order("created_at"),
    ]);

  const outstandingFromMembers = Array.from(dues.values()).reduce((sum, d) => sum + Math.max(0, d.due), 0);
  const collectedThisMonth = Array.from(dues.values()).reduce((sum, d) => sum + d.paid, 0);
  const myDue = dues.get(profile.id) ?? { rent: 0, expenses: 0, paid: 0, due: 0 };
  const myAssignedCost = myDue.rent + myDue.expenses;
  const myBreakdownLines = (myAdjustmentsQuery.data ?? []).map((a) => ({
    id: a.id,
    label: UTILITY_CATEGORY_LABELS[a.category] ?? a.category,
    amount: Number(a.amount),
  }));
  const { rows: mealRows, mealRate, totalBazaar, totalMeals } = await getMemberMealSummary(
    supabase,
    monthKey,
    members ?? []
  );

  return (
    <div className="flex flex-col gap-8">
      {myBazaarDuty && (
        <Card className="flex-row items-center gap-4 rounded-2xl border-none bg-[#FBEAE5] p-5">
          <div className="flex size-[54px] shrink-0 items-center justify-center rounded-2xl bg-white/60 text-[#DE7356]">
            <ShoppingBasket className="size-6" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-sm font-medium text-[#DE7356]">Your bazaar duty</p>
            <p className="text-lg font-semibold text-foreground">
              {formatDutyRange(myBazaarDuty.start_date, myBazaarDuty.end_date)}
            </p>
            {myBazaarDuty.note && <p className="text-sm text-muted-foreground">{myBazaarDuty.note}</p>}
          </div>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Utility overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Wallet}
            tone="blue"
            label="Cottage Balance"
            value={`${cottageBalance.toFixed(2)} tk`}
            hint="Previous + deposits − cottage-paid expenses"
          />
          <StatCard
            icon={Receipt}
            tone="orange"
            label="Total Utility Expense"
            value={`${totalUtilityExpense.toFixed(2)} tk`}
            hint="All shared expenses this month"
          />
          <StatCard
            icon={HandCoins}
            tone="red"
            label="Outstanding From Members"
            value={`${outstandingFromMembers.toFixed(2)} tk`}
            hint="Sum of every member's Remaining Due"
          />
          <StatCard
            icon={HandCoins}
            tone="green"
            label="Collected This Month"
            value={`${collectedThisMonth.toFixed(2)} tk`}
            hint="Member Utility Deposits received"
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Your utility summary</h2>
          <UtilityBreakdownDialog
            lines={myBreakdownLines}
            assignedCost={myAssignedCost}
            paid={myDue.paid}
            due={myDue.due}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={Receipt}
            tone="blue"
            label="Assigned Cost"
            value={`${myAssignedCost.toFixed(2)} tk`}
            hint="Your utility costs this month"
          />
          <StatCard
            icon={HandCoins}
            tone="green"
            label="Paid"
            value={`${myDue.paid.toFixed(2)} tk`}
            hint="Deposits credited toward your due"
          />
          <StatCard
            icon={Wallet}
            tone={myDue.due > 0 ? "red" : "orange"}
            label={myDue.due < 0 ? "Advance Balance" : "Remaining Due"}
            value={`${Math.abs(myDue.due).toFixed(2)} tk`}
            hint="Assigned Cost minus Paid"
            paid={myAssignedCost > 0 && myDue.due <= 0}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Meal overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={UtensilsCrossed}
            tone="blue"
            label="Meal rate"
            value={mealRate.toFixed(2)}
            hint="Total bazaar ÷ total meals"
          />
          <StatCard
            icon={UtensilsCrossed}
            tone="green"
            label="Total meals"
            value={String(totalMeals)}
          />
          <StatCard
            icon={ShoppingBasket}
            tone="orange"
            label="Total bazaar"
            value={totalBazaar.toFixed(2)}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Member meal summary</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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

function formatDutyRange(startIso: string, endIso: string) {
  return `${formatDate(startIso)} – ${formatDate(endIso)}`;
}
