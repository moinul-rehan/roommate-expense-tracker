"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInvoicePng, type InvoiceData } from "@/lib/generate-invoice-image";

export function ShareInvoiceButton({ invoice }: { invoice: InvoiceData }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    setPending(true);
    setError(null);
    try {
      const blob = await generateInvoicePng(invoice);
      const fileName = `utility-statement-${invoice.monthLabel.replace(/\s+/g, "-").toLowerCase()}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Utility Statement",
          text: `${invoice.cottageName} — Utility Statement (${invoice.monthLabel})`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Could not share the invoice. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={handleShare} disabled={pending}>
        <Share2 />
        {pending ? "Preparing…" : "Share Invoice"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
