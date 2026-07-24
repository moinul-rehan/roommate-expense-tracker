"use client";

import { useState } from "react";
import { Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInvoicePng, type InvoiceData } from "@/lib/generate-invoice-image";

function invoiceFileName(invoice: InvoiceData) {
  return `utility-statement-${invoice.monthLabel.replace(/\s+/g, "-").toLowerCase()}.png`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function ShareInvoiceButton({ invoice }: { invoice: InvoiceData }) {
  const [pending, setPending] = useState<"share" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    setPending("share");
    setError(null);
    try {
      const blob = await generateInvoicePng(invoice);
      const fileName = invoiceFileName(invoice);
      const file = new File([blob], fileName, { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Utility Statement",
          text: `${invoice.cottageName} — Utility Statement (${invoice.monthLabel})`,
        });
      } else {
        downloadBlob(blob, fileName);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Could not share the invoice. Try again.");
    } finally {
      setPending(null);
    }
  }

  async function handleSave() {
    setPending("save");
    setError(null);
    try {
      const blob = await generateInvoicePng(invoice);
      downloadBlob(blob, invoiceFileName(invoice));
    } catch {
      setError("Could not save the invoice. Try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleSave} disabled={pending !== null}>
          <Download />
          {pending === "save" ? "Saving…" : "Save PNG"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleShare} disabled={pending !== null}>
          <Share2 />
          {pending === "share" ? "Preparing…" : "Share Invoice"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
