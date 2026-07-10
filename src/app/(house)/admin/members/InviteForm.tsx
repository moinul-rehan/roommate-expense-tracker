"use client";

import { useActionState } from "react";
import { inviteMember } from "./actions";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteMember, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
      <h2 className="text-sm font-semibold text-zinc-900">Invite a roommate</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="full_name"
          placeholder="Full name"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="room_label"
          placeholder="Room label (e.g. Room 2A)"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <select name="role" defaultValue="member" className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
          <option value="member">Member</option>
          <option value="super_admin">Super admin</option>
        </select>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Sending invite…" : "Send invite"}
      </button>
    </form>
  );
}
