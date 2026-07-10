import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRents } from "@/lib/data/finance";
import { RentRow } from "./RentRow";

export default async function RentPage() {
  await requireSuperAdmin();
  const supabase = await createClient();

  const [{ data: members }, currentRents] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, room_label")
      .eq("is_active", true)
      .order("full_name"),
    getCurrentRents(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Rent</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Set each member&apos;s fixed monthly rent based on room size and facilities.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 px-4">
        {members?.map((member) => (
          <RentRow
            key={member.id}
            userId={member.id}
            name={member.full_name}
            roomLabel={member.room_label}
            currentAmount={currentRents.get(member.id)?.monthly_rent_amount ?? null}
          />
        ))}
        {!members?.length && (
          <p className="py-6 text-center text-sm text-zinc-400">No active members yet.</p>
        )}
      </div>
    </div>
  );
}
