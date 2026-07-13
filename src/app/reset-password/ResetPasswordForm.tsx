"use client";

import { useActionState } from "react";
import Link from "next/link";
import { setNewPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(setNewPassword, undefined);

  if (state?.success) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
        <Button className="h-12 w-full rounded-full text-base" nativeButton={false} render={<Link href="/login" />}>
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new_password">New password</Label>
        <Input
          id="new_password"
          name="new_password"
          type="password"
          required
          minLength={8}
          className="h-12 rounded-2xl px-4 text-base"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm_password">Confirm new password</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={8}
          className="h-12 rounded-2xl px-4 text-base"
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-2 h-12 w-full rounded-full text-base">
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
