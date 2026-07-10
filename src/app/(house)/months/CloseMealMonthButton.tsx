"use client";

import { useState, useTransition } from "react";
import { closeCurrentMealMonth } from "./actions";
import { Button } from "@/components/ui/button";

export function CloseMealMonthButton({ monthKey, alreadyClosed }: { monthKey: string; alreadyClosed: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ error?: string; success?: string } | undefined>();

  function handleClick() {
    startTransition(async () => {
      const result = await closeCurrentMealMonth();
      setMessage(result);
    });
  }

  if (alreadyClosed) {
    return (
      <p className="text-sm text-muted-foreground">
        {monthKey} meal month is already archived.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={pending} className="self-start">
        {pending ? "Closing…" : "Close & archive meal month"}
      </Button>
      {message?.error && <p className="text-sm text-destructive">{message.error}</p>}
      {message?.success && <p className="text-sm text-emerald-600">{message.success}</p>}
    </div>
  );
}
