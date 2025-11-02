/**
 * 年度別総面積推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { TotalAreaTrendChartClient } from "./TotalAreaTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010102"; // 国土統計
const CAT01_TOTAL_AREA = "B1101"; // 総面積（北方地域及び竹島を除く）

interface TotalAreaTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別総面積推移チャート（Server Component）
 */
export async function TotalAreaTrendChart({
  areaCode,
  title,
  description,
}: TotalAreaTrendChartProps) {
  try {
    // e-Stat APIから総面積データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_TOTAL_AREA,
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
        <TotalAreaTrendChartClient
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
      <TotalAreaTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error("[TotalAreaTrendChart] データ取得エラー:", error);
    return (
      <TotalAreaTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

