/**
 * 年度別歳入決算総額（都道府県財政）推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { TotalRevenueTrendChartClient } from "./TotalRevenueTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010104"; // 都道府県データ 基礎データ
const CAT01_TOTAL_REVENUE = "D3101"; // 歳入決算総額（都道府県財政）

interface TotalRevenueTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別歳入決算総額（都道府県財政）推移チャート（Server Component）
 */
export async function TotalRevenueTrendChart({
  areaCode,
  title,
  description,
}: TotalRevenueTrendChartProps) {
  try {
    // e-Stat APIから歳入決算総額データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_TOTAL_REVENUE,
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
        <TotalRevenueTrendChartClient
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
      <TotalRevenueTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error("[TotalRevenueTrendChart] データ取得エラー:", error);
    return (
      <TotalRevenueTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

