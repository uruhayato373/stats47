/**
 * 固定資産税（都道府県税）統計カードコンポーネント
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
const STATS_DATA_ID = "0000010104"; // 都道府県データ 基礎データ
const CAT01_FIXED_ASSET_TAX = "D420201"; // 固定資産税（都道府県税）

interface FixedAssetTaxCardProps {
  /** 地域コード */
  areaCode: string;
  /** 年度（最新年度を取得する場合は指定しない） */
  timeCode?: string;
  /** タイトル */
  title?: string;
}

/**
 * 固定資産税（都道府県税）統計カード
 */
export async function FixedAssetTaxCard({
  areaCode,
  timeCode,
  title = "固定資産税（都道府県税）",
}: FixedAssetTaxCardProps) {
  try {
    // e-Stat APIから固定資産税データを取得
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_FIXED_ASSET_TAX,
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

    // 数値をカンマ区切りでフォーマット（千円単位）
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
    console.error("[FixedAssetTaxCard] データ取得エラー:", error);
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

