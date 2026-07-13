"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type ForgotPasswordState = { error?: string; success?: string } | undefined;

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter your email address." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  // Always return success, whether or not the email exists — avoids
  // leaking which addresses have an account.
  return {
    success: "If an account exists for that email, we've sent a link to reset your password.",
  };
}
