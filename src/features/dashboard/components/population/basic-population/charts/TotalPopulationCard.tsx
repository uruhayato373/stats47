/**
 * 総人口統計カードコンポーネント
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";
import type { StatsSchema } from "@/types/stats";

interface TotalPopulationCardProps {
  /** 総人口データ */
  data: StatsSchema[];
  /** タイトル */
  title?: string;
}

/**
 * 総人口統計カード
 */
export function TotalPopulationCard({
  data,
  title = "総人口",
}: TotalPopulationCardProps) {
  // 最新年度のデータを取得
  const latestData = data.length > 0 ? data[data.length - 1] : null;

  if (!latestData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">データがありません</p>
        </CardContent>
      </Card>
    );
  }

  // 数値をカンマ区切りでフォーマット
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("ja-JP").format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold">
            {formatNumber(latestData.value)}
          </div>
          <p className="text-sm text-muted-foreground">
            {latestData.timeName}（{latestData.unit}）
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

