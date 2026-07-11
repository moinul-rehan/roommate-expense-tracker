import Link from "next/link";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getCottageBalance, getCurrentRents, monthRange } from "@/lib/data/finance";
import { getActiveMonthKey, defaultDateForMonth } from "@/lib/data/months";
import { AddExpenseForm } from "./AddExpenseForm";
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

const CATEGORIES = [
  "house_rent",
  "electricity",
  "servant",
  "trash",
  "internet",
  "filter_kit",
  "other",
] as const;

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  house_rent: "House Rent",
  electricity: "Electricity",
  servant: "Servant Cost",
  trash: "Trash Cost",
  internet: "Internet Cost",
  filter_kit: "Filter Kit Cost",
  other: "Other",
};

export default async function UtilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);
  const { start, end } = monthRange(monthKey);

  const [{ data: members }, expensesQuery, cottageBalance, rents] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("is_active", true)
      .order("last_name"),
    (async () => {
      let query = supabase
        .from("expenses")
        .select(
          "id, category, amount, description, expense_date, split_type, payment_source, payer:paid_by(first_name, last_name)"
        )
        .gte("expense_date", start)
        .lt("expense_date", end)
        .order("expense_date", { ascending: false })
        .limit(50);
      if (category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
        query = query.eq("category", category);
      }
      return query;
    })(),
    getCottageBalance(supabase, profile.cottage_id),
    getCurrentRents(supabase),
  ]);

  const expenses = expensesQuery.data ?? [];
  const canAddExpenses = profile.role === "super_admin" || profile.can_add_expenses;
  const rentRows = Array.from(rents.entries()).map(([user_id, r]) => ({
    user_id,
    monthly_rent_amount: r.monthly_rent_amount,
  }));
  const defaultDate = defaultDateForMonth(monthKey);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Utilities — {monthKey}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            House rent, electricity, servant, trash, internet, filter kit and other shared costs.
            Private to the household — not shown in the Meal ledger.
          </p>
        </div>
        <Card className="w-full sm:w-auto">
          <CardHeader className="pb-0">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">
              Cottage Balance
            </CardDescription>
            <CardTitle className="text-2xl font-semibold">{cottageBalance.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 text-xs text-muted-foreground">
            Shared pool expenses can be paid from
          </CardContent>
        </Card>
      </div>

      {canAddExpenses ? (
        <AddExpenseForm
          members={members ?? []}
          rents={rentRows}
          defaultDate={defaultDate}
          isSuperAdmin={profile.role === "super_admin"}
        />
      ) : (
        <Card className="p-4 text-sm text-muted-foreground">
          You don&apos;t have permission to add expenses — ask your admin.
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1 text-sm">
          <Link
            href="/utilities"
            className={cn(
              "rounded-md px-2.5 py-1",
              !category ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/utilities?category=${c}`}
              className={cn(
                "rounded-md px-2.5 py-1",
                category === c ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {CATEGORY_LABELS[c]}
            </Link>
          ))}
        </div>

        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Paid by</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Split</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => {
                const payer = e.payer as unknown as { first_name: string; last_name: string | null } | null;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{e.expense_date}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {CATEGORY_LABELS[e.category as (typeof CATEGORIES)[number]] ?? e.category}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.description ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.payment_source === "cottage_balance"
                        ? "Cottage Balance"
                        : payer
                          ? getDisplayName(payer)
                          : "—"}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {e.payment_source === "cottage_balance" ? "Cottage Balance" : "Member"}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{e.split_type}</TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(e.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!expenses.length && (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                    No utility expenses for {monthKey} yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/settle-up" className="text-muted-foreground hover:text-foreground underline">
          Settle up
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link href="/history" className="text-muted-foreground hover:text-foreground underline">
          History
        </Link>
      </div>
    </div>
  );
}
