import { CardGridSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <CardGridSkeleton cards={4} cols="sm:grid-cols-2 lg:grid-cols-4" />
      <CardGridSkeleton cards={3} />
    </div>
  );
}
