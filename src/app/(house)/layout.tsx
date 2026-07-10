import Link from "next/link";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Zap,
  Users,
  CalendarRange,
  Bell,
  Settings as SettingsIcon,
} from "lucide-react";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { logout } from "@/lib/auth-actions";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/lib/data/notifications";
import { getActiveMonthKey, defaultDateForMonth } from "@/lib/data/months";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/verified-badge";
import { MealQuickAddMenu } from "./MealQuickAddMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const memberLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meal", label: "Meal", icon: UtensilsCrossed },
  { href: "/utilities", label: "Utilities", icon: Zap },
  { href: "/members", label: "Members", icon: Users },
  { href: "/months", label: "Months", icon: CalendarRange },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export default async function HouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const [unreadCount, { data: members }, activeMonthKey] = await Promise.all([
    getUnreadCount(supabase, profile.id),
    supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true).order("last_name"),
    getActiveMonthKey(supabase, profile.cottage_id),
  ]);
  const defaultDate = defaultDateForMonth(activeMonthKey);

  return (
    <SidebarProvider className="min-h-0 flex-1">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-foreground">
            Cottage
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {memberLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton render={<Link href={link.href} />} tooltip={link.label}>
                  <link.icon />
                  {link.label}
                  {link.href === "/notifications" && unreadCount > 0 && (
                    <Badge variant="default" className="ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </SidebarMenuButton>
                {link.href === "/meal" && (
                  <MealQuickAddMenu
                    members={members ?? []}
                    defaultDate={defaultDate}
                    canAddBazaar={profile.role === "super_admin" || profile.can_add_bazaar}
                    canAddMeals={profile.role === "super_admin" || profile.can_add_meals}
                    canAddDeposit={profile.role === "super_admin"}
                  />
                )}
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/settings/profile" />} tooltip="Settings">
                <SettingsIcon />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Avatar size="sm">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={getDisplayName(profile)} />
              <AvatarFallback>{profile.first_name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-1 items-center gap-1 truncate text-sm text-foreground">
              {getDisplayName(profile)}
              <VerifiedBadge
                role={profile.role}
                can_add_expenses={profile.can_add_expenses}
                can_add_bazaar={profile.can_add_bazaar}
                can_add_meals={profile.can_add_meals}
              />
            </span>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm" className="w-full">
              Log out
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-3 border-b bg-background px-4 py-2">
          <SidebarTrigger />
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
              Welcome, {getDisplayName(profile)}
              <VerifiedBadge
                role={profile.role}
                can_add_expenses={profile.can_add_expenses}
                can_add_bazaar={profile.can_add_bazaar}
                can_add_meals={profile.can_add_meals}
              />
            </span>
            <span className="hidden truncate text-xs text-muted-foreground sm:block">
              Here&apos;s where things stand for{" "}
              {new Date(`${activeMonthKey}-01T00:00:00`).toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
              .
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
