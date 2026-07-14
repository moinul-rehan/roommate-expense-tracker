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
  // Prefer an explicit site URL (must match an entry in Supabase's Auth →
  // URL Configuration → Redirect URLs allow list exactly, including this
  // path) over the request's Origin header, since Supabase silently falls
  // back to its bare Site URL — dropping the /reset-password path — for
  // any redirectTo that isn't on that allow list.
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  // Always return success, whether or not the email exists — avoids
  // leaking which addresses have an account.
  return {
    success: "If an account exists for that email, we've sent a link to reset your password.",
  };
}
