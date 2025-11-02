/**
 * 年度別旅館営業施設数推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { RyokanFacilitiesTrendChartClient } from "./RyokanFacilitiesTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010103"; // 都道府県データ 基礎データ
const CAT01_RYOKAN_FACILITIES = "C3801"; // 旅館営業施設数（ホテルを含む）

interface RyokanFacilitiesTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別旅館営業施設数推移チャート（Server Component）
 */
export async function RyokanFacilitiesTrendChart({
  areaCode,
  title,
  description,
}: RyokanFacilitiesTrendChartProps) {
  try {
    // e-Stat APIから旅館営業施設数データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_RYOKAN_FACILITIES,
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
        <RyokanFacilitiesTrendChartClient
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
      <RyokanFacilitiesTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error(
      "[RyokanFacilitiesTrendChart] データ取得エラー:",
      error
    );
    return (
      <RyokanFacilitiesTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

