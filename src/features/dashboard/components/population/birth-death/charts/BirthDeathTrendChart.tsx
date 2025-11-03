/**
 * 出生・死亡推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { TrendLineChart } from "@/components/molecules/charts";

import { fetchFormattedStatsData } from "@/features/estat-api/stats-data/services/fetcher";

import { SEMANTIC_CHART_COLORS } from "@/lib/chart-colors";
import { convertMultipleStatsSchemasToTrendChartData } from "@/lib/chart-data-converter";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計
const CAT01_BIRTH_COUNT = "A4101"; // 出生数
const CAT01_DEATH_COUNT = "A4200"; // 死亡数

// チャートのタイトルと説明
const CHART_TITLE = "出生・死亡推移";
const CHART_DESCRIPTION = "年度別の出生数と死亡数の推移を表示";

// チャートの色設定
const BIRTH_COLOR = SEMANTIC_CHART_COLORS.birth; // Blue（青色）- shadcn/ui primary 色と同期
const DEATH_COLOR = SEMANTIC_CHART_COLORS.death; // Pink（ピンク色）

interface BirthDeathTrendChartProps {
  /** 地域コード */
  areaCode: string;
}

/**
 * 出生・死亡推移チャート（Server Component）
 */
export async function BirthDeathTrendChart({
  areaCode,
}: BirthDeathTrendChartProps) {
  try {
    // 出生数と死亡数を並列取得して整形（API側でareaCodeでフィルタリング済み）
    const [birthSchemas, deathSchemas] = await Promise.all([
      fetchFormattedStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_BIRTH_COUNT,
        areaFilter: areaCode,
      }),
      fetchFormattedStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_DEATH_COUNT,
        areaFilter: areaCode,
      }),
    ]);

    // データがない場合は早期リターン
    if (birthSchemas.length === 0 || deathSchemas.length === 0) {
      return null;
    }

    // 複数の StatsSchema[] をチャート用データ形式に変換
    const chartData = convertMultipleStatsSchemasToTrendChartData(
      [
        {
          statsSchemas: birthSchemas,
          dataKey: "birthValue",
          categoryName: "出生数",
          color: BIRTH_COLOR,
        },
        {
          statsSchemas: deathSchemas,
          dataKey: "deathValue",
          categoryName: "死亡数",
          color: DEATH_COLOR,
        },
      ],
      {
        includeCategoryName: true,
        includeColor: true,
      }
    ).filter(
      (d) => (d.birthValue as number) > 0 || (d.deathValue as number) > 0
    ); // データが存在する年度のみ

    return (
      <TrendLineChart
        chartData={chartData}
        title={CHART_TITLE}
        description={CHART_DESCRIPTION}
        showLegend={true}
      />
    );
  } catch (error) {
    console.error("[BirthDeathTrendChart] データ取得エラー:", error);
    return null;
  }
}
