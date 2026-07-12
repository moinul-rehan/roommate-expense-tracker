"use client";

import { useActionState, useEffect, useRef } from "react";
import { addUtilityDeposit } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDisplayName } from "@/lib/data/display-name";

type Member = { id: string; first_name: string; last_name: string | null };

export function DepositForm({
  members,
  defaultDate,
  onSuccess,
}: {
  members: Member[];
  defaultDate: string;
  onSuccess?: () => void;
}) {
  const [state, action, pending] = useActionState(addUtilityDeposit, undefined);
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
          <Label>Source</Label>
          <Select name="source" required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Source…">
                {(value: string | null) => {
                  if (value === "addition") return "Addition (Cottage money)";
                  const member = members.find((m) => m.id === value);
                  return member ? getDisplayName(member) : "Source…";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {getDisplayName(m)}
                </SelectItem>
              ))}
              <SelectItem value="addition">Addition (Cottage money)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deposit-amount">Amount</Label>
          <Input id="deposit-amount" name="amount" type="number" step="0.01" min="0.01" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deposit-date">Date</Label>
          <Input id="deposit-date" name="deposit_date" type="date" defaultValue={defaultDate} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deposit-note">Note</Label>
          <Textarea id="deposit-note" name="note" placeholder="Optional" />
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Add"}
      </Button>
    </form>
  );
}
