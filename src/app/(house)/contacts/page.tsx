import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateContactDialog } from "./CreateContactDialog";
import { DeleteContactButton } from "./DeleteContactButton";
import { Mail, Phone } from "lucide-react";

export default async function ContactsPage() {
  const profile = await getCurrentProfile();
  const isSuperAdmin = profile.role === "super_admin";
  const supabase = await createClient();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, level, mobile_number, email")
    .eq("cottage_id", profile.cottage_id)
    .order("name");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Contact</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Necessary people for the Cottage — landlord, electrician, and the like.
          </p>
        </div>
        {isSuperAdmin && <CreateContactDialog />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contacts?.map((c) => (
          <Card key={c.id} className="flex flex-col gap-3 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-foreground">{c.name}</p>
                  {c.level && <Badge variant="outline">{c.level}</Badge>}
                </div>
                {c.mobile_number && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="size-3.5 shrink-0" />
                    {c.mobile_number}
                  </span>
                )}
                {c.email && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="size-3.5 shrink-0" />
                    {c.email}
                  </span>
                )}
              </div>
              {isSuperAdmin && <DeleteContactButton id={c.id} />}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!c.mobile_number}
                nativeButton={!c.mobile_number}
                className="flex-1"
                render={c.mobile_number ? <a href={`tel:${c.mobile_number}`} /> : undefined}
              >
                <Phone />
                Call
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!c.email}
                nativeButton={!c.email}
                className="flex-1"
                render={c.email ? <a href={`mailto:${c.email}`} /> : undefined}
              >
                <Mail />
                Email
              </Button>
            </div>
          </Card>
        ))}
        {!contacts?.length && (
          <Card className="p-4 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            No contacts yet.
          </Card>
        )}
      </div>
    </div>
  );
}
