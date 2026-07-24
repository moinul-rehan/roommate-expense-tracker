import { cn } from "@/lib/utils";

type BadgeProfile = {
  role: "super_admin" | "member";
  can_add_expenses?: boolean;
  can_add_bazaar?: boolean;
  can_add_meals?: boolean;
  can_add_deposit?: boolean;
};

/** Whether a member (not the super admin) has been granted any manager-style permission. */
export function hasElevatedAccess(permissions: {
  can_add_expenses?: boolean;
  can_add_bazaar?: boolean;
  can_add_meals?: boolean;
  can_add_deposit?: boolean;
}) {
  return Boolean(
    permissions.can_add_expenses ||
      permissions.can_add_bazaar ||
      permissions.can_add_meals ||
      permissions.can_add_deposit
  );
}

/**
 * Gold = Super admin, Blue = member granted manager permissions, Black = standard member.
 * Accepts either a role string (defaults to standard-member colors) or a full profile.
 */
export function VerifiedBadge({
  role,
  className,
  ...permissions
}: BadgeProfile & { className?: string }) {
  const hasPermission = hasElevatedAccess(permissions);

  const color =
    role === "super_admin"
      ? "text-amber-500"
      : hasPermission
        ? "text-sky-500"
        : "text-foreground";

  const label =
    role === "super_admin"
      ? "Super admin"
      : hasPermission
        ? "Manager"
        : "Standard member";

  return (
    <svg
      viewBox="0 0 24 24"
      aria-label={label}
      className={cn("inline size-4 shrink-0", color, className)}
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M8 12.5l2.5 2.5L16 9"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
