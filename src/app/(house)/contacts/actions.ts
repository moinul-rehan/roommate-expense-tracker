"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";

export type AddContactState = { error?: string } | undefined;

export async function addContact(
  _prevState: AddContactState,
  formData: FormData
): Promise<AddContactState> {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const mobileNumber = String(formData.get("mobile_number") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;

  if (!name) return { error: "Enter a name." };

  const { error } = await supabase.from("contacts").insert({
    cottage_id: profile.cottage_id,
    name,
    mobile_number: mobileNumber,
    email,
    created_by: profile.id,
  });

  if (error) return { error: `Could not save the contact: ${error.message}` };

  revalidatePath("/contacts");
  return undefined;
}

export async function deleteContact(id: string) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("contacts").delete().eq("id", id);
  revalidatePath("/contacts");
}
