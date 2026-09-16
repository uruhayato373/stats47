import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import { SectionCard } from "@/components/surface";

export function CorrelationSectionSkeleton() {
  return (
    <SectionCard title={<Skeleton className="h-5 w-40" />}>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
