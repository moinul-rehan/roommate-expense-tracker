"use server";

import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";

export type ChangePasswordState = { error?: string; success?: string } | undefined;

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const profile = await getCurrentProfile();

  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!currentPassword || !newPassword) {
    return { error: "Fill in both password fields." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation don't match." };
  }
  if (!profile.email) {
    return { error: "No email on file for this account." };
  }

  const supabase = await createClient();

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: currentPassword,
  });
  if (reauthError) {
    return { error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    return { error: "Could not update password." };
  }

  return { success: "Password changed." };
}
