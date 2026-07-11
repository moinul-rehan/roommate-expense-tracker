"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { ConfirmPasswordDialog } from "@/components/ConfirmPasswordDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMonthKey } from "@/lib/format-month";
import { setActiveMonth } from "./actions";

export function SetActiveMonthCard({ currentMonthKey }: { currentMonthKey: string }) {
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const maxMonth = new Date().toISOString().slice(0, 7);
  const isValid = /^\d{4}-\d{2}$/.test(monthKey) && monthKey <= maxMonth;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-w-xs flex-col gap-1.5">
        <Label htmlFor="active-month-input">Set active month</Label>
        <Input
          id="active-month-input"
          type="month"
          max={maxMonth}
          value={monthKey}
          onChange={(e) => setMonthKey(e.target.value)}
        />
        {!isValid && (
          <p className="text-xs text-destructive">You can&apos;t activate a month that hasn&apos;t started yet.</p>
        )}
      </div>
      <ConfirmPasswordDialog
        title={`Set active month to ${formatMonthKey(monthKey)}`}
        warning={`This locks whatever month is currently active into History and opens ${formatMonthKey(monthKey)} for editing. If that month was already in History, it will be reopened.`}
        confirmLabel="Set Active Month"
        action={setActiveMonth}
        hiddenFields={{ month_key: monthKey }}
        renderTrigger={(open) => (
          <Button onClick={open} disabled={!isValid || monthKey === currentMonthKey} className="self-start">
            <CalendarCheck />
            Set Active Month
          </Button>
        )}
      />
    </div>
  );
}
