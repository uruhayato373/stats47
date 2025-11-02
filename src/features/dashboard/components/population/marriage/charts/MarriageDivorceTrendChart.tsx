/**
 * 婚姻・離婚推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { MarriageDivorceTrendChartClient } from "./MarriageDivorceTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計
const CAT01_MARRIAGE_COUNT = "A9101"; // 婚姻件数
const CAT01_DIVORCE_COUNT = "A9201"; // 離婚件数

interface MarriageDivorceTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 婚姻・離婚推移チャート（Server Component）
 */
export async function MarriageDivorceTrendChart({
  areaCode,
  title,
  description,
}: MarriageDivorceTrendChartProps) {
  try {
    // 婚姻件数と離婚件数を並列取得（全年度）
    const [marriageResponse, divorceResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_MARRIAGE_COUNT,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_DIVORCE_COUNT,
        areaFilter: areaCode,
      }),
    ]);

    // データを整形
    const marriageFormattedData = formatStatsData(marriageResponse);
    const divorceFormattedData = formatStatsData(divorceResponse);

    // StatsSchema形式に変換
    const marriageSchemas = marriageFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const divorceSchemas = divorceFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    if (marriageSchemas.length === 0 || divorceSchemas.length === 0) {
      return (
        <MarriageDivorceTrendChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // 年度順にソート
    marriageSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    divorceSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 年度ごとにマージ（両方のデータがある年度のみ）
    const timeCodes = new Set([
      ...marriageSchemas.map((d) => d.timeCode),
      ...divorceSchemas.map((d) => d.timeCode),
    ]);

    const chartData = Array.from(timeCodes)
      .sort()
      .map((timeCode) => {
        const marriageData = marriageSchemas.find(
          (d) => d.timeCode === timeCode
        );
        const divorceData = divorceSchemas.find(
          (d) => d.timeCode === timeCode
        );
        return {
          year: timeCode,
          yearName: marriageData?.timeName || divorceData?.timeName || timeCode,
          marriageValue:
            typeof marriageData?.value === "number"
              ? marriageData.value
              : Number(marriageData?.value) || 0,
          divorceValue:
            typeof divorceData?.value === "number"
              ? divorceData.value
              : Number(divorceData?.value) || 0,
          unit: marriageData?.unit || divorceData?.unit || "組",
        };
      })
      .filter((d) => d.marriageValue > 0 || d.divorceValue > 0); // データが存在する年度のみ

    return (
      <MarriageDivorceTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error("[MarriageDivorceTrendChart] データ取得エラー:", error);
    return (
      <MarriageDivorceTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

