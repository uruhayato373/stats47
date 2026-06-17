import { Card, CardHeader } from "@stats47/components/atoms/ui/card";

export const KpiCardSkeleton = () => {
  return (
    <Card>
      <CardHeader className="border-b-0 pb-0">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </CardHeader>
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
    </Card>
  );
};
