import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { Logo } from "@/components/logo";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const linkValid = !!user;

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <Logo size={32} />
          Cottage
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Set a new password</h1>
          <p className="text-sm text-muted-foreground">Choose a new password for your account.</p>
        </div>

        {linkValid ? (
          <ResetPasswordForm />
        ) : (
          <div className="flex flex-col gap-4">
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              This reset link is invalid or has expired.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
                Request a new link
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
