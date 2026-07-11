"use client";

import { useActionState, useMemo, useState } from "react";
import { addUtilityAdjustment } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDisplayName } from "@/lib/data/display-name";
import { cn } from "@/lib/utils";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";

type Member = { id: string; first_name: string; last_name: string | null };

const CATEGORY_OPTIONS = Object.entries(UTILITY_CATEGORY_LABELS).filter(([value]) => value !== "other");

export function UtilityAdjustmentForm({
  members,
  monthKey,
}: {
  members: Member[];
  monthKey: string;
}) {
  const [state, action, pending] = useActionState(addUtilityAdjustment, undefined);

  const [category, setCategory] = useState("electricity");
  const [amount, setAmount] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "reduce">("increase");
  const [applyTo, setApplyTo] = useState<"specific" | "all">("specific");
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [targetUserId, setTargetUserId] = useState("");
  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  const totalAmount = Number(amount) || 0;
  const customTotal = useMemo(
    () => members.reduce((sum, m) => sum + (Number(customShares[m.id]) || 0), 0),
    [members, customShares]
  );
  const customMismatch =
    applyTo === "all" && splitMode === "custom" && Math.abs(customTotal - totalAmount) > 0.005;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Add utility adjustment</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-5">
          <input type="hidden" name="month_key" value={monthKey} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select name="category" value={category} onValueChange={(v) => setCategory(v ?? "electricity")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {category === "other" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="custom-category">Custom category name</Label>
                <Input id="custom-category" name="custom_category" required placeholder="e.g. Discount" />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adj-amount">Amount</Label>
              <Input
                id="adj-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Paid by</Label>
              <Select name="paid_by" defaultValue="none">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Paid by…">
                    {(value: string | null) => {
                      if (value === "cottage_balance") return "Cottage Balance";
                      if (value === "none" || !value) return "None";
                      const member = members.find((m) => m.id === value);
                      return member ? getDisplayName(member) : "None";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="cottage_balance">Cottage Balance</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {getDisplayName(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Adjustment type</Label>
            <input type="hidden" name="adjustment_type" value={adjustmentType} />
            <div className="inline-flex w-fit overflow-hidden rounded-full border border-border p-1">
              <button
                type="button"
                onClick={() => setAdjustmentType("increase")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  adjustmentType === "increase"
                    ? "bg-destructive text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Increase Due
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("reduce")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  adjustmentType === "reduce"
                    ? "bg-[#63B64E] text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Reduce Due
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Apply to</Label>
            <input type="hidden" name="apply_to" value={applyTo} />
            <RadioGroup
              value={applyTo}
              onValueChange={(v) => setApplyTo((v as "specific" | "all") ?? "specific")}
              className="flex flex-row gap-6"
            >
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="specific" /> Specific member
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="all" /> All members
              </label>
            </RadioGroup>
          </div>

          {applyTo === "specific" && (
            <div className="flex flex-col gap-1.5 sm:w-64">
              <Label>Member</Label>
              <Select name="target_user_id" value={targetUserId} onValueChange={(v) => setTargetUserId(v ?? "")} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select…">
                    {(value: string | null) => {
                      const member = members.find((m) => m.id === value);
                      return member ? getDisplayName(member) : "Select…";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {getDisplayName(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {applyTo === "all" && (
            <div className="flex flex-col gap-3">
              <input type="hidden" name="split_mode" value={splitMode} />
              <RadioGroup
                value={splitMode}
                onValueChange={(v) => setSplitMode((v as "equal" | "custom") ?? "equal")}
                className="flex flex-row gap-6"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="equal" /> Split equally
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="custom" /> Custom split
                </label>
              </RadioGroup>

              {splitMode === "custom" && (
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 sm:grid-cols-3">
                  {members.map((m) => (
                    <div key={m.id} className="flex flex-col gap-1">
                      <Label htmlFor={`share_${m.id}`} className="text-xs text-muted-foreground">
                        {getDisplayName(m)}
                      </Label>
                      <Input
                        id={`share_${m.id}`}
                        name={`share_${m.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={customShares[m.id] ?? ""}
                        onChange={(e) =>
                          setCustomShares((prev) => ({ ...prev, [m.id]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                  <p className={cn("col-span-full text-xs", customMismatch ? "text-destructive" : "text-muted-foreground")}>
                    Assigned: {customTotal.toFixed(2)} / {totalAmount.toFixed(2)}
                    {customMismatch && " — must match the amount entered above."}
                  </p>
                </div>
              )}
            </div>
          )}

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending || customMismatch} className="self-start">
            {pending ? "Saving…" : "Add adjustment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
