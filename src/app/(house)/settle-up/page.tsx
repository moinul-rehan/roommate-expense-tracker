import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getActiveMonthKey, defaultDateForMonth } from "@/lib/data/months";
import { SettleForm } from "./SettleForm";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function SettleUpPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);
  const defaultDate = defaultDateForMonth(monthKey);

  const [{ data: members }, { data: settlements }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("is_active", true)
      .order("last_name"),
    supabase
      .from("settlements")
      .select(
        "id, amount, settled_on, note, from:from_user(first_name, last_name), to:to_user(first_name, last_name)"
      )
      .order("settled_on", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settle Up</h1>
        <p className="mt-1 text-sm text-muted-foreground">Record a payment made between roommates.</p>
      </div>

      <SettleForm members={members ?? []} currentUserId={profile.id} defaultDate={defaultDate} />

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settlements?.map((s) => {
              const from = s.from as unknown as { first_name: string; last_name: string | null } | null;
              const to = s.to as unknown as { first_name: string; last_name: string | null } | null;
              return (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground">{s.settled_on}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {from ? getDisplayName(from) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {to ? getDisplayName(to) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.note ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {Number(s.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
            {!settlements?.length && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  No settlements recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
