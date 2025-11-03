/**
 * 年度別外国人人口推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { TrendLineChart } from "@/components/molecules/charts";
import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 都道府県データ 基礎データ
const CAT01_FOREIGN_POPULATION_COUNT = "A1700"; // 外国人人口

interface ForeignPopulationTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別外国人人口推移チャート（Server Component）
 */
export async function ForeignPopulationTrendChart({
  areaCode,
  title,
  description,
}: ForeignPopulationTrendChartProps) {
  try {
    // e-Stat APIから外国人人口データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_FOREIGN_POPULATION_COUNT,
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

    const chartConfig = {
      value: {
        label: title,
        color: "hsl(221, 83%, 53%)", // Blue（青色）
      },
    };

    return (
      <TrendLineChart
        chartData={chartData}
        chartConfig={chartConfig}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error("[ForeignPopulationTrendChart] データ取得エラー:", error);
    const chartConfig = {
      value: {
        label: title,
        color: "hsl(221, 83%, 53%)", // Blue（青色）
      },
    };
    return (
      <TrendLineChart
        chartData={[]}
        chartConfig={chartConfig}
        title={title}
        description={description}
      />
    );
  }
}

