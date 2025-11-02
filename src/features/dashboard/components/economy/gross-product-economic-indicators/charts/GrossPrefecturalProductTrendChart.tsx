/**
 * 年度別県内総生産額推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { GrossPrefecturalProductTrendChartClient } from "./GrossPrefecturalProductTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010103"; // 都道府県データ 基礎データ
const CAT01_GROSS_PREFECTURAL_PRODUCT = "C1121"; // 県内総生産額（平成27年基準）

interface GrossPrefecturalProductTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別県内総生産額推移チャート（Server Component）
 */
export async function GrossPrefecturalProductTrendChart({
  areaCode,
  title,
  description,
}: GrossPrefecturalProductTrendChartProps) {
  try {
    // e-Stat APIから県内総生産額データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_GROSS_PREFECTURAL_PRODUCT,
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
        <GrossPrefecturalProductTrendChartClient
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
      <GrossPrefecturalProductTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error(
      "[GrossPrefecturalProductTrendChart] データ取得エラー:",
      error
    );
    return (
      <GrossPrefecturalProductTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

