"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListTree, FileText, Wallet, HandCoins, History } from "lucide-react";
import { MemberDepositForm } from "./utilities/MemberDepositForm";
import { CottageDepositForm } from "./utilities/CottageDepositForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type Member = { id: string; first_name: string; last_name: string | null };

export function UtilitiesQuickAddMenu({
  members,
  defaultDate,
  isSuperAdmin,
}: {
  members: Member[];
  defaultDate: string;
  isSuperAdmin: boolean;
}) {
  const [open, setOpen] = useState<"member-deposit" | "cottage-deposit" | null>(null);
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  function go(dialog: typeof open) {
    setOpenMobile(false);
    setOpen(dialog);
  }

  function isActive(href: string) {
    return pathname === href;
  }

  function itemClass(href?: string) {
    return cn(
      "gap-3 rounded-full px-3 py-2.5",
      href && isActive(href)
        ? "bg-accent font-semibold text-accent-foreground hover:bg-accent hover:text-accent-foreground"
        : "font-normal text-sidebar-foreground"
    );
  }

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          render={<Link href="/utilities" onClick={() => setOpenMobile(false)} />}
          tooltip="Utility Details"
          isActive={isActive("/utilities")}
          className={itemClass("/utilities")}
        >
          <ListTree />
          <span className="truncate">Utility Details</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {isSuperAdmin && (
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<Link href="/utilities/statement" onClick={() => setOpenMobile(false)} />}
            tooltip="Utility Statements"
            isActive={isActive("/utilities/statement")}
            className={itemClass("/utilities/statement")}
          >
            <FileText />
            <span className="truncate">Utility Statements</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      {isSuperAdmin && (
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => go("member-deposit")} tooltip="Member Deposit" className={itemClass()}>
            <Wallet />
            <span className="truncate">Member Deposit</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      {isSuperAdmin && (
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => go("cottage-deposit")} tooltip="Cottage Deposit" className={itemClass()}>
            <HandCoins />
            <span className="truncate">Cottage Deposit</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      <SidebarMenuItem>
        <SidebarMenuButton
          render={<Link href="/utilities/history" onClick={() => setOpenMobile(false)} />}
          tooltip="Utility History"
          isActive={isActive("/utilities/history")}
          className={itemClass("/utilities/history")}
        >
          <History />
          <span className="truncate">Utility History</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <Dialog open={open === "member-deposit"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Member Utility Deposit</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <MemberDepositForm members={members} defaultDate={defaultDate} onSuccess={() => setOpen(null)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "cottage-deposit"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cottage Deposit</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <CottageDepositForm defaultDate={defaultDate} onSuccess={() => setOpen(null)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
