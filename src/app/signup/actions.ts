"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignupState = { error?: string; success?: string } | undefined;

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const cottageName = String(formData.get("cottage_name") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!cottageName || !firstName || !email || !password) {
    return { error: "Cottage name, first name, email, and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        mode: "create_cottage",
        cottage_name: cottageName,
        first_name: firstName,
        last_name: lastName || null,
      },
    },
  });

  if (error) {
    return {
      error: error.message.toLowerCase().includes("already registered")
        ? "An account with this email already exists."
        : "Could not create your account.",
    };
  }

  if (!data.session) {
    return { success: "Check your email to confirm your account, then sign in." };
  }

  redirect("/dashboard");
}
