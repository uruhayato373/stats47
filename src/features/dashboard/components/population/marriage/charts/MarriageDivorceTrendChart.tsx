/**
 * 婚姻・離婚推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { TrendLineChart } from "@/components/molecules/charts";

import { fetchFormattedStatsData } from "@/features/estat-api/stats-data/services/fetcher";

import { convertMultipleStatsSchemasToTrendChartData } from "@/lib/chart-data-converter";
import { SEMANTIC_CHART_COLORS } from "@/lib/chart-colors";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計
const CAT01_MARRIAGE_COUNT = "A9101"; // 婚姻件数
const CAT01_DIVORCE_COUNT = "A9201"; // 離婚件数

// チャートの色設定
const MARRIAGE_COLOR = "hsl(221, 83%, 53%)"; // Blue（青色）
const DIVORCE_COLOR = "hsl(346, 77%, 50%)"; // Pink（ピンク色）

interface MarriageDivorceTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 婚姻・離婚推移チャート（Server Component）
 */
export async function MarriageDivorceTrendChart({
  areaCode,
  title,
  description,
}: MarriageDivorceTrendChartProps) {
  try {
    // 婚姻件数と離婚件数を並列取得して整形（API側でareaCodeでフィルタリング済み）
    const [marriageSchemas, divorceSchemas] = await Promise.all([
      fetchFormattedStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_MARRIAGE_COUNT,
        areaFilter: areaCode,
      }),
      fetchFormattedStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_DIVORCE_COUNT,
        areaFilter: areaCode,
      }),
    ]);

    // データがない場合は早期リターン
    if (marriageSchemas.length === 0 || divorceSchemas.length === 0) {
      return null;
    }

    // 複数の StatsSchema[] をチャート用データ形式に変換
    const chartData = convertMultipleStatsSchemasToTrendChartData(
      [
        {
          statsSchemas: marriageSchemas,
          dataKey: "marriageValue",
          categoryName: "婚姻件数",
          color: MARRIAGE_COLOR,
        },
        {
          statsSchemas: divorceSchemas,
          dataKey: "divorceValue",
          categoryName: "離婚件数",
          color: DIVORCE_COLOR,
        },
      ],
      {
        includeCategoryName: true,
        includeColor: true,
      }
    ).filter(
      (d) =>
        (d.marriageValue as number) > 0 || (d.divorceValue as number) > 0
    ); // データが存在する年度のみ

    return (
      <TrendLineChart
        chartData={chartData}
        title={title}
        description={description}
        showLegend={true}
      />
    );
  } catch (error) {
    console.error("[MarriageDivorceTrendChart] データ取得エラー:", error);
    return null;
  }
}

