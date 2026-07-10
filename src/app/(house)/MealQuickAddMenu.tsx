"use client";

import { useState } from "react";
import { Plus, Wallet, ShoppingBasket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar";
import { BazaarForm } from "./meal/BazaarForm";
import { DailyMealForm } from "./meal/DailyMealForm";
import { DepositForm } from "./meal/DepositForm";

type Member = { id: string; first_name: string; last_name: string | null };

export function MealQuickAddMenu({
  members,
  canAddBazaar,
  canAddMeals,
  canAddDeposit,
}: {
  members: Member[];
  canAddBazaar: boolean;
  canAddMeals: boolean;
  canAddDeposit: boolean;
}) {
  const [open, setOpen] = useState<"meal" | "deposit" | "bazaar" | null>(null);

  return (
    <SidebarMenuSub>
      {canAddMeals && (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton onClick={() => setOpen("meal")}>
            <Plus />
            Add Meal
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      )}
      {canAddDeposit && (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton onClick={() => setOpen("deposit")}>
            <Wallet />
            Add Meal Deposit
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      )}
      {canAddBazaar && (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton onClick={() => setOpen("bazaar")}>
            <ShoppingBasket />
            Add Meal Cost
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      )}

      <Dialog open={open === "meal"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meal</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <DailyMealForm members={members} hideCard onSuccess={() => setOpen(null)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "deposit"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meal Deposit</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <DepositForm members={members} hideCard onSuccess={() => setOpen(null)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "bazaar"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meal Cost</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <BazaarForm members={members} hideCard onSuccess={() => setOpen(null)} />
          </div>
        </DialogContent>
      </Dialog>
    </SidebarMenuSub>
  );
}
