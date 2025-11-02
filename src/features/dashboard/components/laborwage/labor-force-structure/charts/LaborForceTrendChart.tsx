/**
 * 労働力人口・就業者数推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { LaborForceTrendChartClient } from "./LaborForceTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010106"; // 労働統計
const CAT01_LABOR_FORCE_POPULATION = "F1101"; // 労働力人口
const CAT01_EMPLOYED_COUNT = "F1102"; // 就業者数

interface LaborForceTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 労働力人口・就業者数推移チャート（Server Component）
 */
export async function LaborForceTrendChart({
  areaCode,
  title,
  description,
}: LaborForceTrendChartProps) {
  try {
    // 労働力人口と就業者数を並列取得（全年度）
    const [laborForceResponse, employedResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_LABOR_FORCE_POPULATION,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_EMPLOYED_COUNT,
        areaFilter: areaCode,
      }),
    ]);

    // データを整形
    const laborForceFormattedData = formatStatsData(laborForceResponse);
    const employedFormattedData = formatStatsData(employedResponse);

    // StatsSchema形式に変換
    const laborForceSchemas = laborForceFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const employedSchemas = employedFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    if (laborForceSchemas.length === 0 || employedSchemas.length === 0) {
      return (
        <LaborForceTrendChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // 年度順にソート
    laborForceSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    employedSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 年度ごとにマージ（両方のデータがある年度のみ）
    const timeCodes = new Set([
      ...laborForceSchemas.map((d) => d.timeCode),
      ...employedSchemas.map((d) => d.timeCode),
    ]);

    const chartData = Array.from(timeCodes)
      .sort()
      .map((timeCode) => {
        const laborForceData = laborForceSchemas.find(
          (d) => d.timeCode === timeCode
        );
        const employedData = employedSchemas.find(
          (d) => d.timeCode === timeCode
        );
        return {
          year: timeCode,
          yearName: laborForceData?.timeName || employedData?.timeName || timeCode,
          laborForceValue:
            typeof laborForceData?.value === "number"
              ? laborForceData.value
              : Number(laborForceData?.value) || 0,
          employedValue:
            typeof employedData?.value === "number"
              ? employedData.value
              : Number(employedData?.value) || 0,
          unit: laborForceData?.unit || employedData?.unit || "人",
        };
      })
      .filter(
        (d) => d.laborForceValue > 0 || d.employedValue > 0
      ); // データが存在する年度のみ

    return (
      <LaborForceTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error("[LaborForceTrendChart] データ取得エラー:", error);
    return (
      <LaborForceTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

