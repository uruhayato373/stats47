import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import { SurfaceCard } from "@/components/surface";

export function CorrelationSectionSkeleton() {
  return (
    <SurfaceCard className="p-0">
      <div className="border-b border-border px-4 py-3">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="space-y-3 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
