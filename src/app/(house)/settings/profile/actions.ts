"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";

const BD_MOBILE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

export type UpdateProfileState = { error?: string; success?: string } | undefined;

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  await getCurrentProfile();

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim() || null;
  const gender = String(formData.get("gender") ?? "") || null;
  const hometown = String(formData.get("hometown") ?? "").trim() || null;
  const mobileNumber = String(formData.get("mobile_number") ?? "").trim() || null;

  if (!firstName) {
    return { error: "First name is required." };
  }
  if (gender && !["male", "female", "other"].includes(gender)) {
    return { error: "Pick a valid gender." };
  }
  if (mobileNumber && !BD_MOBILE_REGEX.test(mobileNumber)) {
    return { error: "Enter a valid Bangladeshi mobile number (e.g. 01712345678)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_own_profile", {
    p_first_name: firstName,
    p_last_name: lastName,
    p_avatar_url: null,
    p_gender: gender,
    p_hometown: hometown,
    p_mobile_number: mobileNumber,
  });

  if (error) {
    return { error: "Could not save your profile." };
  }

  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { success: "Profile updated." };
}

export async function updateAvatarUrl(avatarUrl: string) {
  await getCurrentProfile();
  const supabase = await createClient();
  await supabase.rpc("update_own_avatar", { p_avatar_url: avatarUrl });
  revalidatePath("/settings/profile");
  revalidatePath("/", "layout");
}
