"use client";

import { useActionState, useMemo, useState } from "react";
import { addExpense } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getDisplayName } from "@/lib/data/display-name";

type Member = { id: string; first_name: string; last_name: string | null };
type RentByMember = { user_id: string; monthly_rent_amount: number };

const CATEGORIES = [
  { value: "house_rent", label: "House Rent" },
  { value: "electricity", label: "Electricity" },
  { value: "servant", label: "Servant Cost" },
  { value: "trash", label: "Trash Cost" },
  { value: "internet", label: "Internet Cost" },
  { value: "filter_kit", label: "Filter Kit Cost" },
  { value: "other", label: "Other" },
];

export function AddExpenseForm({
  members,
  rents,
  defaultDate,
}: {
  members: Member[];
  rents: RentByMember[];
  defaultDate: string;
}) {
  const [state, action, pending] = useActionState(addExpense, undefined);
  const [category, setCategory] = useState<string>("servant");
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [paymentSource, setPaymentSource] = useState<"member" | "cottage_balance">("member");
  const isHouseRent = category === "house_rent";

  const rentByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rents) map.set(r.user_id, Number(r.monthly_rent_amount));
    return map;
  }, [rents]);

  const rentTotal = members.reduce((sum, m) => sum + (rentByUser.get(m.id) ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Add an expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select
                name="category"
                defaultValue="servant"
                onValueChange={(value) => setCategory(value ?? "servant")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isHouseRent && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
              </div>
            )}
            {paymentSource === "member" && !isHouseRent && (
              <div className="flex flex-col gap-1.5">
                <Label>Paid by</Label>
                <Select name="paid_by" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Paid by…">
                      {(value: string | null) => {
                        const member = members.find((m) => m.id === value);
                        return member ? getDisplayName(member) : "Paid by…";
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
            {paymentSource === "member" && isHouseRent && (
              <div className="flex flex-col gap-1.5">
                <Label>Paid to landlord by</Label>
                <Select name="paid_by" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Paid by…">
                      {(value: string | null) => {
                        const member = members.find((m) => m.id === value);
                        return member ? getDisplayName(member) : "Paid by…";
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expense_date">Date</Label>
              <Input
                id="expense_date"
                name="expense_date"
                type="date"
                defaultValue={defaultDate}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Optional" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Payment source</Label>
            <RadioGroup
              name="payment_source"
              defaultValue="member"
              className="flex flex-row gap-6"
              onValueChange={(value) => setPaymentSource(value as "member" | "cottage_balance")}
            >
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="member" /> Paid by a member
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="cottage_balance" /> Cottage Balance
              </label>
            </RadioGroup>
          </div>

          {isHouseRent ? (
            <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                Each member&apos;s share is pulled automatically from their assigned rent under{" "}
                <span className="font-medium text-foreground">Settings → Rent</span> — no manual
                amount or split needed.
              </p>
              <div className="flex flex-col gap-1 text-sm">
                {members.map((m) => (
                  <div key={m.id} className="flex justify-between">
                    <span className="text-muted-foreground">{getDisplayName(m)}</span>
                    <span className="font-medium text-foreground">
                      {(rentByUser.get(m.id) ?? 0).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="mt-1 flex justify-between border-t pt-1 font-semibold text-foreground">
                  <span>Total</span>
                  <span>{rentTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {paymentSource === "member" && (
                <div className="flex flex-col gap-1.5">
                  <Label>Split</Label>
                  <RadioGroup
                    name="split_type"
                    defaultValue="equal"
                    className="flex flex-row gap-6"
                    onValueChange={(value) => setSplitType(value as "equal" | "custom")}
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="equal" /> Split equally
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="custom" /> Custom split
                    </label>
                  </RadioGroup>
                </div>
              )}

              {paymentSource === "member" && splitType === "custom" && (
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
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Saving…" : "Add expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
