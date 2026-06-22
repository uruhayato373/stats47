import { SurfaceCard } from "@/components/surface";

export const KpiCardSkeleton = () => {
  return (
    <SurfaceCard className="p-0">
      <div className="px-4 pb-0 pt-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </div>
      <div className="px-4 pb-2">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="animate-pulse">
          <div className="h-5 bg-muted rounded w-1/4" />
        </div>
      </div>
    </SurfaceCard>
  );
};
