import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import {
  currentMonthKey,
  getAmountOwedToUser,
  getMonthlyDues,
  monthRange,
} from "@/lib/data/finance";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="text-2xl font-semibold text-zinc-900">{value}</span>
      {hint && <span className="text-xs text-zinc-400">{hint}</span>}
    </div>
  );
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const monthKey = currentMonthKey();
  const { start, end } = monthRange(monthKey);

  const [dues, owedToYou, recentExpenses] = await Promise.all([
    getMonthlyDues(supabase, monthKey),
    getAmountOwedToUser(supabase, profile.id, monthKey),
    supabase
      .from("expenses")
      .select("id, category, amount, description, expense_date, payer:paid_by(full_name)")
      .gte("expense_date", start)
      .lt("expense_date", end)
      .order("expense_date", { ascending: false })
      .limit(8),
  ]);

  const myDue = dues.get(profile.id) ?? { rent: 0, expenses: 0, paid: 0, due: 0 };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">
          Welcome, {profile.full_name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Here&apos;s where things stand for {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Rent" value={myDue.rent.toFixed(2)} />
        <StatCard label="Your expense share" value={myDue.expenses.toFixed(2)} />
        <StatCard label="You owe this month" value={myDue.due.toFixed(2)} hint="Rent + share, minus what you've settled" />
        <StatCard label="Others owe you" value={owedToYou.toFixed(2)} hint="From expenses you fronted" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Recent activity</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 font-medium">Paid by</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentExpenses.data?.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2 text-zinc-600">{e.expense_date}</td>
                  <td className="px-4 py-2 capitalize text-zinc-600">{e.category}</td>
                  <td className="px-4 py-2 text-zinc-600">{e.description ?? "—"}</td>
                  <td className="px-4 py-2 text-zinc-600">
                    {(e.payer as unknown as { full_name: string } | null)?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-zinc-900">
                    {Number(e.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
              {!recentExpenses.data?.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                    No expenses recorded this month yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
