"use client";

import { useActionState } from "react";
import { recordSettlement } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDisplayName } from "@/lib/data/display-name";

type Member = { id: string; first_name: string; last_name: string | null };

export function SettleForm({
  members,
  currentUserId,
  defaultDate,
}: {
  members: Member[];
  currentUserId: string;
  defaultDate: string;
}) {
  const [state, action, pending] = useActionState(recordSettlement, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Record a payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select name="from_user" defaultValue={currentUserId} required>
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
            <Select name="to_user" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Paid to…">
                  {(value: string | null) => {
                    const member = members.find((m) => m.id === value);
                    return member ? getDisplayName(member) : "Paid to…";
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
            <Input name="amount" type="number" step="0.01" min="0.01" placeholder="Amount" required />
            <Input name="settled_on" type="date" defaultValue={defaultDate} />
            <Input name="note" placeholder="Note (optional)" className="sm:col-span-2" />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Saving…" : "Record payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
