"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Line = { id: string; label: string; amount: number };

export function UtilityBreakdownDialog({
  lines,
  assignedCost,
  paid,
  due,
}: {
  lines: Line[];
  assignedCost: number;
  paid: number;
  due: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        See details
        <ChevronRight className="size-3.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Utility Breakdown</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 p-4 pt-2 text-sm">
            <div className="flex flex-col gap-1.5">
              {lines.map((l) => (
                <div key={l.id} className="flex justify-between">
                  <span className="text-muted-foreground">{l.label}</span>
                  <span className={cn("font-medium", l.amount >= 0 ? "text-destructive" : "text-emerald-600")}>
                    {l.amount >= 0 ? "+" : "−"}
                    {Math.abs(l.amount).toFixed(2)} tk
                  </span>
                </div>
              ))}
              {!lines.length && <p className="text-muted-foreground">No utility costs yet this month.</p>}
            </div>

            <div className="flex flex-col gap-1 border-t pt-2">
              <div className="flex justify-between font-semibold text-foreground">
                <span>Assigned Cost</span>
                <span>{assignedCost.toFixed(2)} tk</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Paid</span>
                <span>{paid.toFixed(2)} tk</span>
              </div>
              <div
                className={cn(
                  "flex justify-between text-base font-semibold",
                  due < 0 ? "text-emerald-600" : "text-destructive"
                )}
              >
                <span>{due < 0 ? "Advance Balance" : "Remaining Due"}</span>
                <span>{Math.abs(due).toFixed(2)} tk</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
