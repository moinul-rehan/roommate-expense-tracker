"use client";

import { useTransition } from "react";
import { setMemberActive } from "./actions";

type Member = {
  id: string;
  full_name: string;
  role: string;
  room_label: string | null;
  is_active: boolean;
};

export function MemberRow({ member }: { member: Member }) {
  const [pending, startTransition] = useTransition();

  return (
    <tr>
      <td className="px-4 py-2 text-zinc-900">{member.full_name}</td>
      <td className="px-4 py-2 text-zinc-600">{member.room_label ?? "—"}</td>
      <td className="px-4 py-2 text-zinc-600">
        {member.role === "super_admin" ? "Super admin" : "Member"}
      </td>
      <td className="px-4 py-2">
        <span
          className={
            member.is_active
              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
              : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500"
          }
        >
          {member.is_active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-2 text-right">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(() => setMemberActive(member.id, !member.is_active))
          }
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
        >
          {member.is_active ? "Deactivate" : "Activate"}
        </button>
      </td>
    </tr>
  );
}
