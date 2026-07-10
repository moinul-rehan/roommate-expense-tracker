import Link from "next/link";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import {
  currentMonthKey,
  getAmountOwedToUser,
  getCottageBalance,
  getMonthlyDues,
  monthRange,
} from "@/lib/data/finance";
import { getMemberMealSummary } from "@/lib/data/meal";
import { getNotifications } from "@/lib/data/notifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/verified-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-xs font-medium tracking-wide uppercase">
          {label}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold">{value}</CardTitle>
      </CardHeader>
      {hint && (
        <CardContent className="pt-0 text-xs text-muted-foreground">{hint}</CardContent>
      )}
    </Card>
  );
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const monthKey = currentMonthKey();
  const { start, end } = monthRange(monthKey);

  const [dues, owedToYou, recentExpenses, cottageBalance, { data: members }, notifications] =
    await Promise.all([
      getMonthlyDues(supabase, monthKey),
      getAmountOwedToUser(supabase, profile.id, monthKey),
      supabase
        .from("expenses")
        .select("id, category, amount, description, expense_date, payer:paid_by(first_name, last_name)")
        .gte("expense_date", start)
        .lt("expense_date", end)
        .order("expense_date", { ascending: false })
        .limit(8),
      getCottageBalance(supabase, profile.cottage_id),
      supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true).order("last_name"),
      getNotifications(supabase, profile.id, 5),
    ]);

  const myDue = dues.get(profile.id) ?? { rent: 0, expenses: 0, paid: 0, due: 0 };
  const { rows: mealRows, mealRate, totalBazaar, totalMeals } = await getMemberMealSummary(
    supabase,
    monthKey,
    members ?? []
  );
  const myMeal = mealRows.find((r) => r.id === profile.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="size-12">
            <AvatarImage src={profile.avatar_url ?? undefined} alt={getDisplayName(profile)} />
            <AvatarFallback>{profile.first_name[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="flex items-center gap-1.5 text-xl font-semibold text-foreground">
              Welcome, {getDisplayName(profile)}
              <VerifiedBadge
                role={profile.role}
                can_add_expenses={profile.can_add_expenses}
                can_add_bazaar={profile.can_add_bazaar}
                can_add_meals={profile.can_add_meals}
              />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here&apos;s where things stand for{" "}
              {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}.
            </p>
          </div>
        </div>
        {profile.role === "super_admin" && (
          <Card className="w-full sm:w-auto">
            <CardContent className="flex items-center gap-3 py-3">
              <div className="text-sm">
                <p className="font-medium text-foreground">Growing the Cottage?</p>
                <p className="text-muted-foreground">Invite a new member.</p>
              </div>
              <Button size="sm" nativeButton={false} render={<Link href="/members" />}>
                Add a member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Utility overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Rent" value={myDue.rent.toFixed(2)} />
          <StatCard label="Your expense share" value={myDue.expenses.toFixed(2)} />
          <StatCard
            label="You owe this month"
            value={myDue.due.toFixed(2)}
            hint="Rent + share, minus what you've settled"
          />
          <StatCard
            label="Others owe you"
            value={owedToYou.toFixed(2)}
            hint="From expenses you fronted"
          />
          <StatCard label="Cottage Balance" value={cottageBalance.toFixed(2)} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Meal overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Meal rate" value={mealRate.toFixed(2)} hint="Total bazaar ÷ total meals" />
          <StatCard label="Total meals" value={String(totalMeals)} />
          <StatCard label="Total bazaar" value={totalBazaar.toFixed(2)} />
          <StatCard
            label="Your meal balance"
            value={(myMeal?.balance ?? 0).toFixed(2)}
            hint="Deposit minus meal cost"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Recent activity</h2>
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
              {recentExpenses.data?.map((e) => {
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
              {!recentExpenses.data?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    No expenses recorded this month yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Member meal summary</h2>
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Meals</TableHead>
                <TableHead className="text-right">Deposit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mealRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-foreground">{getDisplayName(r)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{r.meals}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{r.deposit.toFixed(2)}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium",
                      r.balance < 0 ? "text-destructive" : "text-emerald-600"
                    )}
                  >
                    {r.balance.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {!mealRows.length && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    No meal data yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          <Link href="/notifications" className="text-sm text-muted-foreground hover:text-foreground underline">
            View all
          </Link>
        </div>
        <Card className="p-0">
          <Table>
            <TableBody>
              {notifications.map((n) => (
                <TableRow key={n.id} className={n.is_read ? undefined : "bg-accent/40"}>
                  <TableCell className="font-medium text-foreground">{n.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {!notifications.length && (
                <TableRow>
                  <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                    No notifications yet.
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
