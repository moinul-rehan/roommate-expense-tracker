import Link from "next/link";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getMonthlyExpenseHistory, getUtilityDepositHistory } from "@/lib/data/finance";
import { getActiveMonthKey } from "@/lib/data/months";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format-date";

const TABS = [
  { value: "expense", label: "Expense History" },
  { value: "member", label: "Member Deposit History" },
  { value: "cottage", label: "Cottage Deposit History" },
] as const;

export default async function UtilityHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab = TABS.some((t) => t.value === tabParam) ? tabParam! : "expense";

  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const [{ data: members }, expenses, deposits] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true).order("last_name"),
    getMonthlyExpenseHistory(supabase, monthKey),
    getUtilityDepositHistory(supabase, profile.cottage_id, monthKey),
  ]);

  const membersById = new Map((members ?? []).map((m) => [m.id, m]));
  const memberDeposits = deposits.filter((d) => d.source_type === "member");
  const cottageDeposits = deposits.filter((d) => d.source_type === "addition");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Utility History — {monthKey}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Read-only record of every utility expense and deposit. No calculations happen here.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/utilities/history?tab=${t.value}`}
            className={cn(
              "rounded-md px-2.5 py-1",
              tab === t.value ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "expense" && (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment Source</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-muted-foreground">{formatDate(e.expense_date)}</TableCell>
                  <TableCell className="text-muted-foreground">{UTILITY_CATEGORY_LABELS[e.category] ?? e.category}</TableCell>
                  <TableCell className="text-muted-foreground">{e.description ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.payment_source === "cottage_balance"
                      ? "Cottage Balance"
                      : e.payment_source === "member"
                        ? "Member" + (e.payer ? " — " + getDisplayName(e.payer) : "")
                        : "None"}
                  </TableCell>
                  <TableCell className="text-right font-medium">{e.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {!expenses.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    No utility expenses for {monthKey} yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {tab === "member" && (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberDeposits.map((d) => {
                const member = d.user_id ? membersById.get(d.user_id) : null;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="text-muted-foreground">{member ? getDisplayName(member) : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(d.deposit_date)}</TableCell>
                    <TableCell className="text-muted-foreground">{d.note ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">{d.amount.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
              {!memberDeposits.length && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    No Member Utility Deposits for {monthKey} yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {tab === "cottage" && (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cottageDeposits.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-muted-foreground">{d.deposit_date}</TableCell>
                  <TableCell className="text-muted-foreground">{d.note ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium">{d.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {!cottageDeposits.length && (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                    No Cottage Deposits for {monthKey} yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
