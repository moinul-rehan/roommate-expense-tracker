"use client";

import { useActionState } from "react";
import { recordSettlement } from "./actions";

type Member = { id: string; full_name: string };

export function SettleForm({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
  const [state, action, pending] = useActionState(recordSettlement, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
      <h2 className="text-sm font-semibold text-zinc-900">Record a payment</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select name="from_user" defaultValue={currentUserId} required className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
          <option value="" disabled>
            Paid by…
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
        <select name="to_user" defaultValue="" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
          <option value="" disabled>
            Paid to…
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Amount"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="settled_on"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="note"
          placeholder="Note (optional)"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Record payment"}
      </button>
    </form>
  );
}
