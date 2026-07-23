"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { saveDefaultCost } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDisplayName } from "@/lib/data/display-name";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";

type Member = { id: string; first_name: string; last_name: string | null };

const CATEGORY_OPTIONS = Object.entries(UTILITY_CATEGORY_LABELS).filter(([value]) => value !== "other");

export function DefaultCostForm({ members }: { members: Member[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveDefaultCost, undefined);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]?.[0] ?? "electricity");
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Add Default Cost
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Default Cost</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 p-4 pt-2">
            <form action={action} className="flex flex-col gap-4">
              <input type="hidden" name="member_ids" value={members.map((m) => m.id).join(",")} />

              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Select name="category" value={category} onValueChange={(v) => setCategory(v ?? category)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-3">
                <Label>Split among members</Label>
                {members.map((m) => (
                  <div key={m.id} className="grid grid-cols-2 items-center gap-3">
                    <span className="text-sm text-foreground">{getDisplayName(m)}</span>
                    <Input name={`amount_${m.id}`} type="number" step="0.01" min="0" placeholder="0.00" />
                  </div>
                ))}
                {!members.length && (
                  <p className="text-sm text-muted-foreground">No active members yet.</p>
                )}
              </div>

              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
              <Button type="submit" disabled={pending || !members.length} className="self-start">
                {pending ? "Saving…" : "Save default cost"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
