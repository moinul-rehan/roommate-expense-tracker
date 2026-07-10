import { requireSuperAdmin, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { currentMonthKey, getMonthlyDues } from "@/lib/data/finance";
import { getArchivedMealMonths } from "@/lib/data/meal";
import { CloseMonthButton } from "./CloseMonthButton";
import { CloseMealMonthButton } from "./CloseMealMonthButton";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function MonthsPage() {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();
  const monthKey = currentMonthKey();

  const [{ data: members }, dues, { data: closure }, { data: mealClosure }, archivedMealMonths] =
    await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name").order("last_name"),
      getMonthlyDues(supabase, monthKey),
      supabase
        .from("month_closures")
        .select("id")
        .eq("cottage_id", profile.cottage_id)
        .eq("month_key", monthKey)
        .maybeSingle(),
      supabase
        .from("meal_months")
        .select("id")
        .eq("cottage_id", profile.cottage_id)
        .eq("month_key", monthKey)
        .eq("is_archived", true)
        .maybeSingle(),
      getArchivedMealMonths(supabase, profile.cottage_id),
    ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Months</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Close out the current Meal or Utility month. Meal months are archived (not deleted);
          only the current and last two are shown elsewhere in the app. Utility history is kept
          for all months.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">Utility month — {monthKey}</h2>
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Rent</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((m) => {
                const due = dues.get(m.id) ?? { rent: 0, expenses: 0, paid: 0, due: 0 };
                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-foreground">{getDisplayName(m)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{due.rent.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{due.expenses.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{due.paid.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">{due.due.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        <CloseMonthButton monthKey={monthKey} alreadyClosed={!!closure} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">Meal month — {monthKey}</h2>
        <p className="text-sm text-muted-foreground">
          Closing archives this meal month and carries each member&apos;s meal balance
          (deposit − meal cost) into next month&apos;s Utility ledger as a carry-in line.
        </p>
        <CloseMealMonthButton monthKey={monthKey} alreadyClosed={!!mealClosure} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Archived meal months</h2>
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Closed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedMealMonths.map((m) => (
                <TableRow key={m.month_key}>
                  <TableCell className="text-foreground">{m.month_key}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.closed_at ? new Date(m.closed_at).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {!archivedMealMonths.length && (
                <TableRow>
                  <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                    No archived meal months yet.
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
