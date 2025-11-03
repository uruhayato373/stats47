/**
 * 年度別歳出決算総額（都道府県財政）推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { TrendLineChart } from "@/components/molecules/charts";

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010104"; // 都道府県データ 基礎データ
const CAT01_TOTAL_EXPENDITURE = "D3103"; // 歳出決算総額（都道府県財政）

interface TotalExpenditureTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別歳出決算総額（都道府県財政）推移チャート（Server Component）
 */
export async function TotalExpenditureTrendChart({
  areaCode,
  title,
  description,
}: TotalExpenditureTrendChartProps) {
  try {
    // e-Stat APIから歳出決算総額データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_TOTAL_EXPENDITURE,
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
    console.error("[TotalExpenditureTrendChart] データ取得エラー:", error);
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

