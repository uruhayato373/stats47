/**
 * 年度別救急出動件数推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { EmergencyDispatchTrendChartClient } from "./EmergencyDispatchTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010111"; // 都道府県データ 基礎データ
const CAT01_EMERGENCY_DISPATCH_COUNT = "K1210"; // 救急出動件数

interface EmergencyDispatchTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別救急出動件数推移チャート（Server Component）
 */
export async function EmergencyDispatchTrendChart({
  areaCode,
  title,
  description,
}: EmergencyDispatchTrendChartProps) {
  try {
    // e-Stat APIから救急出動件数データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_EMERGENCY_DISPATCH_COUNT,
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
        <EmergencyDispatchTrendChartClient
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
      <EmergencyDispatchTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error(
      "[EmergencyDispatchTrendChart] データ取得エラー:",
      error
    );
    return (
      <EmergencyDispatchTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

