/**
 * 年度別民間最終消費支出推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { PrivateConsumptionTrendChartClient } from "./PrivateConsumptionTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010103"; // 都道府県データ 基礎データ
const CAT01_PRIVATE_CONSUMPTION_EXPENDITURE = "C1321"; // 民間最終消費支出（名目）（平成27年基準）

interface PrivateConsumptionTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別民間最終消費支出推移チャート（Server Component）
 */
export async function PrivateConsumptionTrendChart({
  areaCode,
  title,
  description,
}: PrivateConsumptionTrendChartProps) {
  try {
    // e-Stat APIから民間最終消費支出データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_PRIVATE_CONSUMPTION_EXPENDITURE,
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
        <PrivateConsumptionTrendChartClient
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
      <PrivateConsumptionTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error(
      "[PrivateConsumptionTrendChart] データ取得エラー:",
      error
    );
    return (
      <PrivateConsumptionTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

