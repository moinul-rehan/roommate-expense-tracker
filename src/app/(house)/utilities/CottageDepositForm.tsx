"use client";

import { useActionState, useEffect, useRef } from "react";
import { addCottageDeposit } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function CottageDepositForm({
  defaultDate,
  onSuccess,
}: {
  defaultDate: string;
  onSuccess?: () => void;
}) {
  const [state, action, pending] = useActionState(addCottageDeposit, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      onSuccess?.();
    }
    wasPending.current = pending;
  }, [pending, state, onSuccess]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cdep-amount">Amount</Label>
          <Input id="cdep-amount" name="amount" type="number" step="0.01" min="0.01" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cdep-date">Date</Label>
          <Input id="cdep-date" name="deposit_date" type="date" defaultValue={defaultDate} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="cdep-note">Note</Label>
          <Textarea id="cdep-note" name="note" placeholder="Optional" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Adds money directly into the Cottage Fund. No member account is affected.
      </p>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Add Deposit"}
      </Button>
    </form>
  );
}
