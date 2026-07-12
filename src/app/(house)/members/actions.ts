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

  // handle_new_user only sets id/first_name/last_name/email/role — the
  // permission columns fall back to their table defaults, three of which
  // are `true`. A newly invited member should start as a plain general
  // member with no permissions granted, so zero them out explicitly here.
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      room_label: roomLabel || null,
      can_add_expenses: false,
      can_add_bazaar: false,
      can_add_meals: false,
      can_add_deposit: false,
    })
    .eq("id", data.user.id);

  revalidatePath("/members");
  return { success: `Invite sent to ${email}.` };
}

export async function setMemberActive(userId: string, isActive: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  revalidatePath("/members");
}

export async function setCanAddExpenses(userId: string, canAddExpenses: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ can_add_expenses: canAddExpenses }).eq("id", userId);
  revalidatePath("/members");
}

export async function setCanAddBazaar(userId: string, canAddBazaar: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ can_add_bazaar: canAddBazaar }).eq("id", userId);
  revalidatePath("/members");
}

export async function setCanAddMeals(userId: string, canAddMeals: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ can_add_meals: canAddMeals }).eq("id", userId);
  revalidatePath("/members");
}

export async function setCanAddDeposit(userId: string, canAddDeposit: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ can_add_deposit: canAddDeposit }).eq("id", userId);
  revalidatePath("/members");
}

export type AssignBazaarDutyState = { error?: string; success?: string } | undefined;

export async function assignBazaarDuty(
  _prevState: AssignBazaarDutyState,
  formData: FormData
): Promise<AssignBazaarDutyState> {
  const admin_ = await requireSuperAdmin();
  const supabase = await createClient();

  const userId = String(formData.get("user_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!userId || !startDate || !endDate) {
    return { error: "Pick a member and a date range." };
  }
  if (endDate < startDate) {
    return { error: "End date must be on or after the start date." };
  }
  const today = new Date().toISOString().slice(0, 10);
  if (endDate < today) {
    // A duty entirely in the past would insert successfully but never show
    // up anywhere (Members page and Dashboard both only query duties whose
    // end_date hasn't passed yet) — surface that as a validation error
    // instead of a silent no-op the admin would otherwise mistake for a bug.
    return { error: "End date can't be in the past — the duty would never show up anywhere." };
  }

  const { error } = await supabase.from("bazaar_duties").insert({
    cottage_id: admin_.cottage_id,
    user_id: userId,
    start_date: startDate,
    end_date: endDate,
    note,
    created_by: admin_.id,
  });

  if (error) return { error: "Could not assign bazaar duty." };

  revalidatePath("/members");
  revalidatePath("/dashboard");
  return { success: "Bazaar duty assigned." };
}

export async function removeBazaarDuty(dutyId: string) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("bazaar_duties").delete().eq("id", dutyId);
  revalidatePath("/members");
  revalidatePath("/dashboard");
}
