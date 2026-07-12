"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getDisplayName } from "@/lib/data/display-name";

type Member = { first_name: string; last_name: string | null } | null;

export function ViewBazaarDialog({
  entryDate,
  amount,
  description,
  member,
}: {
  entryDate: string;
  amount: number;
  description: string | null;
  member: Member;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)}>
        <Eye className="size-3.5" />
        <span className="sr-only">View bazaar entry</span>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meal cost details</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 p-4 pt-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium text-foreground">{entryDate}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Spent by</span>
            <span className="font-medium text-foreground">{member ? getDisplayName(member) : "—"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium text-foreground">{amount.toFixed(2)} tk</span>
          </div>
          <div className="flex flex-col gap-1 border-t pt-3">
            <span className="text-muted-foreground">Description</span>
            <p className="whitespace-pre-wrap text-foreground">{description ?? "—"}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
