import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import { SurfaceCard } from "@/components/surface";

export function RankingPageCardsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[...Array(2)].map((_, i) => (
        <SurfaceCard key={i} className="p-0">
          <div className="border-b border-border px-4 py-3">
            <Skeleton className="h-5 w-1/3" />
          </div>
          <div className="p-4">
            <Skeleton className="h-[250px] w-full rounded" />
          </div>
        </SurfaceCard>
      ))}
    </div>
  );
}
