/**
 * 年度別都市計画区域面積推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { UrbanPlanningTrendChartClient } from "./UrbanPlanningTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010108"; // 住宅・土地統計調査
const CAT01_URBAN_PLANNING_AREA = "H8101"; // 都市計画区域指定面積

interface UrbanPlanningTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別都市計画区域面積推移チャート（Server Component）
 */
export async function UrbanPlanningTrendChart({
  areaCode,
  title,
  description,
}: UrbanPlanningTrendChartProps) {
  try {
    // e-Stat APIから都市計画区域指定面積データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_URBAN_PLANNING_AREA,
      areaFilter: areaCode,
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
        <UrbanPlanningTrendChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // 年度順にソート
    statsSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // StatsSchemaをチャート用のデータ形式に変換
    const chartData = statsSchemas.map((item) => ({
      year: item.timeCode,
      yearName: item.timeName,
      value:
        typeof item.value === "number" ? item.value : Number(item.value) || 0,
      unit: item.unit,
    }));

    return (
      <UrbanPlanningTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error("[UrbanPlanningTrendChart] データ取得エラー:", error);
    return (
      <UrbanPlanningTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

