"use client";

import { useTransition } from "react";
import { setMemberActive, setCanAddExpenses, setCanAddBazaar, setCanAddMeals } from "./actions";
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
  can_add_bazaar: boolean;
  can_add_meals: boolean;
};

export function MemberRow({ member }: { member: Member }) {
  const [pending, startTransition] = useTransition();

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">
        <span className="inline-flex items-center gap-1.5">
          {getDisplayName(member)}
          <VerifiedBadge
            role={member.role}
            can_add_expenses={member.can_add_expenses}
            can_add_bazaar={member.can_add_bazaar}
            can_add_meals={member.can_add_meals}
          />
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
        <div className="flex flex-wrap gap-1">
          <Badge variant={member.can_add_expenses ? "default" : "outline"}>Utilities</Badge>
          <Badge variant={member.can_add_bazaar ? "default" : "outline"}>Bazaar</Badge>
          <Badge variant={member.can_add_meals ? "default" : "outline"}>Meals</Badge>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={pending || member.role === "super_admin"}
            onClick={() =>
              startTransition(() => setCanAddExpenses(member.id, !member.can_add_expenses))
            }
          >
            {member.can_add_expenses ? "Revoke utilities" : "Grant utilities"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending || member.role === "super_admin"}
            onClick={() => startTransition(() => setCanAddBazaar(member.id, !member.can_add_bazaar))}
          >
            {member.can_add_bazaar ? "Revoke bazaar" : "Grant bazaar"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending || member.role === "super_admin"}
            onClick={() => startTransition(() => setCanAddMeals(member.id, !member.can_add_meals))}
          >
            {member.can_add_meals ? "Revoke meals" : "Grant meals"}
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
