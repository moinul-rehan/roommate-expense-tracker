"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SidebarNavLink({
  href,
  label,
  icon,
  unreadCount,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <SidebarMenuButton
      render={<Link href={href} />}
      tooltip={label}
      isActive={isActive}
      className={cn(
        "gap-3 rounded-full px-3 py-2.5",
        isActive
          ? "bg-accent font-semibold text-accent-foreground hover:bg-accent hover:text-accent-foreground"
          : "font-normal text-sidebar-foreground"
      )}
    >
      {icon}
      {label}
      {unreadCount ? (
        <Badge variant="default" className="ml-auto">
          {unreadCount}
        </Badge>
      ) : null}
    </SidebarMenuButton>
  );
}
