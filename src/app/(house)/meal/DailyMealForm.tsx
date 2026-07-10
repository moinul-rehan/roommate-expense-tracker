"use client";

import { useActionState } from "react";
import { addDailyMeal } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDisplayName } from "@/lib/data/display-name";

type Member = { id: string; first_name: string; last_name: string | null };

export function DailyMealForm({ members }: { members: Member[] }) {
  const [state, action, pending] = useActionState(addDailyMeal, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Log daily meals</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Member</Label>
              <Select name="user_id" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Member…">
                    {(value: string | null) => {
                      const member = members.find((m) => m.id === value);
                      return member ? getDisplayName(member) : "Member…";
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meal_date">Date</Label>
              <Input id="meal_date" name="meal_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="count">Meal count</Label>
              <Input id="count" name="count" type="number" step="0.5" min="0" defaultValue="1" required />
            </div>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Saving…" : "Save meal count"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
