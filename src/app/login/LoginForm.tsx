"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/google-icon";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  function handleGoogleLogin() {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?mode=login` },
    });
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-12 rounded-2xl px-4 text-base"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="h-12 rounded-2xl px-4 text-base"
          />
          <Link
            href="/forgot-password"
            className="self-end text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending} className="mt-2 h-12 w-full rounded-full text-base">
          {pending ? "Signing in…" : "Sign in as Cottage member"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full gap-2.5 rounded-full text-base"
        onClick={handleGoogleLogin}
      >
        <GoogleIcon className="size-5" />
        Continue with Google
      </Button>
    </div>
  );
}
