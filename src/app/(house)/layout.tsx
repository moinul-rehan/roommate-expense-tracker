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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/verified-badge";
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
  const unreadCount = await getUnreadCount(supabase, profile.id);

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
        <header className="flex items-center gap-2 border-b bg-background px-4 py-2">
          <SidebarTrigger />
          <span className="text-sm font-semibold text-foreground sm:hidden">Cottage</span>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
