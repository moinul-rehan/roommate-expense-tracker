import {
  Bell,
  Receipt,
  Wallet,
  ShoppingBasket,
  UtensilsCrossed,
  CalendarClock,
  CalendarX,
  CalendarRange,
  RotateCw,
  RotateCcw,
  Trash2,
  type LucideIcon,
} from "lucide-react";

export const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  utility_adjustment: Receipt,
  utility_adjustment_removed: Trash2,
  utility_expense_credit: Receipt,
  utility_deposit: Wallet,
  bazaar_entry: ShoppingBasket,
  bazaar_duty_assigned: CalendarClock,
  bazaar_duty_removed: CalendarX,
  meal_deposit: Wallet,
  daily_meal: UtensilsCrossed,
  month_created: CalendarRange,
  month_activated: RotateCw,
  utility_month_reset: RotateCcw,
  meal_month_reset: RotateCcw,
};

export function getNotificationIcon(type: string): LucideIcon {
  return NOTIFICATION_ICONS[type] ?? Bell;
}
