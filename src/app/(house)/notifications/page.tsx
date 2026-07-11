import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/lib/data/notifications";
import { NotificationRow } from "./NotificationRow";
import { MarkAllReadButton } from "./MarkAllReadButton";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const notifications = await getNotifications(supabase, profile.id);
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Updates from the Meal ledger, Utility ledger, months and members.
          </p>
        </div>
        {hasUnread && <MarkAllReadButton />}
      </div>

      <Card className="p-0">
        <Table>
          <TableBody>
            {notifications.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
            {!notifications.length && (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  No notifications yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
