"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addBazaarEntry } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDisplayName } from "@/lib/data/display-name";

type Member = { id: string; first_name: string; last_name: string | null };

export function BazaarForm({
  members,
  defaultDate,
  onSuccess,
  hideCard = false,
}: {
  members: Member[];
  defaultDate: string;
  onSuccess?: () => void;
  hideCard?: boolean;
}) {
  const [state, action, pending] = useActionState(addBazaarEntry, undefined);
  const wasPending = useRef(false);
  const [spentBy, setSpentBy] = useState<string>("");

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      onSuccess?.();
    }
    wasPending.current = pending;
  }, [pending, state, onSuccess]);

  const spentByMember = members.find((m) => m.id === spentBy);

  const form = (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Spent by</Label>
          <Select
            name="spent_by"
            required
            onValueChange={(value: string | null) => setSpentBy(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Spent by…">
                {(value: string | null) => {
                  const member = members.find((m) => m.id === value);
                  return member ? getDisplayName(member) : "Spent by…";
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
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="entry_date">Date</Label>
          <Input id="entry_date" name="entry_date" type="date" defaultValue={defaultDate} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" placeholder="Optional" />
        </div>
      </div>

      {spentByMember && (
        <label className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
          <input
            type="checkbox"
            name="credit_deposit"
            className="size-4 rounded border-input"
          />
          <span>
            Cost deposit to <span className="font-medium text-foreground">{getDisplayName(spentByMember)}</span>{" "}
            — credits this amount to their meal deposit
          </span>
        </label>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Add bazaar entry"}
      </Button>
    </form>
  );

  if (hideCard) return form;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Add bazaar entry</CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
}
