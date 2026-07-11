import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getActiveMonthKey, getActiveMonthSummary, formatMonthKey } from "@/lib/data/months";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonthActionButtons } from "./MonthActionButtons";
import { SetActiveMonthCard } from "./SetActiveMonthCard";

export default async function MonthsPage() {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();
  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);
  const summary = await getActiveMonthSummary(supabase, profile.cottage_id, monthKey);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Months</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the active month. Setting a new active month locks this one into History and
          opens the one you pick (you can&apos;t open a month that hasn&apos;t started yet);
          resetting clears the active month&apos;s data without locking it. All actions require
          your password to confirm.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">
              Active month
            </CardDescription>
            <Badge variant="default">Active</Badge>
          </div>
          <CardTitle className="text-2xl font-semibold">{formatMonthKey(monthKey)}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Total utility due</p>
            <p className="font-medium text-foreground">{summary.totalUtilityDue.toFixed(2)} tk</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total bazaar</p>
            <p className="font-medium text-foreground">{summary.totalBazaar.toFixed(2)} tk</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total meals</p>
            <p className="font-medium text-foreground">{summary.totalMeals}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Meal rate</p>
            <p className="font-medium text-foreground">{summary.mealRate.toFixed(2)} tk</p>
          </div>
        </CardContent>
      </Card>

      <SetActiveMonthCard currentMonthKey={monthKey} />

      <MonthActionButtons monthKey={monthKey} />
    </div>
  );
}
