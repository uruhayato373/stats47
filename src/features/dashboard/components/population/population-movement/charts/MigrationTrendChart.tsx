/**
 * 転入・転出推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { MigrationTrendChartClient } from "./MigrationTrendChartClient";

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

    if (inSchemas.length === 0 || outSchemas.length === 0) {
      return (
        <MigrationTrendChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

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

    return (
      <MigrationTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error("[MigrationTrendChart] データ取得エラー:", error);
    return (
      <MigrationTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

