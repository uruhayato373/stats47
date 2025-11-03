/**
 * 年度別気温推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { TrendLineChart } from "@/components/molecules/charts";
import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010102"; // 国土統計
const CAT01_AVERAGE_TEMPERATURE = "B4101"; // 年平均気温
const CAT01_MAXIMUM_TEMPERATURE = "B4102"; // 最高気温（日最高気温の月平均の最高値）
const CAT01_MINIMUM_TEMPERATURE = "B4103"; // 最低気温（日最低気温の月平均の最低値）

interface TemperatureTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別気温推移チャート（Server Component）
 */
export async function TemperatureTrendChart({
  areaCode,
  title,
  description,
}: TemperatureTrendChartProps) {
  try {
    // 3つの気温データを並列取得
    const [averageResponse, maximumResponse, minimumResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_AVERAGE_TEMPERATURE,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_MAXIMUM_TEMPERATURE,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_MINIMUM_TEMPERATURE,
        areaFilter: areaCode,
      }),
    ]);

    // データを整形
    const averageFormattedData = formatStatsData(averageResponse);
    const maximumFormattedData = formatStatsData(maximumResponse);
    const minimumFormattedData = formatStatsData(minimumResponse);

    // StatsSchema形式に変換
    const averageSchemas = averageFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const maximumSchemas = maximumFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const minimumSchemas = minimumFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    // 年度順にソート
    averageSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    maximumSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    minimumSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 年度ごとにデータを統合
    const timeCodeMap = new Map<
      string,
      {
        year: string;
        yearName: string;
        average: number;
        maximum: number;
        minimum: number;
      }
    >();

    // 各気温データを追加
    const addData = (
      schemas: Array<{ timeCode: string; timeName: string; value: number }>,
      key: "average" | "maximum" | "minimum"
    ) => {
      for (const schema of schemas) {
        const existing = timeCodeMap.get(schema.timeCode);
        if (existing) {
          existing[key] = schema.value;
        } else {
          timeCodeMap.set(schema.timeCode, {
            year: schema.timeCode,
            yearName: schema.timeName,
            average: 0,
            maximum: 0,
            minimum: 0,
            [key]: schema.value,
          });
        }
      }
    };

    addData(averageSchemas, "average");
    addData(maximumSchemas, "maximum");
    addData(minimumSchemas, "minimum");

    // チャート用のデータ形式に変換
    const chartData = Array.from(timeCodeMap.values())
      .filter(
        (item) => item.average > 0 || item.maximum > 0 || item.minimum > 0
      )
      .map((item) => ({
        year: item.year,
        yearName: item.yearName,
        average: item.average,
        maximum: item.maximum,
        minimum: item.minimum,
        unit: "°C",
      }))
      .sort((a, b) => a.year.localeCompare(b.year));

    const chartConfig = {
      average: {
        label: "年平均気温",
        color: "hsl(221, 83%, 53%)", // Blue（青色）
      },
      maximum: {
        label: "最高気温",
        color: "hsl(0, 84%, 60%)", // Red（赤色）
      },
      minimum: {
        label: "最低気温",
        color: "hsl(221, 83%, 60%)", // Light Blue（ライトブルー）
      },
    };

    // 小数点以下1桁でフォーマット
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
        showLegend={true}
        valueFormatter={formatValue}
      />
    );
  } catch (error) {
    console.error("[TemperatureTrendChart] データ取得エラー:", error);
    const chartConfig = {
      average: {
        label: "年平均気温",
        color: "hsl(221, 83%, 53%)", // Blue（青色）
      },
      maximum: {
        label: "最高気温",
        color: "hsl(0, 84%, 60%)", // Red（赤色）
      },
      minimum: {
        label: "最低気温",
        color: "hsl(221, 83%, 60%)", // Light Blue（ライトブルー）
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
        showLegend={true}
        valueFormatter={formatValue}
      />
    );
  }
}

