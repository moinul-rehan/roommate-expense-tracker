import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Cottage"
      width={size}
      height={size}
      className={cn("rounded-[22%]", className)}
      priority
    />
  );
}
