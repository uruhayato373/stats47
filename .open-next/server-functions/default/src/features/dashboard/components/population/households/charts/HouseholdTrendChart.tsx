/**
 * 世帯数推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { TrendLineChart } from "@/components/molecules/charts";

import { fetchFormattedStatsData } from "@/features/estat-api/stats-data";
import { convertStatsSchemasToTrendChartData } from "@/lib/chart-data-converter";

// チャート設定
const CHART_TITLE = "世帯数推移";
const CHART_DESCRIPTION = "年度別の世帯数推移を表示";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計
const CAT01_HOUSEHOLD_COUNT = "A7101"; // 世帯数

interface HouseholdTrendChartProps {
  /** 地域コード */
  areaCode: string;
}

/**
 * 世帯数推移チャート（Server Component）
 */
export async function HouseholdTrendChart({
  areaCode,
}: HouseholdTrendChartProps) {
  try {
    // e-Stat APIから世帯数データを取得（fetchFormattedStatsDataで整形と変換まで実行）
    const statsSchemas = await fetchFormattedStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_HOUSEHOLD_COUNT,
      areaFilter: areaCode,
    });

    if (statsSchemas.length === 0) {
      return null;
    }

    // StatsSchemaをチャート用のデータ形式に変換
    const chartData = convertStatsSchemasToTrendChartData(statsSchemas, {
      color: "hsl(221, 83%, 53%)", // Blue（青色）
    });

    // チャート設定
    const chartConfig = {
      value: {
        label: CHART_TITLE,
        color: "hsl(221, 83%, 53%)", // Blue（青色）
      },
    };

    return (
      <TrendLineChart
        chartData={chartData}
        chartConfig={chartConfig}
        title={CHART_TITLE}
        description={CHART_DESCRIPTION}
      />
    );
  } catch (error) {
    console.error("[HouseholdTrendChart] データ取得エラー:", error);
    return null;
  }
}

