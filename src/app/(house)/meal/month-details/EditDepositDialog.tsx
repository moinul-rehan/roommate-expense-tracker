"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { updateDeposit } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function EditDepositDialog({
  id,
  amount,
  depositDate,
  note,
}: {
  id: string;
  amount: number;
  depositDate: string;
  note: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateDeposit, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)}>
        <Pencil className="size-3.5" />
        <span className="sr-only">Edit deposit</span>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit deposit</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4 p-4 pt-2">
          <input type="hidden" name="id" value={id} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`amount_${id}`}>Amount</Label>
              <Input id={`amount_${id}`} name="amount" type="number" step="0.01" min="0.01" defaultValue={amount} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`date_${id}`}>Date</Label>
              <Input id={`date_${id}`} name="deposit_date" type="date" defaultValue={depositDate} required />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor={`note_${id}`}>Note</Label>
              <Input id={`note_${id}`} name="note" defaultValue={note ?? ""} placeholder="Optional" />
            </div>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
