"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteContact } from "./actions";

export function DeleteContactButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => deleteContact(id))}
      className="text-muted-foreground hover:text-destructive"
      aria-label="Delete contact"
    >
      <X className="size-3.5" />
    </button>
  );
}
