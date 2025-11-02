/**
 * 年度別一般行政部門職員数（都道府県）推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { PrefecturalStaffTrendChartClient } from "./PrefecturalStaffTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010104"; // 都道府県データ 基礎データ
const CAT01_PREFECTURAL_STAFF_COUNT = "D1201"; // 一般行政部門職員数（都道府県）

interface PrefecturalStaffTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別一般行政部門職員数（都道府県）推移チャート（Server Component）
 */
export async function PrefecturalStaffTrendChart({
  areaCode,
  title,
  description,
}: PrefecturalStaffTrendChartProps) {
  try {
    // e-Stat APIから一般行政部門職員数データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_PREFECTURAL_STAFF_COUNT,
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
        <PrefecturalStaffTrendChartClient
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
      <PrefecturalStaffTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error(
      "[PrefecturalStaffTrendChart] データ取得エラー:",
      error
    );
    return (
      <PrefecturalStaffTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

