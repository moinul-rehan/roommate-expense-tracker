"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { addCottageCost } from "./utilities/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar";
import { getDisplayName } from "@/lib/data/display-name";

type Member = { id: string; first_name: string; last_name: string | null };

export function UtilitiesQuickAddMenu({
  members,
  defaultDate,
}: {
  members: Member[];
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [spentBy, setSpentBy] = useState<string>("");
  const [state, action, pending] = useActionState(addCottageCost, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
      setSpentBy("");
    }
    wasPending.current = pending;
  }, [pending, state]);

  const selectedMember = members.find((m) => m.id === spentBy);

  return (
    <SidebarMenuSub>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton onClick={() => setOpen(true)}>
          <Plus />
          Add Cottage Cost
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add cottage cost</DialogTitle>
          </DialogHeader>
          <form action={action} className="flex flex-col gap-4 p-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cost-name">Cost name</Label>
              <Input id="cost-name" name="name" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cost-amount">Amount</Label>
                <Input id="cost-amount" name="amount" type="number" step="0.01" min="0.01" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cost-date">Date</Label>
                <Input id="cost-date" name="expense_date" type="date" defaultValue={defaultDate} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Who spent</Label>
              <Select name="spent_by" value={spentBy} onValueChange={(v) => setSpentBy(v ?? "")} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select…">
                    {(value: string | null) => {
                      if (value === "cottage_balance") return "Cottage Balance";
                      const member = members.find((m) => m.id === value);
                      return member ? getDisplayName(member) : "Select…";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {getDisplayName(m)}
                    </SelectItem>
                  ))}
                  <SelectItem value="cottage_balance">Cottage Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedMember && (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox name="borne_by_payer" />
                It&apos;s borne by {getDisplayName(selectedMember)}
              </label>
            )}

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending} className="self-start">
              {pending ? "Saving…" : "Add"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarMenuSub>
  );
}
