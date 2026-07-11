"use client";

import { useTransition } from "react";
import Link from "next/link";
import { markNotificationRead } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationRow({ notification }: { notification: Notification }) {
  const [pending, startTransition] = useTransition();

  return (
    <TableRow className={notification.is_read ? undefined : "bg-accent/40"}>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 font-medium text-foreground">
            {notification.title}
            {!notification.is_read && <Badge variant="default">New</Badge>}
          </span>
          {notification.body && <span className="text-sm text-muted-foreground">{notification.body}</span>}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(notification.created_at).toLocaleString()}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {notification.link && (
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={notification.link} />}>
              View
            </Button>
          )}
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => startTransition(() => markNotificationRead(notification.id))}
            >
              Mark read
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
