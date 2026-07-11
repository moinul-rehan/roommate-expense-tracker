"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ActionState = { error?: string; success?: string } | undefined;

/**
 * Shared "this is destructive / admin-only" confirmation: shows a warning
 * message and requires the current super_admin's password before the
 * wrapped Server Action runs. Closes itself once the action succeeds.
 */
export function ConfirmPasswordDialog({
  renderTrigger,
  title,
  warning,
  action,
  hiddenFields,
  confirmLabel = "Confirm",
  onSuccess,
}: {
  renderTrigger: (open: () => void) => ReactNode;
  title: string;
  warning: string;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  hiddenFields?: Record<string, string>;
  confirmLabel?: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
      onSuccess?.();
    }
    wasPending.current = pending;
  }, [pending, state, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {renderTrigger(() => setOpen(true))}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4 p-4 pt-2">
          {hiddenFields &&
            Object.entries(hiddenFields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}

          <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {warning}
          </p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password">Confirm your password</Label>
            <Input
              id="confirm-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" variant="destructive" disabled={pending} className="self-start">
            {pending ? "Working…" : confirmLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
