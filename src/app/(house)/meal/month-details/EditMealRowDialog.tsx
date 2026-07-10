"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { updateDailyMealsForDate } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getDisplayName } from "@/lib/data/display-name";

type Member = { id: string; first_name: string; last_name: string | null };

export function EditMealRowDialog({
  date,
  members,
  counts,
}: {
  date: string;
  members: Member[];
  counts: number[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateDailyMealsForDate, undefined);
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
        <span className="sr-only">Edit meals for {date}</span>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit meals — {date}</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4 p-4 pt-2">
          <input type="hidden" name="meal_date" value={date} />
          <input type="hidden" name="member_ids" value={members.map((m) => m.id).join(",")} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {members.map((m, i) => (
              <div key={m.id} className="flex flex-col gap-1">
                <Label htmlFor={`count_${m.id}`} className="text-xs text-muted-foreground">
                  {getDisplayName(m)}
                </Label>
                <Input
                  id={`count_${m.id}`}
                  name={`count_${m.id}`}
                  type="number"
                  step="0.5"
                  min="0"
                  defaultValue={counts[i] ?? 0}
                />
              </div>
            ))}
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
