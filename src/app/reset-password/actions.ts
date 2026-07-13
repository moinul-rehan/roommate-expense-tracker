"use server";

import { createClient } from "@/lib/supabase/server";

export type SetNewPasswordState = { error?: string; success?: string } | undefined;

export async function setNewPassword(
  _prevState: SetNewPasswordState,
  formData: FormData
): Promise<SetNewPasswordState> {
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!newPassword) {
    return { error: "Enter a new password." };
  }
  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Password and confirmation don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "This reset link has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { error: "Could not set your new password. Request a new reset link and try again." };
  }

  return { success: "Password updated. You can now sign in." };
}
