"use client";

import { usePathname } from "next/navigation";
import { MobileSidebarTrigger } from "./MobileSidebarTrigger";
import { NotificationTray } from "./NotificationTray";
import { ProfileMenu } from "./ProfileMenu";
import { VerifiedBadge } from "@/components/verified-badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

type Profile = {
  role: "super_admin" | "member";
  avatar_url: string | null;
  first_name: string;
  can_add_expenses: boolean;
  can_add_bazaar: boolean;
  can_add_meals: boolean;
  can_add_deposit: boolean;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function PageHeader({
  profile,
  displayName,
  monthLabel,
  notifications,
  unreadCount,
}: {
  profile: Profile;
  displayName: string;
  monthLabel: string;
  notifications: Notification[];
  unreadCount: number;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-8 sm:py-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="hidden shrink-0 md:inline-flex" />

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:hidden">
          <MobileSidebarTrigger />
          {isDashboard && (
            <div className="flex shrink-0 items-center gap-2.5">
              <ThemeToggle />
              <NotificationTray notifications={notifications} unreadCount={unreadCount} />
              <ProfileMenu
                name={displayName}
                avatarUrl={profile.avatar_url}
                initial={profile.first_name[0]?.toUpperCase() ?? "?"}
              />
            </div>
          )}
        </div>

        {isDashboard && (
          <div className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="flex items-center gap-1.5 truncate text-xl font-bold text-foreground sm:text-2xl">
              Welcome, {displayName}
              <VerifiedBadge
                role={profile.role}
                can_add_expenses={profile.can_add_expenses}
                can_add_bazaar={profile.can_add_bazaar}
                can_add_meals={profile.can_add_meals}
                can_add_deposit={profile.can_add_deposit}
              />
            </span>
            <span className="truncate text-sm text-muted-foreground">
              Here&apos;s where things stand for {monthLabel}.
            </span>
          </div>
        )}
      </div>

      {isDashboard && (
        <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
          <ThemeToggle />
          <NotificationTray notifications={notifications} unreadCount={unreadCount} />
          <ProfileMenu
            name={displayName}
            avatarUrl={profile.avatar_url}
            initial={profile.first_name[0]?.toUpperCase() ?? "?"}
          />
        </div>
      )}
    </header>
  );
}
