"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { ChevronDown, ShoppingBasket, X, Mail, Phone, MapPin, Home } from "lucide-react";
import {
  setMemberActive,
  setCanAddExpenses,
  setCanAddBazaar,
  setCanAddMeals,
  setCanAddDeposit,
  assignBazaarDuty,
  removeBazaarDuty,
} from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { getDisplayName } from "@/lib/data/display-name";
import { VerifiedBadge } from "@/components/verified-badge";

type Member = {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  role: "super_admin" | "member";
  room_label: string | null;
  is_active: boolean;
  email: string | null;
  mobile_number: string | null;
  hometown: string | null;
  address: string | null;
  can_add_expenses: boolean;
  can_add_bazaar: boolean;
  can_add_meals: boolean;
  can_add_deposit: boolean;
};

type Duty = { id: string; start_date: string; end_date: string; note: string | null };

export function MemberCard({
  member,
  duties,
  viewerIsAdmin,
}: {
  member: Member;
  duties: Duty[];
  viewerIsAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [dutyOpen, setDutyOpen] = useState(false);
  const isSelf = member.role === "super_admin";

  return (
    <Card className="flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={member.avatar_url ?? undefined} alt={getDisplayName(member)} />
            <AvatarFallback>{member.first_name[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              {getDisplayName(member)}
              <VerifiedBadge
                role={member.role}
                can_add_expenses={member.can_add_expenses}
                can_add_bazaar={member.can_add_bazaar}
                can_add_meals={member.can_add_meals}
              />
            </span>
            <span className="text-xs text-muted-foreground">
              {member.role === "super_admin" ? "Super admin" : "Member"}
              {member.room_label ? ` · ${member.room_label}` : ""}
            </span>
          </div>
        </div>
        <Badge variant={member.is_active ? "default" : "secondary"}>
          {member.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {(member.email || member.mobile_number || member.hometown || member.address) && (
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          {member.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5 shrink-0" />
              {member.email}
            </span>
          )}
          {member.mobile_number && (
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5 shrink-0" />
              {member.mobile_number}
            </span>
          )}
          {member.hometown && (
            <span className="flex items-center gap-1.5">
              <Home className="size-3.5 shrink-0" />
              {member.hometown}
            </span>
          )}
          {member.address && (
            <span className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              {member.address}
            </span>
          )}
        </div>
      )}

      {duties.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {duties.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground"
            >
              <span className="flex items-center gap-1.5">
                <ShoppingBasket className="size-3.5" />
                Bazaar duty: {formatDate(d.start_date)} – {formatDate(d.end_date)}
              </span>
              {viewerIsAdmin && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => removeBazaarDuty(d.id))}
                  className="text-accent-foreground/70 hover:text-accent-foreground"
                  aria-label="Remove bazaar duty"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {viewerIsAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" disabled={isSelf} />}
            >
              Permissions
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Grant access</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={member.can_add_expenses}
                onCheckedChange={(v) => startTransition(() => setCanAddExpenses(member.id, v))}
              >
                Add utility expenses
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={member.can_add_bazaar}
                onCheckedChange={(v) => startTransition(() => setCanAddBazaar(member.id, v))}
              >
                Add meal cost
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={member.can_add_meals}
                onCheckedChange={(v) => startTransition(() => setCanAddMeals(member.id, v))}
              >
                Add meal
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={member.can_add_deposit}
                onCheckedChange={(v) => startTransition(() => setCanAddDeposit(member.id, v))}
              >
                Add meal deposit
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={() => setDutyOpen(true)}>
            <ShoppingBasket />
            Assign bazaar duty
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => setMemberActive(member.id, !member.is_active))}
            className="ml-auto"
          >
            {member.is_active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      )}

      <AssignDutyDialog
        open={dutyOpen}
        onOpenChange={setDutyOpen}
        userId={member.id}
        memberName={getDisplayName(member)}
      />
    </Card>
  );
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AssignDutyDialog({
  open,
  onOpenChange,
  userId,
  memberName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  memberName: string;
}) {
  const [state, action, pending] = useActionState(assignBazaarDuty, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign bazaar duty to {memberName}</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4 p-4 pt-2">
          <input type="hidden" name="user_id" value={userId} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" name="start_date" type="date" min={today} defaultValue={today} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="end_date">End date</Label>
              <Input id="end_date" name="end_date" type="date" min={today} required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Note</Label>
            <Input id="note" name="note" placeholder="Optional" />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Assigning…" : "Assign duty"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
