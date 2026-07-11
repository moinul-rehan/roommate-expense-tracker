"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addDailyMealsForDate } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDisplayName } from "@/lib/data/display-name";

type Member = { id: string; first_name: string; last_name: string | null };

export function DailyMealForm({
  members,
  defaultDate,
  onSuccess,
  hideCard = false,
}: {
  members: Member[];
  defaultDate: string;
  onSuccess?: () => void;
  hideCard?: boolean;
}) {
  const [state, action, pending] = useActionState(addDailyMealsForDate, undefined);
  const wasPending = useRef(false);

  const [counts, setCounts] = useState<Record<string, { lunch: string; dinner: string }>>({});

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      onSuccess?.();
    }
    wasPending.current = pending;
  }, [pending, state, onSuccess]);

  function updateCount(memberId: string, meal: "lunch" | "dinner", value: string) {
    setCounts((prev) => ({
      ...prev,
      [memberId]: { lunch: prev[memberId]?.lunch ?? "", dinner: prev[memberId]?.dinner ?? "", [meal]: value },
    }));
  }

  const form = (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="member_ids" value={members.map((m) => m.id).join(",")} />
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="meal_date">Date</Label>
        <Input id="meal_date" name="meal_date" type="date" defaultValue={defaultDate} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead className="text-right">Lunch</TableHead>
            <TableHead className="text-right">Dinner</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => {
            const lunch = Number(counts[m.id]?.lunch ?? 0) || 0;
            const dinner = Number(counts[m.id]?.dinner ?? 0) || 0;
            return (
              <TableRow key={m.id}>
                <TableCell className="text-foreground">{getDisplayName(m)}</TableCell>
                <TableCell className="text-right">
                  <Input
                    name={`lunch_${m.id}`}
                    type="number"
                    step="0.5"
                    min="0"
                    defaultValue="0"
                    className="ml-auto w-20 text-right"
                    onChange={(e) => updateCount(m.id, "lunch", e.target.value)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    name={`dinner_${m.id}`}
                    type="number"
                    step="0.5"
                    min="0"
                    defaultValue="0"
                    className="ml-auto w-20 text-right"
                    onChange={(e) => updateCount(m.id, "dinner", e.target.value)}
                  />
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">{lunch + dinner}</TableCell>
              </TableRow>
            );
          })}
          {!members.length && (
            <TableRow>
              <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                No members to show yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save meal counts"}
      </Button>
    </form>
  );

  if (hideCard) return form;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Log daily meals</CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
}
