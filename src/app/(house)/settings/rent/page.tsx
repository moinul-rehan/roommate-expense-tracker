import { Pencil } from "lucide-react";
import { requireSuperAdmin, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getDefaultCosts } from "@/lib/data/finance";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";
import { DefaultCostForm } from "./DefaultCostForm";
import { DeleteDefaultCostButton } from "./DeleteDefaultCostButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RentPage() {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();

  const [{ data: members }, defaultCosts] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, room_label")
      .eq("is_active", true)
      .order("last_name"),
    getDefaultCosts(supabase, profile.cottage_id),
  ]);

  const membersById = new Map((members ?? []).map((m) => [m.id, m]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Default Cost</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set each member&apos;s fixed monthly costs — rent, and any other utility that&apos;s the
            same every month. These auto-fill when generating the Utility Statement.
          </p>
        </div>
        <DefaultCostForm members={members ?? []} />
      </div>

      {Array.from(defaultCosts.entries()).map(([category, rows]) => {
        const categoryLabel = UTILITY_CATEGORY_LABELS[category] ?? category;
        const total = rows.reduce((sum, row) => sum + row.amount, 0);
        const amounts = Object.fromEntries(rows.map((row) => [row.user_id, row.amount]));

        return (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">{categoryLabel}</CardTitle>
              <div className="flex items-center gap-2">
                <DefaultCostForm
                  members={members ?? []}
                  editing={{ category, amounts }}
                  trigger={(open) => (
                    <Button size="sm" variant="outline" onClick={open}>
                      <Pencil />
                      Edit
                    </Button>
                  )}
                />
                <DeleteDefaultCostButton category={category} categoryLabel={categoryLabel} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {rows.map((row) => (
                <div key={row.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {membersById.get(row.user_id) ? getDisplayName(membersById.get(row.user_id)!) : "Former member"}
                  </span>
                  <span className="font-medium text-foreground">{row.amount.toFixed(2)} tk</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold text-foreground">
                <span>Total</span>
                <span>{total.toFixed(2)} tk</span>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {!defaultCosts.size && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No default costs set yet. Click &quot;Add Default Cost&quot; to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
