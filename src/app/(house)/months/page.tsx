import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getActiveMonthKey, getActiveMonthSummary, getMonthHistory, formatMonthKey } from "@/lib/data/months";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonthActionButtons } from "./MonthActionButtons";
import { SetActiveMonthCard } from "./SetActiveMonthCard";
import { ActivateMonthButton } from "../history/ActivateMonthButton";
import { DeleteMonthButton } from "../history/DeleteMonthButton";
import { formatDate } from "@/lib/format-date";

export default async function MonthsPage() {
  const profile = await getCurrentProfile();
  const isSuperAdmin = profile.role === "super_admin";
  const supabase = await createClient();
  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);
  const [summary, history] = await Promise.all([
    getActiveMonthSummary(supabase, profile.cottage_id, monthKey),
    getMonthHistory(supabase, profile.cottage_id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Months</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSuperAdmin
            ? "Manage the active month and browse locked history. Setting a new active month locks this one into history and opens the one you pick (you can't open a month that hasn't started yet); resetting clears the active month's data without locking it. All actions require your password to confirm."
            : "The active month and every locked month's summary."}
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

      {isSuperAdmin && (
        <>
          <SetActiveMonthCard currentMonthKey={monthKey} />
          <MonthActionButtons monthKey={monthKey} />
        </>
      )}

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">History</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Locked months. A month lands here once a different month is set active.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {history.map((m) => (
            <Card key={m.monthKey}>
              <CardHeader>
                <CardDescription className="text-xs font-medium tracking-wide uppercase">
                  Locked {m.closedAt ? formatDate(new Date(m.closedAt)) : ""}
                </CardDescription>
                <CardTitle className="text-xl font-semibold">{formatMonthKey(m.monthKey)}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total utility due</p>
                    <p className="font-medium text-foreground">{m.totalUtilityDue.toFixed(2)} tk</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total bazaar</p>
                    <p className="font-medium text-foreground">{m.totalBazaar.toFixed(2)} tk</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total meals</p>
                    <p className="font-medium text-foreground">{m.totalMeals}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Meal rate</p>
                    <p className="font-medium text-foreground">{m.mealRate.toFixed(2)} tk</p>
                  </div>
                </div>
                {isSuperAdmin && (
                  <div className="flex gap-2">
                    <ActivateMonthButton monthKey={m.monthKey} />
                    <DeleteMonthButton monthKey={m.monthKey} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {!history.length && (
            <Card className="p-4 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              No locked months yet{isSuperAdmin ? " — set a different month active to start building history." : "."}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
