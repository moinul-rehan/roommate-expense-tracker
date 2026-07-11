import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingBazaarDuties } from "@/lib/data/bazaar-duty";
import { InviteForm } from "./InviteForm";
import { MemberCard } from "./MemberCard";
import { Card } from "@/components/ui/card";

export default async function MembersPage() {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();

  const [{ data: members }, duties] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, avatar_url, role, room_label, is_active, can_add_expenses, can_add_bazaar, can_add_meals, can_add_deposit"
      )
      .order("last_name"),
    getUpcomingBazaarDuties(supabase, profile.cottage_id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite Cottage members and manage who has access.
        </p>
      </div>

      <InviteForm />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members?.map((member) => (
          <MemberCard key={member.id} member={member} duties={duties.get(member.id) ?? []} />
        ))}
        {!members?.length && (
          <Card className="p-4 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            No members yet.
          </Card>
        )}
      </div>
    </div>
  );
}
