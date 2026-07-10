"use client";

import { useActionState } from "react";
import { setRent } from "./actions";

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
    <form action={action} className="grid grid-cols-1 items-center gap-3 border-b border-zinc-100 py-3 sm:grid-cols-4">
      <input type="hidden" name="user_id" value={userId} />
      <div>
        <p className="font-medium text-zinc-900">{name}</p>
        <p className="text-xs text-zinc-500">{roomLabel ?? "No room set"}</p>
      </div>
      <input
        name="monthly_rent_amount"
        type="number"
        step="0.01"
        min="0"
        defaultValue={currentAmount ?? ""}
        placeholder="Monthly rent"
        required
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
      />
      <input
        name="notes"
        placeholder="Notes (optional)"
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
