"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/data/notifications";

export type MonthActionState = { error?: string; success?: string } | undefined;

async function verifyPassword(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileEmail: string | null,
  password: string
) {
  if (!password) return "Enter your password to confirm.";

  // profiles.email can be stale/empty on older accounts — fall back to the
  // authenticated session's own email, which is always accurate.
  const email = profileEmail ?? (await supabase.auth.getUser()).data.user?.email ?? null;
  if (!email) return "No email on file for this account.";

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return "Incorrect password.";
  return null;
}

async function notifyOtherMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cottageId: string,
  actingUserId: string,
  notification: { type: string; title: string; body?: string; link?: string }
) {
  const { data: members } = await supabase.from("profiles").select("id").eq("is_active", true);
  await notifyUsers(
    supabase,
    cottageId,
    (members ?? []).map((m) => m.id).filter((id) => id !== actingUserId),
    notification
  );
}

function revalidateAll() {
  revalidatePath("/months");
  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath("/meal");
  revalidatePath("/meal/month-details");
  revalidatePath("/utilities");
}

export async function setActiveMonth(
  _prevState: MonthActionState,
  formData: FormData
): Promise<MonthActionState> {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();

  const monthKey = String(formData.get("month_key") ?? "");
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return { error: "Pick a valid month." };

  const passwordError = await verifyPassword(supabase, profile.email, String(formData.get("password") ?? ""));
  if (passwordError) return { error: passwordError };

  const { error } = await supabase.rpc("set_active_month", { p_month_key: monthKey });
  if (error) {
    return { error: error.message.includes("has not started") ? error.message : "Could not set the active month." };
  }

  await notifyOtherMembers(supabase, profile.cottage_id, profile.id, {
    type: "month_created",
    title: `Active month set to ${monthKey}`,
    body: "The previous active month has been locked and moved to History.",
    link: "/months",
  });

  revalidateAll();
  return { success: `${monthKey} is now the active month. The previous month is locked in History.` };
}

export async function resetUtilityMonth(
  _prevState: MonthActionState,
  formData: FormData
): Promise<MonthActionState> {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();

  const passwordError = await verifyPassword(supabase, profile.email, String(formData.get("password") ?? ""));
  if (passwordError) return { error: passwordError };

  const { error } = await supabase.rpc("reset_utility_month");
  if (error) {
    return { error: "Could not reset the utility month." };
  }

  await notifyOtherMembers(supabase, profile.cottage_id, profile.id, {
    type: "utility_month_reset",
    title: "The current month's Utility ledger was reset",
    body: "All expenses, settlements and Cottage Balance transactions for this month were cleared.",
    link: "/utilities",
  });

  revalidateAll();
  return { success: "The active month's Utility ledger has been reset." };
}

export async function resetMealMonth(
  _prevState: MonthActionState,
  formData: FormData
): Promise<MonthActionState> {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();

  const passwordError = await verifyPassword(supabase, profile.email, String(formData.get("password") ?? ""));
  if (passwordError) return { error: passwordError };

  const { error } = await supabase.rpc("reset_meal_month");
  if (error) {
    return { error: "Could not reset the meal month." };
  }

  await notifyOtherMembers(supabase, profile.cottage_id, profile.id, {
    type: "meal_month_reset",
    title: "The current month's Meal ledger was reset",
    body: "All bazaar entries, deposits and meal counts for this month were cleared.",
    link: "/meal",
  });

  revalidateAll();
  return { success: "The active month's Meal ledger has been reset." };
}
