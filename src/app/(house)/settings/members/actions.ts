"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/data/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InviteMemberState = { error?: string; success?: string } | undefined;

export async function inviteMember(
  _prevState: InviteMemberState,
  formData: FormData
): Promise<InviteMemberState> {
  const admin_ = await requireSuperAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const roomLabel = String(formData.get("room_label") ?? "").trim();
  const role = formData.get("role") === "super_admin" ? "super_admin" : "member";

  if (!email || !firstName) {
    return { error: "First name and email are required." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      mode: "join_cottage",
      cottage_id: admin_.cottage_id,
      first_name: firstName,
      last_name: lastName || null,
      role,
    },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Could not invite member." };
  }

  if (roomLabel) {
    const supabase = await createClient();
    await supabase
      .from("profiles")
      .update({ room_label: roomLabel })
      .eq("id", data.user.id);
  }

  revalidatePath("/settings/members");
  return { success: `Invite sent to ${email}.` };
}

export async function setMemberActive(userId: string, isActive: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  revalidatePath("/settings/members");
}

export async function setCanAddExpenses(userId: string, canAddExpenses: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ can_add_expenses: canAddExpenses }).eq("id", userId);
  revalidatePath("/settings/members");
}
