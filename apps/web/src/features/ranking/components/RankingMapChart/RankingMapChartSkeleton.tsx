/**
 * マップチャートのスケルトンコンポーネント
 *
 * Suspenseのfallbackとして使用されるローディング表示
 */

import { Card, CardContent, CardHeader } from "@stats47/components/atoms/ui/card";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

export function RankingMapChartSkeleton() {
  return (
    <div className="w-full h-full">
      <Card className="h-full border border-border shadow-sm rounded-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="p-4">
          <div className="w-full max-w-full flex flex-col gap-2">
            {/* タブ部分のスケルトン */}
            <Skeleton className="h-9 w-full" />
            {/* 地図部分のスケルトン */}
            <Skeleton className="h-[400px] w-full mt-2 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
