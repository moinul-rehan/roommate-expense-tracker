"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { currentMonthKey } from "@/lib/data/finance";
import { notifyUsers } from "@/lib/data/notifications";

export type MealActionState = { error?: string } | undefined;

async function activeMemberIds(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.from("profiles").select("id").eq("is_active", true);
  return (data ?? []).map((m) => m.id);
}

export async function addBazaarEntry(
  _prevState: MealActionState,
  formData: FormData
): Promise<MealActionState> {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin" && !profile.can_add_bazaar) {
    return { error: "You don't have permission to add bazaar entries." };
  }

  const supabase = await createClient();
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim() || null;
  const entryDate = String(formData.get("entry_date") ?? "") || new Date().toISOString().slice(0, 10);
  const spentBy = String(formData.get("spent_by") ?? profile.id);
  const creditDeposit = formData.get("credit_deposit") === "on";

  if (!spentBy) {
    return { error: "Select who spent." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }

  const { error } = await supabase.rpc("add_bazaar_entry", {
    p_month_key: currentMonthKey(),
    p_spent_by: spentBy,
    p_amount: amount,
    p_description: description,
    p_entry_date: entryDate,
    p_credit_deposit: creditDeposit,
  });

  if (error) {
    return { error: "Could not save the bazaar entry." };
  }

  const members = await activeMemberIds(supabase);
  await notifyUsers(
    supabase,
    profile.cottage_id,
    members.filter((id) => id !== profile.id),
    { type: "bazaar_entry", title: "New bazaar entry added", body: `${description ?? "Bazaar"} — ${amount.toFixed(2)}`, link: "/meal" }
  );

  revalidatePath("/meal");
  revalidatePath("/dashboard");
  return undefined;
}

export async function addMealDeposit(
  _prevState: MealActionState,
  formData: FormData
): Promise<MealActionState> {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin") {
    return { error: "Only an admin can record meal deposits." };
  }

  const supabase = await createClient();
  const userId = String(formData.get("user_id") ?? "");
  const amount = Number(formData.get("amount"));
  const depositDate = String(formData.get("deposit_date") ?? "") || undefined;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!userId) return { error: "Select a member." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };

  const { error } = await supabase.from("meal_deposits").insert({
    month_key: currentMonthKey(),
    user_id: userId,
    amount,
    deposit_date: depositDate,
    note,
    created_by: profile.id,
  });

  if (error) {
    return { error: "Could not save the deposit." };
  }

  await notifyUsers(supabase, profile.cottage_id, [userId], {
    type: "meal_deposit",
    title: "Meal deposit recorded",
    body: `${amount.toFixed(2)} added to your meal deposit.`,
    link: "/meal",
  });

  revalidatePath("/meal");
  revalidatePath("/dashboard");
  return undefined;
}

export async function addDailyMeal(
  _prevState: MealActionState,
  formData: FormData
): Promise<MealActionState> {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin" && !profile.can_add_meals) {
    return { error: "You don't have permission to log meals." };
  }

  const supabase = await createClient();
  const userId = String(formData.get("user_id") ?? "");
  const mealDate = String(formData.get("meal_date") ?? "") || new Date().toISOString().slice(0, 10);
  const count = Number(formData.get("count"));

  if (!userId) return { error: "Select a member." };
  if (!Number.isFinite(count) || count < 0) return { error: "Enter a valid meal count." };

  const { error } = await supabase.from("daily_meals").upsert(
    {
      month_key: mealDate.slice(0, 7),
      user_id: userId,
      meal_date: mealDate,
      count,
      created_by: profile.id,
    },
    { onConflict: "user_id,meal_date" }
  );

  if (error) {
    return { error: "Could not save the meal count." };
  }

  revalidatePath("/meal");
  revalidatePath("/dashboard");
  return undefined;
}
