import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({
  role,
  className,
}: {
  role: "super_admin" | "member";
  className?: string;
}) {
  return (
    <BadgeCheck
      aria-label={role === "super_admin" ? "Cottage admin" : "Cottage member"}
      className={cn(
        "inline size-4 shrink-0",
        role === "super_admin" ? "text-sky-500" : "text-foreground",
        className
      )}
    />
  );
}
