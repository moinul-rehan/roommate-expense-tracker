"use client";

import { Trash2 } from "lucide-react";
import { ConfirmPasswordDialog } from "@/components/ConfirmPasswordDialog";
import { Button } from "@/components/ui/button";
import { deleteDefaultCostCategory } from "./actions";

export function DeleteDefaultCostButton({
  category,
  categoryLabel,
}: {
  category: string;
  categoryLabel: string;
}) {
  return (
    <ConfirmPasswordDialog
      title={`Delete ${categoryLabel}`}
      warning={`This removes the ${categoryLabel} default cost for every member. It won't affect statements already generated for past months.`}
      confirmLabel="Delete permanently"
      action={deleteDefaultCostCategory}
      hiddenFields={{ category }}
      renderTrigger={(open) => (
        <Button size="sm" variant="outline" onClick={open}>
          <Trash2 />
          Delete
        </Button>
      )}
    />
  );
}
