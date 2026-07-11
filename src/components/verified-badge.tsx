import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeProfile = {
  role: "super_admin" | "member";
  can_add_expenses?: boolean;
  can_add_bazaar?: boolean;
  can_add_meals?: boolean;
};

/**
 * Gold = Admin, Blue = member with any granted permission, Black = standard member.
 * Accepts either a role string (defaults to standard-member colors) or a full profile.
 */
export function VerifiedBadge({
  role,
  className,
  ...permissions
}: BadgeProfile & { className?: string }) {
  const hasPermission =
    permissions.can_add_expenses || permissions.can_add_bazaar || permissions.can_add_meals;

  const color =
    role === "super_admin"
      ? "text-amber-500"
      : hasPermission
        ? "text-sky-500"
        : "text-foreground";

  const label =
    role === "super_admin"
      ? "Admin"
      : hasPermission
        ? "Member with permissions"
        : "Standard member";

  return (
    <BadgeCheck
      aria-label={label}
      className={cn("inline size-4 shrink-0", color, className)}
    />
  );
}
