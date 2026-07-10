import { createClient } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/data/dal";
import { currentMonthKey, getMonthlyDues, monthRange } from "@/lib/data/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CATEGORIES = [
  "house_rent",
  "electricity",
  "servant",
  "trash",
  "internet",
  "filter_kit",
  "other",
] as const;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; category?: string }>;
}) {
  const params = await searchParams;
  const monthKey = params.month ?? currentMonthKey();
  const category = params.category;
  const { start, end } = monthRange(monthKey);
  const supabase = await createClient();

  let expensesQuery = supabase
    .from("expenses")
    .select("id, category, amount, description, expense_date, payer:paid_by(first_name, last_name)")
    .gte("expense_date", start)
    .lt("expense_date", end)
    .order("expense_date", { ascending: false });

  if (category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    expensesQuery = expensesQuery.eq("category", category);
  }

  const [{ data: expenses }, dues, { data: members }] = await Promise.all([
    expensesQuery,
    getMonthlyDues(supabase, monthKey),
    supabase.from("profiles").select("id, first_name, last_name").order("last_name"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">Past months, filterable by category.</p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="month">Month</Label>
          <Input id="month" name="month" type="month" defaultValue={monthKey} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select name="category" defaultValue={category ?? "all"}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Apply</Button>
      </form>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Per-member dues this month</h2>
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
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Expenses</h2>
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
              {expenses?.map((e) => {
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
              {!expenses?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    No expenses for this period.
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
