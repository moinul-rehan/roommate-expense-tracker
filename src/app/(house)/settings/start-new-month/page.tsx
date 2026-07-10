import { requireSuperAdmin, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { currentMonthKey, getMonthlyDues } from "@/lib/data/finance";
import { CloseMonthButton } from "./CloseMonthButton";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function StartNewMonthPage() {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();
  const monthKey = currentMonthKey();

  const [{ data: members }, dues, { data: closure }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name").order("last_name"),
    getMonthlyDues(supabase, monthKey),
    supabase
      .from("month_closures")
      .select("id")
      .eq("cottage_id", profile.cottage_id)
      .eq("month_key", monthKey)
      .maybeSingle(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Start New Month</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review {monthKey} before closing it out. Once closed, expenses and settlements dated
          within it can no longer be added, edited, or deleted.
        </p>
      </div>

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
  );
}
