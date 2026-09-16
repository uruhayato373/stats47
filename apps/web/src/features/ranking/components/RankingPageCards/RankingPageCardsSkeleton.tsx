import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import { SectionCard } from "@/components/surface";

export function RankingPageCardsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[...Array(2)].map((_, i) => (
        <SectionCard key={i} title={<Skeleton className="h-5 w-1/3" />}>
          <Skeleton className="h-[250px] w-full rounded" />
        </SectionCard>
      ))}
    </div>
  );
}
