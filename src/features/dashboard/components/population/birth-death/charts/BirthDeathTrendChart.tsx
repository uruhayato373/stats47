/**
 * 出生・死亡推移チャートコンポーネント（Server Component）
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
const CAT01_BIRTH_COUNT = "A4101"; // 出生数
const CAT01_DEATH_COUNT = "A4200"; // 死亡数

interface BirthDeathTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 出生・死亡推移チャート（Server Component）
 */
export async function BirthDeathTrendChart({
  areaCode,
  title,
  description,
}: BirthDeathTrendChartProps) {
  try {
    // 出生数と死亡数を並列取得（全年度）
    const [birthResponse, deathResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_BIRTH_COUNT,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_DEATH_COUNT,
        areaFilter: areaCode,
      }),
    ]);

    // データを整形
    const birthFormattedData = formatStatsData(birthResponse);
    const deathFormattedData = formatStatsData(deathResponse);

    // StatsSchema形式に変換
    const birthSchemas = birthFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const deathSchemas = deathFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    // チャート設定（サーバー側で定義）
    const chartConfig: Record<string, ChartConfig> = {
      birthValue: {
        label: "出生数",
        color: "hsl(221, 83%, 53%)", // Blue（青色）
      },
      deathValue: {
        label: "死亡数",
        color: "hsl(346, 77%, 50%)", // Pink（ピンク色）
      },
    };

    const lines: LineConfig[] = [
      {
        dataKey: "birthValue",
        name: "birthValue",
        color: "hsl(221, 83%, 53%)", // Blue
      },
      {
        dataKey: "deathValue",
        name: "deathValue",
        color: "hsl(346, 77%, 50%)", // Pink
      },
    ];

    if (birthSchemas.length === 0 || deathSchemas.length === 0) {
      return (
        <TrendLineChart
          chartData={[]}
          chartConfig={chartConfig}
          lines={lines}
          title={title}
          description={description}
          showLegend={true}
        />
      );
    }

    // 年度順にソート
    birthSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    deathSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 年度ごとにマージ（両方のデータがある年度のみ）
    const timeCodes = new Set([
      ...birthSchemas.map((d) => d.timeCode),
      ...deathSchemas.map((d) => d.timeCode),
    ]);

    const chartData = Array.from(timeCodes)
      .sort()
      .map((timeCode) => {
        const birthData = birthSchemas.find((d) => d.timeCode === timeCode);
        const deathData = deathSchemas.find((d) => d.timeCode === timeCode);
        return {
          year: timeCode,
          yearName: birthData?.timeName || deathData?.timeName || timeCode,
          birthValue:
            typeof birthData?.value === "number"
              ? birthData.value
              : Number(birthData?.value) || 0,
          deathValue:
            typeof deathData?.value === "number"
              ? deathData.value
              : Number(deathData?.value) || 0,
          unit: birthData?.unit || deathData?.unit || "人",
        };
      })
      .filter((d) => d.birthValue > 0 || d.deathValue > 0); // データが存在する年度のみ

    // Tooltip の設定
    const tooltipConfig: TooltipConfig = {
      dataKeys: ["birthValue", "deathValue"],
      labels: {
        birthValue: "出生数",
        deathValue: "死亡数",
      },
      colors: {
        birthValue: "hsl(221, 83%, 53%)", // Blue
        deathValue: "hsl(346, 77%, 50%)", // Pink
      },
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
        showLegend={true}
        tooltipConfig={tooltipConfig}
      />
    );
  } catch (error) {
    console.error("[BirthDeathTrendChart] データ取得エラー:", error);
    const chartConfig: Record<string, ChartConfig> = {
      birthValue: {
        label: "出生数",
        color: "hsl(221, 83%, 53%)",
      },
      deathValue: {
        label: "死亡数",
        color: "hsl(346, 77%, 50%)",
      },
    };

    const lines: LineConfig[] = [
      {
        dataKey: "birthValue",
        name: "birthValue",
        color: "hsl(221, 83%, 53%)",
      },
      {
        dataKey: "deathValue",
        name: "deathValue",
        color: "hsl(346, 77%, 50%)",
      },
    ];

    return (
      <TrendLineChart
        chartData={[]}
        chartConfig={chartConfig}
        lines={lines}
        title={title}
        description={description}
        showLegend={true}
      />
    );
  }
}
