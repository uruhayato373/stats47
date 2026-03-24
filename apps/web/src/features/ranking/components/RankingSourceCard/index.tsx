import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { Database, ExternalLink } from "lucide-react";

/**
 * 地図データの出典情報（固定値）
 */
const MAP_DATA_SOURCE = {
  url: "https://geoshape.ex.nii.ac.jp/city/",
  name: "『歴史的行政区域データセットβ版』（CODH作成）",
} as const;

interface RankingSourceCardProps {
  /** ランキング項目の出典情報 */
  source: {
    name: string;
    url: string;
  };
}

/**
 * ランキング出典・データソースカードコンポーネント
 *
 * ランキングデータの出典情報（データ提供元と地図データ）を表示します。
 * - データ提供元: ランキングデータの提供元（e-Stat、SSDSE等）
 * - 地図データ: 地図表示に使用する行政区域データの提供元（固定値）
 *
 * @example
 * ```tsx
 * {rankingItem?.source && (
 *   <RankingSourceCard source={rankingItem.source} />
 * )}
 * ```
 */
export function RankingSourceCard({
  source,
}: RankingSourceCardProps) {
  return (
    <Card className="w-full mt-8 border border-border shadow-sm rounded-sm bg-card">
      <CardHeader>
        <Database className="h-4 w-4 text-muted-foreground" />
        <CardTitle>出典・データソース</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* データ提供元 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
          <span className="text-muted-foreground min-w-fit">データ提供元:</span>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-medium text-primary hover:underline break-all"
          >
            {source.name}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* 地図データ */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm mt-3 pt-3 border-t border-border">
          <span className="text-muted-foreground min-w-fit">地図データ:</span>
          <a
            href={MAP_DATA_SOURCE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-medium text-primary hover:underline break-all"
          >
            {MAP_DATA_SOURCE.name}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
