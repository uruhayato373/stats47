/**
 * 年度別道路実延長推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { TrendLineChart } from "@/components/molecules/charts";
import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010108"; // 都道府県データ 基礎データ
const CAT01_ROAD_LENGTH = "H7110"; // 道路実延長

interface RoadLengthTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別道路実延長推移チャート（Server Component）
 */
export async function RoadLengthTrendChart({
  areaCode,
  title,
  description,
}: RoadLengthTrendChartProps) {
  try {
    // e-Stat APIから道路実延長データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_ROAD_LENGTH,
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

    // 小数点以下1桁でフォーマット（km単位）
    const formatValue = (value: number): string => {
      return new Intl.NumberFormat("ja-JP", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value);
    };

    return (
      <TrendLineChart
        chartData={chartData}
        chartConfig={chartConfig}
        title={title}
        description={description}
        valueFormatter={formatValue}
      />
    );
  } catch (error) {
    console.error("[RoadLengthTrendChart] データ取得エラー:", error);
    const chartConfig = {
      value: {
        label: title,
        color: "hsl(221, 83%, 53%)", // Blue（青色）
      },
    };
    const formatValue = (value: number): string => {
      return new Intl.NumberFormat("ja-JP", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value);
    };
    return (
      <TrendLineChart
        chartData={[]}
        chartConfig={chartConfig}
        title={title}
        description={description}
        valueFormatter={formatValue}
      />
    );
  }
}

