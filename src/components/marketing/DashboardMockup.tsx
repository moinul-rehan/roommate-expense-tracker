import { Wallet, Receipt, HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";

const statTiles = [
  { icon: Wallet, tone: "blue", label: "Cottage Balance", value: "4,250 tk" },
  { icon: Receipt, tone: "orange", label: "Total Utility Expense", value: "6,950 tk" },
  { icon: HandCoins, tone: "red", label: "Outstanding From Members", value: "1,270 tk" },
  { icon: HandCoins, tone: "green", label: "Collected This Month", value: "3,500 tk" },
] as const;

const memberRows = [
  { name: "Alex", meals: 42, balance: "220 tk", positive: true },
  { name: "Sam", meals: 38, balance: "-150 tk", positive: false },
  { name: "Priya", meals: 45, balance: "80 tk", positive: true },
];

const tones = {
  blue: "bg-[#FBEAE5] text-[#DE7356]",
  green: "bg-[#63B64E]/15 text-[#63B64E]",
  orange: "bg-[#FA9033]/15 text-[#FA9033]",
  red: "bg-[#FF4F4F]/15 text-[#FF4F4F]",
} as const;

export function DashboardMockup() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/5">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#FF4F4F]/70" />
        <span className="size-2.5 rounded-full bg-[#FA9033]/70" />
        <span className="size-2.5 rounded-full bg-[#63B64E]/70" />
        <span className="ml-3 truncate rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">
          cottage.app/dashboard
        </span>
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div>
          <p className="text-lg font-bold text-foreground">Welcome, Alex</p>
          <p className="text-xs text-muted-foreground">Here&apos;s where things stand for July, 2026.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {statTiles.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tones[s.tone])}>
                <s.icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] text-muted-foreground sm:text-xs">{s.label}</p>
                <p className="truncate text-sm font-semibold text-foreground sm:text-base">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-foreground">Member meal summary</p>
          {memberRows.map((m) => (
            <div
              key={m.name}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {m.name[0]}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground">{m.meals} meals</p>
                </div>
              </div>
              <p className={cn("text-xs font-semibold", m.positive ? "text-emerald-600" : "text-destructive")}>
                {m.balance}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
