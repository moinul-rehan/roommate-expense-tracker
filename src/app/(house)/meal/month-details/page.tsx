import Link from "next/link";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getActiveMonthKey, formatMonthKey } from "@/lib/data/months";
import {
  getDailyMealRecords,
  getDepositRecords,
  getBazaarRecords,
  pivotDailyMealsByDate,
} from "@/lib/data/meal";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Download } from "lucide-react";
import { EditMealRowDialog } from "./EditMealRowDialog";
import { EditDepositDialog } from "./EditDepositDialog";
import { EditBazaarDialog } from "./EditBazaarDialog";
import { ViewBazaarDialog } from "./ViewBazaarDialog";

const VIEWS = [
  { value: "meal", label: "Meal Details" },
  { value: "deposit", label: "Deposit" },
  { value: "cost", label: "Meal Cost" },
] as const;

type ViewValue = (typeof VIEWS)[number]["value"];

function MemberCell({ member }: { member: { first_name: string; last_name: string | null; avatar_url: string | null } | null }) {
  if (!member) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex items-center gap-2">
      <Avatar size="sm">
        <AvatarImage src={member.avatar_url ?? undefined} alt={getDisplayName(member)} />
        <AvatarFallback>{member.first_name[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      {getDisplayName(member)}
    </span>
  );
}

export default async function MealMonthDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);
  const activeView: ViewValue = VIEWS.some((v) => v.value === view) ? (view as ViewValue) : "meal";

  const canEditMeals = profile.role === "super_admin" || profile.can_add_meals;
  const canEditBazaar = profile.role === "super_admin" || profile.can_add_bazaar;
  const canEditDeposits = profile.role === "super_admin";

  const [{ data: members }, mealRecords, depositRecords, bazaarRecords] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true).order("last_name"),
    activeView === "meal" ? getDailyMealRecords(supabase, monthKey) : Promise.resolve([]),
    activeView === "deposit" ? getDepositRecords(supabase, monthKey) : Promise.resolve([]),
    activeView === "cost" ? getBazaarRecords(supabase, monthKey) : Promise.resolve([]),
  ]);

  const memberList = members ?? [];
  const { rows: pivotRows, totals } = pivotDailyMealsByDate(mealRecords, memberList);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Month Details — {formatMonthKey(monthKey)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Full meal, deposit and cost records for every member in the active month.
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href="/meal/month-details/pdf" download />}
          className="shrink-0 gap-1.5"
        >
          <Download className="size-4" />
          Download PDF
        </Button>
      </div>

      <div className="inline-flex w-fit gap-1 rounded-lg border p-1">
        {VIEWS.map((v) => (
          <Link
            key={v.value}
            href={`/meal/month-details?view=${v.value}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              activeView === v.value
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {activeView === "meal" && (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                {memberList.map((m) => (
                  <TableHead key={m.id} className="text-right">
                    {getDisplayName(m)}
                  </TableHead>
                ))}
                {canEditMeals && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pivotRows.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="text-muted-foreground">{formatDate(row.date)}</TableCell>
                  {row.counts.map((count, i) => (
                    <TableCell key={memberList[i].id} className="text-right font-medium">
                      {count || "—"}
                    </TableCell>
                  ))}
                  {canEditMeals && (
                    <TableCell className="text-right">
                      <EditMealRowDialog date={row.date} members={memberList} counts={row.counts} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {!pivotRows.length && (
                <TableRow>
                  <TableCell
                    colSpan={memberList.length + 1 + (canEditMeals ? 1 : 0)}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No meal entries for {monthKey} yet.
                  </TableCell>
                </TableRow>
              )}
              {!!pivotRows.length && (
                <TableRow className="border-t bg-muted/30 font-semibold">
                  <TableCell className="text-foreground">Total</TableCell>
                  {totals.map((t, i) => (
                    <TableCell key={memberList[i].id} className="text-right text-foreground">
                      {t}
                    </TableCell>
                  ))}
                  {canEditMeals && <TableCell />}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {activeView === "deposit" && (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {canEditDeposits && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {depositRecords.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{formatDate(r.deposit_date)}</TableCell>
                  <TableCell className="text-foreground">
                    <MemberCell member={r.member} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.note ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium">{Number(r.amount).toFixed(2)} tk</TableCell>
                  {canEditDeposits && (
                    <TableCell className="text-right">
                      <EditDepositDialog
                        id={r.id}
                        amount={Number(r.amount)}
                        depositDate={r.deposit_date}
                        note={r.note}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {!depositRecords.length && (
                <TableRow>
                  <TableCell colSpan={canEditDeposits ? 5 : 4} className="py-6 text-center text-muted-foreground">
                    No deposits for {monthKey} yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {activeView === "cost" && (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Spent by</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bazaarRecords.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{formatDate(r.entry_date)}</TableCell>
                  <TableCell className="text-foreground">
                    <MemberCell member={r.member} />
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {r.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">{Number(r.amount).toFixed(2)} tk</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <ViewBazaarDialog
                        entryDate={r.entry_date}
                        amount={Number(r.amount)}
                        description={r.description}
                        member={r.member}
                      />
                      {canEditBazaar && (
                        <EditBazaarDialog
                          id={r.id}
                          amount={Number(r.amount)}
                          entryDate={r.entry_date}
                          description={r.description}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!bazaarRecords.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    No bazaar entries for {monthKey} yet.
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
