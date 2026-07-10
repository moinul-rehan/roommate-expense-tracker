"use client";

import { RotateCcw, CalendarPlus } from "lucide-react";
import { ConfirmPasswordDialog } from "@/components/ConfirmPasswordDialog";
import { Button } from "@/components/ui/button";
import { createNewMonth, resetMealMonth, resetUtilityMonth } from "./actions";

export function MonthActionButtons({ monthKey }: { monthKey: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <ConfirmPasswordDialog
        title="Reset Utility month"
        warning={`This permanently deletes every expense, settlement and Cottage Balance transaction recorded for ${monthKey}. This cannot be undone.`}
        confirmLabel="Reset Utilities"
        action={resetUtilityMonth}
        renderTrigger={(open) => (
          <Button variant="destructive" onClick={open}>
            <RotateCcw />
            Reset current month utilities
          </Button>
        )}
      />

      <ConfirmPasswordDialog
        title="Reset Meal month"
        warning={`This permanently deletes every bazaar entry, deposit and daily meal record for ${monthKey}. This cannot be undone.`}
        confirmLabel="Reset Meal"
        action={resetMealMonth}
        renderTrigger={(open) => (
          <Button variant="destructive" onClick={open}>
            <RotateCcw />
            Reset current month meal
          </Button>
        )}
      />

      <ConfirmPasswordDialog
        title="Create New Month"
        warning={`This locks ${monthKey} into History (no further edits) and starts a new active month. Meal balances carry forward into the new month's Utility ledger.`}
        confirmLabel="Create New Month"
        action={createNewMonth}
        renderTrigger={(open) => (
          <Button onClick={open}>
            <CalendarPlus />
            Create new month
          </Button>
        )}
      />
    </div>
  );
}
