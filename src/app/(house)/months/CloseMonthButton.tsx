"use client";

import { useState, useTransition } from "react";
import { closeCurrentMonth } from "./actions";
import { Button } from "@/components/ui/button";

export function CloseMonthButton({ monthKey, alreadyClosed }: { monthKey: string; alreadyClosed: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ error?: string; success?: string } | undefined>();

  function handleClick() {
    startTransition(async () => {
      const result = await closeCurrentMonth();
      setMessage(result);
    });
  }

  if (alreadyClosed) {
    return (
      <p className="text-sm text-muted-foreground">
        {monthKey} is already closed — expenses and settlements in it are locked.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={pending} className="self-start">
        {pending ? "Closing…" : `Close & start new month`}
      </Button>
      {message?.error && <p className="text-sm text-destructive">{message.error}</p>}
      {message?.success && <p className="text-sm text-emerald-600">{message.success}</p>}
    </div>
  );
}
