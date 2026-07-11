"use client";

import { useTransition } from "react";
import { markAllNotificationsRead } from "./actions";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => markAllNotificationsRead())}
    >
      {pending ? "Marking…" : "Mark all read"}
    </Button>
  );
}
