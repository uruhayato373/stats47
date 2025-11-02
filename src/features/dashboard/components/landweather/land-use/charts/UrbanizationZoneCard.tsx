/**
 * 市街化区域面積統計カードコンポーネント
 * e-Stat APIから直接データを取得
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  formatStatsData,
  convertToStatsSchema,
} from "@/features/estat-api/stats-data/services/formatter";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010108"; // 住宅・土地統計調査
const CAT01_URBANIZATION_ZONE = "H8103"; // 市街化区域面積

interface UrbanizationZoneCardProps {
  /** 地域コード */
  areaCode: string;
  /** 年度（最新年度を取得する場合は指定しない） */
  timeCode?: string;
  /** タイトル */
  title?: string;
}

/**
 * 市街化区域面積統計カード
 */
export async function UrbanizationZoneCard({
  areaCode,
  timeCode,
  title = "市街化区域面積",
}: UrbanizationZoneCardProps) {
  try {
    // e-Stat APIから市街化区域面積データを取得
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_URBANIZATION_ZONE,
      areaFilter: areaCode,
      ...(timeCode && { yearFilter: timeCode }),
    });

    // データを整形
    const formattedData = formatStatsData(response);

    // StatsSchema形式に変換
    const statsSchemas = formattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    if (statsSchemas.length === 0) {
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

    // 年度順にソート
    statsSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 最新年度のデータを取得（timeCodeが指定されている場合はその年度）
    const targetData = timeCode
      ? statsSchemas.find((d) => d.timeCode === timeCode)
      : statsSchemas[statsSchemas.length - 1];

    if (!targetData) {
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
      return new Intl.NumberFormat("ja-JP", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              {formatNumber(targetData.value)}
            </div>
            <p className="text-sm text-muted-foreground">
              {targetData.timeName}（{targetData.unit}）
            </p>
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error("[UrbanizationZoneCard] データ取得エラー:", error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            データの取得に失敗しました。
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );
  }
}

