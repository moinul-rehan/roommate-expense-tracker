import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AddExpenseForm } from "./AddExpenseForm";

const CATEGORIES = ["servant", "electricity", "internet", "other"] as const;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();

  const [{ data: members }, expensesQuery] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
    (async () => {
      let query = supabase
        .from("expenses")
        .select("id, category, amount, description, expense_date, split_type, payer:paid_by(full_name)")
        .order("expense_date", { ascending: false })
        .limit(50);
      if (category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
        query = query.eq("category", category);
      }
      return query;
    })(),
  ]);

  const expenses = expensesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Expenses</h1>
        <p className="mt-1 text-sm text-zinc-500">Servant, electricity, internet, and other shared costs.</p>
      </div>

      <AddExpenseForm members={members ?? []} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/expenses"
            className={!category ? "font-semibold text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}
          >
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/expenses?category=${c}`}
              className={category === c ? "font-semibold text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}
            >
              {c[0].toUpperCase() + c.slice(1)}
            </Link>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 font-medium">Paid by</th>
                <th className="px-4 py-2 font-medium">Split</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2 text-zinc-600">{e.expense_date}</td>
                  <td className="px-4 py-2 capitalize text-zinc-600">{e.category}</td>
                  <td className="px-4 py-2 text-zinc-600">{e.description ?? "—"}</td>
                  <td className="px-4 py-2 text-zinc-600">
                    {(e.payer as unknown as { full_name: string } | null)?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-2 capitalize text-zinc-600">{e.split_type}</td>
                  <td className="px-4 py-2 text-right font-medium text-zinc-900">
                    {Number(e.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
              {!expenses.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                    No expenses yet.
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
