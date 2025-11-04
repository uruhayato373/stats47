/**
 * 年度別人口推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { TrendLineChart } from "@/components/molecules/charts";

import { fetchFormattedStatsData } from "@/features/estat-api/stats-data/services/fetcher";

import { CHART_COLORS } from "@/lib/chart-colors";
import { convertStatsSchemasToTrendChartData } from "@/lib/chart-data-converter";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計
const CAT01_TOTAL_POPULATION = "A1101"; // 総人口

// チャートのタイトルと説明
const CHART_TITLE = "総人口推移";
const CHART_DESCRIPTION = "年度別の総人口推移を表示";

// チャートの色設定（shadcn/ui primary 色と同期: hsl(221, 83%, 53%)）
const CHART_COLOR = CHART_COLORS.primary;

interface PopulationTrendChartProps {
  /** 地域コード */
  areaCode: string;
}

/**
 * 年度別人口推移チャート（Server Component）
 */
export async function PopulationTrendChart({
  areaCode,
}: PopulationTrendChartProps) {
  try {
    // e-Stat APIから総人口データを取得して整形（API側でareaCodeでフィルタリング済み）
    const statsSchemas = await fetchFormattedStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_TOTAL_POPULATION,
      areaFilter: areaCode,
    });

    // データがない場合は早期リターン
    if (statsSchemas.length === 0) {
      return null;
    }

    // StatsSchemaをチャート用のデータ形式に変換
    const chartData = convertStatsSchemasToTrendChartData(statsSchemas, {
      includeCategoryName: true,
      color: CHART_COLOR,
    });

    return (
      <TrendLineChart
        chartData={chartData}
        title={CHART_TITLE}
        description={CHART_DESCRIPTION}
      />
    );
  } catch (error) {
    console.error("[PopulationTrendChart] データ取得エラー:", error);
    return null;
  }
}
