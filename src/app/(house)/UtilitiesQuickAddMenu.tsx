"use client";

import { useState } from "react";
import Link from "next/link";
import { ListTree, FileText, Wallet, HandCoins, History } from "lucide-react";
import { MemberDepositForm } from "./utilities/MemberDepositForm";
import { CottageDepositForm } from "./utilities/CottageDepositForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar";

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

  function go(dialog: typeof open) {
    setOpenMobile(false);
    setOpen(dialog);
  }

  return (
    <SidebarMenuSub>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton render={<Link href="/utilities" onClick={() => setOpenMobile(false)} />}>
          <ListTree />
          Utility Details
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
      {isSuperAdmin && (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton render={<Link href="/utilities/statement" onClick={() => setOpenMobile(false)} />}>
            <FileText />
            Member Utility Statements
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      )}
      {isSuperAdmin && (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton onClick={() => go("member-deposit")}>
            <Wallet />
            Member Utility Deposit
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      )}
      {isSuperAdmin && (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton onClick={() => go("cottage-deposit")}>
            <HandCoins />
            Cottage Deposit
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      )}
      <SidebarMenuSubItem>
        <SidebarMenuSubButton render={<Link href="/utilities/history" onClick={() => setOpenMobile(false)} />}>
          <History />
          Utility History
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>

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
    </SidebarMenuSub>
  );
}
