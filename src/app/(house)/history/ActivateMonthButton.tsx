"use client";

import { RotateCw } from "lucide-react";
import { ConfirmPasswordDialog } from "@/components/ConfirmPasswordDialog";
import { Button } from "@/components/ui/button";
import { formatMonthKey } from "@/lib/format-month";
import { activateMonth } from "./actions";

export function ActivateMonthButton({ monthKey }: { monthKey: string }) {
  return (
    <ConfirmPasswordDialog
      title={`Activate ${formatMonthKey(monthKey)}`}
      warning={`This reopens ${formatMonthKey(monthKey)} for editing everywhere (Dashboard, Meal, Utilities) and locks whatever month is currently active in its place.`}
      confirmLabel="Activate"
      action={activateMonth}
      hiddenFields={{ month_key: monthKey }}
      renderTrigger={(open) => (
        <Button size="sm" variant="outline" onClick={open}>
          <RotateCw />
          Activate
        </Button>
      )}
    />
  );
}
