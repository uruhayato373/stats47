/**
 * 最低賃金推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { MinimumWageTrendChartClient } from "./MinimumWageTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010106"; // 労働統計
const CAT01_MINIMUM_WAGE = "F6501"; // 地域別最低賃金

interface MinimumWageTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 最低賃金推移チャート（Server Component）
 */
export async function MinimumWageTrendChart({
  areaCode,
  title,
  description,
}: MinimumWageTrendChartProps) {
  try {
    // e-Stat APIから最低賃金データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_MINIMUM_WAGE,
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
        <MinimumWageTrendChartClient
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
      <MinimumWageTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error("[MinimumWageTrendChart] データ取得エラー:", error);
    return (
      <MinimumWageTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

