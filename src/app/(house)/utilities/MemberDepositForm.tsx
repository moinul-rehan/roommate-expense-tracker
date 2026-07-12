"use client";

import { useActionState, useEffect, useRef } from "react";
import { addMemberUtilityDeposit } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDisplayName } from "@/lib/data/display-name";

type Member = { id: string; first_name: string; last_name: string | null };

export function MemberDepositForm({
  members,
  defaultDate,
  onSuccess,
}: {
  members: Member[];
  defaultDate: string;
  onSuccess?: () => void;
}) {
  const [state, action, pending] = useActionState(addMemberUtilityDeposit, undefined);
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
          <Label>Member</Label>
          <Select name="user_id" required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Member…">
                {(value: string | null) => {
                  const member = members.find((m) => m.id === value);
                  return member ? getDisplayName(member) : "Member…";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {getDisplayName(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mdep-amount">Amount</Label>
          <Input id="mdep-amount" name="amount" type="number" step="0.01" min="0.01" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mdep-date">Date</Label>
          <Input id="mdep-date" name="deposit_date" type="date" defaultValue={defaultDate} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mdep-note">Note</Label>
          <Textarea id="mdep-note" name="note" placeholder="Optional" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Reduces this member&apos;s Remaining Due and credits the same amount to Cottage Balance.
      </p>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Add Deposit"}
      </Button>
    </form>
  );
}
