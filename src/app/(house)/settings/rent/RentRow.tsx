"use client";

import { useActionState } from "react";
import { setRent } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RentRow({
  userId,
  name,
  roomLabel,
  currentAmount,
}: {
  userId: string;
  name: string;
  roomLabel: string | null;
  currentAmount: number | null;
}) {
  const [state, action, pending] = useActionState(setRent, undefined);

  return (
    <form
      action={action}
      className="grid grid-cols-1 items-center gap-3 border-b py-3 last:border-b-0 sm:grid-cols-4"
    >
      <input type="hidden" name="user_id" value={userId} />
      <div>
        <p className="font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{roomLabel ?? "No room set"}</p>
      </div>
      <Input
        name="monthly_rent_amount"
        type="number"
        step="0.01"
        min="0"
        defaultValue={currentAmount ?? ""}
        placeholder="Monthly rent"
        required
      />
      <Input name="notes" placeholder="Notes (optional)" />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
      </div>
    </form>
  );
}
