import { requireSuperAdmin, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRents } from "@/lib/data/finance";
import { RentRow } from "./RentRow";
import { Card, CardContent } from "@/components/ui/card";

export default async function RentPage() {
  await requireSuperAdmin();
  const supabase = await createClient();

  const [{ data: members }, currentRents] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, room_label")
      .eq("is_active", true)
      .order("last_name"),
    getCurrentRents(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Rent</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set each member&apos;s fixed monthly rent based on room size and facilities.
        </p>
      </div>

      <Card>
        <CardContent>
          {members?.map((member) => (
            <RentRow
              key={member.id}
              userId={member.id}
              name={getDisplayName(member)}
              roomLabel={member.room_label}
              currentAmount={currentRents.get(member.id)?.monthly_rent_amount ?? null}
            />
          ))}
          {!members?.length && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No active members yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
