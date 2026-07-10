import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./InviteForm";
import { MemberRow } from "./MemberRow";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function MembersPage() {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, role, room_label, is_active, can_add_expenses, can_add_bazaar, can_add_meals"
    )
    .order("last_name");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite Cottage members and manage who has access.
        </p>
      </div>

      <InviteForm />

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
            {!members?.length && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                  No members yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
