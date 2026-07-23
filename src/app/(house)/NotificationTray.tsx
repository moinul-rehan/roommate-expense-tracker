"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { markNotificationRead } from "./notifications/actions";
import { getNotificationIcon } from "./notification-icons";
import { formatDateTime } from "@/lib/format-date";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationTray({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="relative flex size-[42px] items-center justify-center rounded-full border border-border bg-card"
          />
        }
      >
        <Bell className="size-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive" />
        )}
      </PopoverTrigger>
      <PopoverContent className="p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} unread</span>}
        </div>
        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {notifications.map((n) => {
            const Icon = getNotificationIcon(n.type);
            return (
              <div
                key={n.id}
                className={
                  "flex gap-2.5 rounded-lg px-2 py-2 " + (n.is_read ? "" : "bg-accent/40")
                }
              >
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Icon className="size-3.5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    {!n.is_read && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => startTransition(() => markNotificationRead(n.id))}
                        className="shrink-0 text-xs text-primary hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                  <p className="text-xs text-muted-foreground/70">
                    {formatDateTime(n.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          {!notifications.length && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/notifications" />}
          className="mt-1 w-full justify-center rounded-full"
        >
          View all
        </Button>
      </PopoverContent>
    </Popover>
  );
}
