import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getMonthHistory } from "@/lib/data/months";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivateMonthButton } from "./ActivateMonthButton";

export default async function HistoryPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const months = await getMonthHistory(supabase, profile.cottage_id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Locked months. Utility history is kept for all months that have been created and
          locked via the Months page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {months.map((m) => (
          <Card key={m.monthKey}>
            <CardHeader>
              <CardDescription className="text-xs font-medium tracking-wide uppercase">
                Locked {m.closedAt ? new Date(m.closedAt).toLocaleDateString() : ""}
              </CardDescription>
              <CardTitle className="text-xl font-semibold">{m.monthKey}</CardTitle>
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
              {profile.role === "super_admin" && <ActivateMonthButton monthKey={m.monthKey} />}
            </CardContent>
          </Card>
        ))}
        {!months.length && (
          <Card className="p-4 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            No locked months yet — use Months → Create New Month to start building history.
          </Card>
        )}
      </div>
    </div>
  );
}
