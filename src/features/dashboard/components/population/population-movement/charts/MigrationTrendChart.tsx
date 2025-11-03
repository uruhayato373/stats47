/**
 * 転入・転出推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { TrendLineChart } from "@/components/molecules/charts";
import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計
const CAT01_MOVERS_IN = "A5103"; // 転入者数
const CAT01_MOVERS_OUT = "A5104"; // 転出者数

interface MigrationTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 転入・転出推移チャート（Server Component）
 */
export async function MigrationTrendChart({
  areaCode,
  title,
  description,
}: MigrationTrendChartProps) {
  try {
    // 転入者数と転出者数を並列取得（全年度）
    const [inResponse, outResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_MOVERS_IN,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_MOVERS_OUT,
        areaFilter: areaCode,
      }),
    ]);

    // データを整形
    const inFormattedData = formatStatsData(inResponse);
    const outFormattedData = formatStatsData(outResponse);

    // StatsSchema形式に変換
    const inSchemas = inFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const outSchemas = outFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    // 年度順にソート
    inSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    outSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 年度ごとにマージ（両方のデータがある年度のみ）
    const timeCodes = new Set([
      ...inSchemas.map((d) => d.timeCode),
      ...outSchemas.map((d) => d.timeCode),
    ]);

    const chartData = Array.from(timeCodes)
      .sort()
      .map((timeCode) => {
        const inData = inSchemas.find((d) => d.timeCode === timeCode);
        const outData = outSchemas.find((d) => d.timeCode === timeCode);
        return {
          year: timeCode,
          yearName: inData?.timeName || outData?.timeName || timeCode,
          inValue:
            typeof inData?.value === "number"
              ? inData.value
              : Number(inData?.value) || 0,
          outValue:
            typeof outData?.value === "number"
              ? outData.value
              : Number(outData?.value) || 0,
          netValue:
            (typeof inData?.value === "number"
              ? inData.value
              : Number(inData?.value) || 0) -
            (typeof outData?.value === "number"
              ? outData.value
              : Number(outData?.value) || 0),
          unit: inData?.unit || outData?.unit || "人",
        };
      })
      .filter((d) => d.inValue > 0 || d.outValue > 0); // データが存在する年度のみ

    const chartConfig = {
      inValue: {
        label: "転入者数",
        color: "hsl(221, 83%, 53%)", // Blue（青色）
      },
      outValue: {
        label: "転出者数",
        color: "hsl(346, 77%, 50%)", // Pink（ピンク色）
      },
      netValue: {
        label: "転入超過数",
        color: "hsl(142, 76%, 36%)", // Green（緑色）
      },
    };

    return (
      <TrendLineChart
        chartData={chartData}
        chartConfig={chartConfig}
        title={title}
        description={description}
        showLegend={true}
      />
    );
  } catch (error) {
    console.error("[MigrationTrendChart] データ取得エラー:", error);
    const chartConfig = {
      inValue: {
        label: "転入者数",
        color: "hsl(221, 83%, 53%)", // Blue（青色）
      },
      outValue: {
        label: "転出者数",
        color: "hsl(346, 77%, 50%)", // Pink（ピンク色）
      },
      netValue: {
        label: "転入超過数",
        color: "hsl(142, 76%, 36%)", // Green（緑色）
      },
    };
    return (
      <TrendLineChart
        chartData={[]}
        chartConfig={chartConfig}
        title={title}
        description={description}
        showLegend={true}
      />
    );
  }
}

