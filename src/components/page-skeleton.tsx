import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function CardGridSkeleton({
  cards = 6,
  cols = "sm:grid-cols-2 lg:grid-cols-3",
}: {
  cards?: number;
  cols?: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48 rounded-full" />
        <Skeleton className="h-4 w-72 rounded-full" />
      </div>
      <div className={`grid grid-cols-1 gap-4 ${cols}`}>
        {Array.from({ length: cards }).map((_, i) => (
          <Card key={i} className="rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <Skeleton className="size-[54px] shrink-0 rounded-2xl" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-2/3 rounded-full" />
                <Skeleton className="h-5 w-1/2 rounded-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48 rounded-full" />
        <Skeleton className="h-4 w-72 rounded-full" />
      </div>
      <Card className="flex max-w-lg flex-col gap-4 rounded-2xl p-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="mt-2 h-9 w-28 rounded-full" />
      </Card>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48 rounded-full" />
        <Skeleton className="h-4 w-72 rounded-full" />
      </div>
      <Card className="gap-0 rounded-2xl p-0">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-1/3 rounded-full" />
            <Skeleton className="ml-auto h-4 w-20 rounded-full" />
          </div>
        ))}
      </Card>
    </div>
  );
}
