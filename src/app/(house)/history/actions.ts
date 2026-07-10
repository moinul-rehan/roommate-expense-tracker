"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/data/notifications";

export type ActivateMonthState = { error?: string; success?: string } | undefined;

export async function activateMonth(
  _prevState: ActivateMonthState,
  formData: FormData
): Promise<ActivateMonthState> {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();

  const monthKey = String(formData.get("month_key") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!monthKey) return { error: "Missing month." };
  if (!profile.email) return { error: "No email on file for this account." };
  if (!password) return { error: "Enter your password to confirm." };

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });
  if (reauthError) return { error: "Incorrect password." };

  const { error } = await supabase.rpc("activate_month", { p_month_key: monthKey });
  if (error) {
    return { error: "Could not activate that month." };
  }

  const { data: members } = await supabase.from("profiles").select("id").eq("is_active", true);
  await notifyUsers(
    supabase,
    profile.cottage_id,
    (members ?? []).map((m) => m.id).filter((id) => id !== profile.id),
    {
      type: "month_activated",
      title: `${monthKey} reactivated`,
      body: "This month is now open for editing again.",
      link: "/months",
    }
  );

  revalidatePath("/months");
  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath("/meal");
  revalidatePath("/meal/month-details");
  revalidatePath("/utilities");
  return { success: `${monthKey} is now the active month.` };
}
