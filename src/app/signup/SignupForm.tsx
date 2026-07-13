"use client";

import { useActionState } from "react";
import { signup } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/google-icon";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  function handleGoogleSignup() {
    const cottageNameInput = document.getElementById("cottage_name") as HTMLInputElement | null;
    const cottageName = cottageNameInput?.value.trim() || "My Cottage";

    document.cookie = `pending_cottage_name=${encodeURIComponent(cottageName)}; path=/; max-age=600; samesite=lax`;

    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?mode=create_cottage` },
    });
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cottage_name">Cottage name</Label>
          <Input
            id="cottage_name"
            name="cottage_name"
            placeholder="e.g. Green Road Cottage"
            required
            className="h-12 rounded-2xl px-4 text-base"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" name="first_name" required className="h-12 rounded-2xl px-4 text-base" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" name="last_name" className="h-12 rounded-2xl px-4 text-base" />
          </div>
        </div>
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
            minLength={8}
            autoComplete="new-password"
            className="h-12 rounded-2xl px-4 text-base"
          />
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}
        <Button type="submit" disabled={pending} className="mt-2 h-12 w-full rounded-full text-base">
          {pending ? "Creating your cottage…" : "Sign up for a new Cottage"}
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
        onClick={handleGoogleSignup}
      >
        <GoogleIcon className="size-5" />
        Continue with Google
      </Button>
    </div>
  );
}
