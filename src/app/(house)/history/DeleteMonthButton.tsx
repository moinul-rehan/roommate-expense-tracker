"use client";

import { Trash2 } from "lucide-react";
import { ConfirmPasswordDialog } from "@/components/ConfirmPasswordDialog";
import { Button } from "@/components/ui/button";
import { formatMonthKey } from "@/lib/format-month";
import { deleteMonth } from "./actions";

export function DeleteMonthButton({ monthKey }: { monthKey: string }) {
  return (
    <ConfirmPasswordDialog
      title={`Delete ${formatMonthKey(monthKey)}`}
      warning={`This permanently deletes every meal, utility, bazaar, deposit and settlement record for ${formatMonthKey(monthKey)}. This cannot be undone.`}
      confirmLabel="Delete permanently"
      action={deleteMonth}
      hiddenFields={{ month_key: monthKey }}
      renderTrigger={(open) => (
        <Button size="sm" variant="destructive" onClick={open}>
          <Trash2 />
          Delete
        </Button>
      )}
    />
  );
}
