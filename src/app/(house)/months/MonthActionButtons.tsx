"use client";

import { RotateCcw } from "lucide-react";
import { ConfirmPasswordDialog } from "@/components/ConfirmPasswordDialog";
import { Button } from "@/components/ui/button";
import { resetMealMonth, resetUtilityMonth } from "./actions";

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
    </div>
  );
}
