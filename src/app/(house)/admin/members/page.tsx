import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./InviteForm";
import { MemberRow } from "./MemberRow";

export default async function MembersPage() {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, role, room_label, is_active")
    .order("full_name");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Members</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Invite roommates and manage who has access.
        </p>
      </div>

      <InviteForm />

      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Room</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {members?.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
            {!members?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
