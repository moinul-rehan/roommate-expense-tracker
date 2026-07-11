"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import { inviteMember } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InviteForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(inviteMember, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state?.success) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="self-start">
        <UserPlus />
        Invite cottage member
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a Cottage member</DialogTitle>
          </DialogHeader>
          <form action={action} className="flex flex-col gap-4 p-4 pt-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" name="first_name" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" name="last_name" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="room_label">Room label</Label>
                <Input id="room_label" name="room_label" placeholder="e.g. Room 2A" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <Select name="role" defaultValue="member">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="super_admin">Super admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}
            <Button type="submit" disabled={pending} className="self-start">
              {pending ? "Sending invite…" : "Send invite"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
