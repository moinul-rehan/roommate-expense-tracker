"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Wallet, ShoppingBasket, CalendarDays } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { BazaarForm } from "./meal/BazaarForm";
import { DailyMealForm } from "./meal/DailyMealForm";
import { DepositForm } from "./meal/DepositForm";
import { cn } from "@/lib/utils";

type Member = { id: string; first_name: string; last_name: string | null };

export function MealQuickAddMenu({
  members,
  defaultDate,
  canAddBazaar,
  canAddMeals,
  canAddDeposit,
}: {
  members: Member[];
  defaultDate: string;
  canAddBazaar: boolean;
  canAddMeals: boolean;
  canAddDeposit: boolean;
}) {
  const [open, setOpen] = useState<"meal" | "deposit" | "bazaar" | null>(null);
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  function openDialog(dialog: "meal" | "deposit" | "bazaar") {
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
          render={<Link href="/meal/month-details" onClick={() => setOpenMobile(false)} />}
          tooltip="Month Details"
          isActive={isActive("/meal/month-details")}
          className={itemClass("/meal/month-details")}
        >
          <CalendarDays />
          Month Details
        </SidebarMenuButton>
      </SidebarMenuItem>
      {canAddMeals && (
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => openDialog("meal")} tooltip="Add Meal" className={itemClass()}>
            <Plus />
            Add Meal
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      {canAddDeposit && (
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => openDialog("deposit")} tooltip="Add Meal Deposit" className={itemClass()}>
            <Wallet />
            Add Meal Deposit
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      {canAddBazaar && (
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => openDialog("bazaar")} tooltip="Add Meal Cost" className={itemClass()}>
            <ShoppingBasket />
            Add Meal Cost
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      <Dialog open={open === "meal"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meal</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <DailyMealForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setOpen(null)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "deposit"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meal Deposit</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <DepositForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setOpen(null)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "bazaar"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meal Cost</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <BazaarForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setOpen(null)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
