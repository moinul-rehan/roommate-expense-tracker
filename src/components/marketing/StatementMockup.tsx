import { cn } from "@/lib/utils";

const lines = [
  { label: "House Rent", value: "2,470 tk", sign: null },
  { label: "Electricity", value: "300 tk", sign: null },
  { label: "Internet", value: "250 tk", sign: null },
  { label: "June Meal Due", value: "450 tk", sign: "+" },
  { label: "Discount", value: "200 tk", sign: "−" },
  { label: "Advance Payment", value: "500 tk", sign: "−" },
];

export function StatementMockup() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/5">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#FF4F4F]/70" />
        <span className="size-2.5 rounded-full bg-[#FA9033]/70" />
        <span className="size-2.5 rounded-full bg-[#63B64E]/70" />
        <span className="ml-3 truncate rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">
          cottage.app/utilities/statement
        </span>
      </div>
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            A
          </div>
          <p className="text-sm font-semibold text-foreground">Alex</p>
        </div>
        <div className="flex flex-col gap-1.5 text-xs">
          {lines.map((l) => (
            <div key={l.label} className="flex justify-between">
              <span className="text-muted-foreground">{l.label}</span>
              <span
                className={cn(
                  "font-medium",
                  l.sign === "+" && "text-destructive",
                  l.sign === "−" && "text-emerald-600",
                  !l.sign && "text-foreground"
                )}
              >
                {l.sign ?? ""}
                {l.value}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 border-t border-border pt-2 text-xs">
          <div className="flex justify-between font-semibold text-foreground">
            <span>Total Utility Due</span>
            <span>2,770 tk</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Already Paid</span>
            <span>1,500 tk</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-destructive">
            <span>Remaining Due</span>
            <span>1,270 tk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
