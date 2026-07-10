"use client";

import { useActionState, useState } from "react";
import { addExpense } from "./actions";

type Member = { id: string; full_name: string };

const CATEGORIES = [
  { value: "servant", label: "Servant" },
  { value: "electricity", label: "Electricity" },
  { value: "internet", label: "Internet" },
  { value: "other", label: "Other" },
];

export function AddExpenseForm({ members }: { members: Member[] }) {
  const [state, action, pending] = useActionState(addExpense, undefined);
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");

  return (
    <form action={action} className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4">
      <h2 className="text-sm font-semibold text-zinc-900">Add an expense</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select name="category" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
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
        <select name="paid_by" required defaultValue="" className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
          <option value="" disabled>
            Paid by…
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
        <input
          name="expense_date"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="description"
          placeholder="Description (optional)"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
        />
      </div>

      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="split_type"
            value="equal"
            checked={splitType === "equal"}
            onChange={() => setSplitType("equal")}
          />
          Split equally
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="split_type"
            value="custom"
            checked={splitType === "custom"}
            onChange={() => setSplitType("custom")}
          />
          Custom split
        </label>
      </div>

      {splitType === "custom" && (
        <div className="grid grid-cols-2 gap-2 rounded-md bg-zinc-50 p-3 sm:grid-cols-3">
          {members.map((m) => (
            <label key={m.id} className="flex flex-col gap-1 text-xs text-zinc-600">
              {m.full_name}
              <input
                name={`share_${m.id}`}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
              />
            </label>
          ))}
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add expense"}
      </button>
    </form>
  );
}
