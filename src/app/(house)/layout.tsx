import {
  LayoutDashboard,
  UtensilsCrossed,
  Zap,
  Users,
  CalendarRange,
  Contact,
  Settings as SettingsIcon,
} from "lucide-react";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount, getNotifications } from "@/lib/data/notifications";
import { getActiveMonthKey, defaultDateForMonth, formatMonthKey } from "@/lib/data/months";
import { MealQuickAddMenu } from "./MealQuickAddMenu";
import { UtilitiesQuickAddMenu } from "./UtilitiesQuickAddMenu";
import { SidebarNavLink } from "./SidebarNavLink";
import { PageHeader } from "./PageHeader";
import { Logo } from "@/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const topLinks = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];
const bottomLinks = [
  { href: "/members", label: "Members", icon: Users },
  { href: "/months", label: "Months", icon: CalendarRange },
  { href: "/contacts", label: "Contact", icon: Contact },
];

export default async function HouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const [unreadCount, notifications, { data: members }, activeMonthKey] = await Promise.all([
    getUnreadCount(supabase, profile.id),
    getNotifications(supabase, profile.id, 6),
    supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true).order("last_name"),
    getActiveMonthKey(supabase, profile.cottage_id),
  ]);
  const defaultDate = defaultDateForMonth(activeMonthKey);

  return (
    <SidebarProvider className="min-h-0 flex-1 bg-background">
      <Sidebar collapsible="icon" className="border-none">
        <SidebarHeader className="gap-14 px-3 py-8">
          <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="flex items-center gap-2">
              <Logo size={32} />
              <span className="text-2xl font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
                Cottage
              </span>
            </div>
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent className="gap-10 px-3">
          <SidebarMenu className="gap-2.5">
            {topLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarNavLink href={link.href} label={link.label} icon={<link.icon />} />
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <div className="flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/60 group-data-[collapsible=icon]:justify-center">
                <UtensilsCrossed className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">Meal</span>
              </div>
            </SidebarMenuItem>
            <MealQuickAddMenu
              members={members ?? []}
              defaultDate={defaultDate}
              canAddBazaar={profile.role === "super_admin" || profile.can_add_bazaar}
              canAddMeals={profile.role === "super_admin" || profile.can_add_meals}
              canAddDeposit={profile.role === "super_admin" || profile.can_add_deposit}
            />
            <SidebarMenuItem>
              <div className="flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/60 group-data-[collapsible=icon]:justify-center">
                <Zap className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">Utilities</span>
              </div>
            </SidebarMenuItem>
            <UtilitiesQuickAddMenu
              members={members ?? []}
              defaultDate={defaultDate}
              isSuperAdmin={profile.role === "super_admin"}
            />
            {bottomLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarNavLink href={link.href} label={link.label} icon={<link.icon />} />
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarNavLink href="/settings/profile" label="Settings" icon={<SettingsIcon />} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarRail />
      <SidebarInset className="bg-background">
        <PageHeader
          profile={profile}
          displayName={getDisplayName(profile)}
          monthLabel={formatMonthKey(activeMonthKey)}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8 sm:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
