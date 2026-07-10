"use client";

import { useTransition } from "react";
import { setMemberActive, setCanAddExpenses } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { getDisplayName } from "@/lib/data/display-name";
import { VerifiedBadge } from "@/components/verified-badge";

type Member = {
  id: string;
  first_name: string;
  last_name: string | null;
  role: "super_admin" | "member";
  room_label: string | null;
  is_active: boolean;
  can_add_expenses: boolean;
};

export function MemberRow({ member }: { member: Member }) {
  const [pending, startTransition] = useTransition();

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">
        <span className="inline-flex items-center gap-1.5">
          {getDisplayName(member)}
          <VerifiedBadge role={member.role} />
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">{member.room_label ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">
        {member.role === "super_admin" ? "Super admin" : "Member"}
      </TableCell>
      <TableCell>
        <Badge variant={member.is_active ? "default" : "secondary"}>
          {member.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={member.can_add_expenses ? "default" : "outline"}>
          {member.can_add_expenses ? "Can add expenses" : "No expense access"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={pending || member.role === "super_admin"}
            onClick={() =>
              startTransition(() => setCanAddExpenses(member.id, !member.can_add_expenses))
            }
          >
            {member.can_add_expenses ? "Revoke expenses" : "Grant expenses"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(() => setMemberActive(member.id, !member.is_active))
            }
          >
            {member.is_active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
