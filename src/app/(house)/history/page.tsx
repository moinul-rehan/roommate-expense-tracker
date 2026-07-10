import { createClient } from "@/lib/supabase/server";
import { currentMonthKey, getMonthlyDues, monthRange } from "@/lib/data/finance";

const CATEGORIES = ["servant", "electricity", "internet", "other"] as const;

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
    .select("id, category, amount, description, expense_date, payer:paid_by(full_name)")
    .gte("expense_date", start)
    .lt("expense_date", end)
    .order("expense_date", { ascending: false });

  if (category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    expensesQuery = expensesQuery.eq("category", category);
  }

  const [{ data: expenses }, dues, { data: members }] = await Promise.all([
    expensesQuery,
    getMonthlyDues(supabase, monthKey),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">History</h1>
        <p className="mt-1 text-sm text-zinc-500">Past months, filterable by category.</p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1">
          <label htmlFor="month" className="text-xs font-medium text-zinc-500">
            Month
          </label>
          <input
            id="month"
            name="month"
            type="month"
            defaultValue={monthKey}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-xs font-medium text-zinc-500">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={category ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Apply
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Per-member dues this month</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Member</th>
                <th className="px-4 py-2 text-right font-medium">Rent</th>
                <th className="px-4 py-2 text-right font-medium">Expenses</th>
                <th className="px-4 py-2 text-right font-medium">Paid</th>
                <th className="px-4 py-2 text-right font-medium">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {members?.map((m) => {
                const due = dues.get(m.id) ?? { rent: 0, expenses: 0, paid: 0, due: 0 };
                return (
                  <tr key={m.id}>
                    <td className="px-4 py-2 text-zinc-900">{m.full_name}</td>
                    <td className="px-4 py-2 text-right text-zinc-600">{due.rent.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-zinc-600">{due.expenses.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-zinc-600">{due.paid.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-medium text-zinc-900">{due.due.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Expenses</h2>
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
              {expenses?.map((e) => (
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
              {!expenses?.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                    No expenses for this period.
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
