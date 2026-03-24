import { Card, CardContent, CardHeader } from "@stats47/components/atoms/ui/card";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

export function RankingPageCardsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
