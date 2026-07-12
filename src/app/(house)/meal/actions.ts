"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getActiveMonthKey } from "@/lib/data/months";
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

  const activeMonthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const { error } = await supabase.rpc("add_bazaar_entry", {
    p_month_key: activeMonthKey,
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
  revalidatePath("/meal/month-details");
  return undefined;
}

export async function updateBazaarEntry(
  _prevState: MealActionState,
  formData: FormData
): Promise<MealActionState> {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin" && !profile.can_add_bazaar) {
    return { error: "You don't have permission to edit bazaar entries." };
  }

  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim() || null;
  const entryDate = String(formData.get("entry_date") ?? "");

  if (!id) return { error: "Missing entry." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };
  if (!entryDate) return { error: "Pick a date." };

  const { error } = await supabase
    .from("bazaar_entries")
    .update({ amount, description, entry_date: entryDate })
    .eq("id", id);

  if (error) {
    return { error: "Could not update the bazaar entry." };
  }

  const members = await activeMemberIds(supabase);
  await notifyUsers(
    supabase,
    profile.cottage_id,
    members.filter((memberId) => memberId !== profile.id),
    { type: "bazaar_entry", title: "A bazaar entry was updated", body: `${description ?? "Bazaar"} — ${amount.toFixed(2)}`, link: "/meal" }
  );

  revalidatePath("/meal");
  revalidatePath("/dashboard");
  revalidatePath("/meal/month-details");
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

  const activeMonthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const { error } = await supabase.from("meal_deposits").insert({
    month_key: activeMonthKey,
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
  revalidatePath("/meal/month-details");
  return undefined;
}

export async function updateDeposit(
  _prevState: MealActionState,
  formData: FormData
): Promise<MealActionState> {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin") {
    return { error: "Only an admin can edit meal deposits." };
  }

  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("amount"));
  const depositDate = String(formData.get("deposit_date") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!id) return { error: "Missing entry." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };
  if (!depositDate) return { error: "Pick a date." };

  const { data: existing } = await supabase
    .from("meal_deposits")
    .select("user_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("meal_deposits")
    .update({ amount, deposit_date: depositDate, note })
    .eq("id", id);

  if (error) {
    return { error: "Could not update the deposit." };
  }

  if (existing && existing.user_id !== profile.id) {
    await notifyUsers(supabase, profile.cottage_id, [existing.user_id], {
      type: "meal_deposit",
      title: "Your meal deposit was updated",
      body: `${amount.toFixed(2)} on ${depositDate}.`,
      link: "/meal",
    });
  }

  revalidatePath("/meal");
  revalidatePath("/dashboard");
  revalidatePath("/meal/month-details");
  return undefined;
}

/** Saves lunch + dinner counts for every member on one date (Add Meal quick form). */
export async function addDailyMealsForDate(
  _prevState: MealActionState,
  formData: FormData
): Promise<MealActionState> {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin" && !profile.can_add_meals) {
    return { error: "You don't have permission to log meals." };
  }

  const supabase = await createClient();
  const mealDate = String(formData.get("meal_date") ?? "") || new Date().toISOString().slice(0, 10);
  const memberIds = String(formData.get("member_ids") ?? "")
    .split(",")
    .filter(Boolean);

  if (!memberIds.length) return { error: "No members to save." };

  const activeMonthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const rows = memberIds
    .map((userId) => {
      const lunch = Number(formData.get(`lunch_${userId}`) ?? 0) || 0;
      const dinner = Number(formData.get(`dinner_${userId}`) ?? 0) || 0;
      return {
        month_key: activeMonthKey,
        user_id: userId,
        meal_date: mealDate,
        count: lunch + dinner,
        created_by: profile.id,
      };
    })
    .filter((row) => row.count > 0);

  if (!rows.length) return { error: "Enter at least one meal count." };

  const { error } = await supabase
    .from("daily_meals")
    .upsert(rows, { onConflict: "user_id,meal_date" });

  if (error) return { error: "Could not save the meal counts." };

  await Promise.all(
    rows
      .filter((row) => row.user_id !== profile.id)
      .map((row) =>
        notifyUsers(supabase, profile.cottage_id, [row.user_id], {
          type: "daily_meal",
          title: "Your meal count was logged",
          body: `${row.count} meal${row.count === 1 ? "" : "s"} on ${mealDate}.`,
          link: "/meal",
        })
      )
  );

  revalidatePath("/meal");
  revalidatePath("/dashboard");
  revalidatePath("/meal/month-details");
  return undefined;
}

/** Edits every member's meal count for one date at once (Month Details' pivot-row edit). */
export async function updateDailyMealsForDate(
  _prevState: MealActionState,
  formData: FormData
): Promise<MealActionState> {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin" && !profile.can_add_meals) {
    return { error: "You don't have permission to edit meals." };
  }

  const supabase = await createClient();
  const mealDate = String(formData.get("meal_date") ?? "");
  const memberIds = String(formData.get("member_ids") ?? "")
    .split(",")
    .filter(Boolean);

  if (!mealDate) return { error: "Missing date." };
  if (!memberIds.length) return { error: "No members to update." };

  const activeMonthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const rows = memberIds.map((userId) => {
    const count = Number(formData.get(`count_${userId}`) ?? 0);
    return {
      month_key: activeMonthKey,
      user_id: userId,
      meal_date: mealDate,
      count: Number.isFinite(count) && count >= 0 ? count : 0,
      created_by: profile.id,
    };
  });

  const { error } = await supabase
    .from("daily_meals")
    .upsert(rows, { onConflict: "user_id,meal_date" });

  if (error) {
    return { error: "Could not update meals for this date." };
  }

  await Promise.all(
    rows
      .filter((row) => row.user_id !== profile.id)
      .map((row) =>
        notifyUsers(supabase, profile.cottage_id, [row.user_id], {
          type: "daily_meal",
          title: "Your meal count was updated",
          body: `${row.count} meal${row.count === 1 ? "" : "s"} on ${mealDate}.`,
          link: "/meal",
        })
      )
  );

  revalidatePath("/meal");
  revalidatePath("/dashboard");
  revalidatePath("/meal/month-details");
  return undefined;
}
