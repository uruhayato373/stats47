/**
 * 年度別人口推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import {
  TrendLineChart,
  type ChartConfig,
  type LineConfig,
  type TooltipConfig,
} from "@/components/molecules/charts";

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計
const CAT01_TOTAL_POPULATION = "A1101"; // 総人口

interface PopulationTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別人口推移チャート（Server Component）
 */
export async function PopulationTrendChart({
  areaCode,
  title,
  description,
}: PopulationTrendChartProps) {
  try {
    // e-Stat APIから総人口データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_TOTAL_POPULATION,
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
      const chartConfig: Record<string, ChartConfig> = {
        value: {
          label: title,
          color: "hsl(221, 83%, 53%)",
        },
      };

      const lines: LineConfig[] = [
        {
          dataKey: "value",
          name: "value",
          color: "hsl(221, 83%, 53%)",
        },
      ];

      return (
        <TrendLineChart
          chartData={[]}
          chartConfig={chartConfig}
          lines={lines}
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

    // チャート設定（サーバー側で定義）
    const chartConfig: Record<string, ChartConfig> = {
      value: {
        label: title,
        color: "hsl(221, 83%, 53%)", // Blue（青色）
      },
    };

    const lines: LineConfig[] = [
      {
        dataKey: "value",
        name: "value",
        color: "hsl(221, 83%, 53%)", // Blue（青色）
      },
    ];

    // Tooltip の設定
    const tooltipConfig: TooltipConfig = {
      dataKeys: ["value"],
      xLabelKey: "yearName",
      unitKey: "unit",
    };

    return (
      <TrendLineChart
        chartData={chartData}
        chartConfig={chartConfig}
        lines={lines}
        title={title}
        description={description}
        tooltipConfig={tooltipConfig}
      />
    );
  } catch (error) {
    console.error("[PopulationTrendChart] データ取得エラー:", error);
    const chartConfig: Record<string, ChartConfig> = {
      value: {
        label: title,
        color: "hsl(221, 83%, 53%)",
      },
    };

    const lines: LineConfig[] = [
      {
        dataKey: "value",
        name: "value",
        color: "hsl(221, 83%, 53%)",
      },
    ];

    return (
      <TrendLineChart
        chartData={[]}
        chartConfig={chartConfig}
        lines={lines}
        title={title}
        description={description}
      />
    );
  }
}
