import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { SettleForm } from "./SettleForm";

export default async function SettleUpPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: members }, { data: settlements }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase
      .from("settlements")
      .select("id, amount, settled_on, note, from:from_user(full_name), to:to_user(full_name)")
      .order("settled_on", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Settle Up</h1>
        <p className="mt-1 text-sm text-zinc-500">Record a payment made between roommates.</p>
      </div>

      <SettleForm members={members ?? []} currentUserId={profile.id} />

      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">From</th>
              <th className="px-4 py-2 font-medium">To</th>
              <th className="px-4 py-2 font-medium">Note</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {settlements?.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2 text-zinc-600">{s.settled_on}</td>
                <td className="px-4 py-2 text-zinc-600">
                  {(s.from as unknown as { full_name: string } | null)?.full_name ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600">
                  {(s.to as unknown as { full_name: string } | null)?.full_name ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600">{s.note ?? "—"}</td>
                <td className="px-4 py-2 text-right font-medium text-zinc-900">
                  {Number(s.amount).toFixed(2)}
                </td>
              </tr>
            ))}
            {!settlements?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  No settlements recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
