/**
 * 出生・死亡推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { BirthDeathTrendChartClient } from "./BirthDeathTrendChartClient";

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

    if (birthSchemas.length === 0 || deathSchemas.length === 0) {
      return (
        <BirthDeathTrendChartClient
          chartData={[]}
          title={title}
          description={description}
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

    return (
      <BirthDeathTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error("[BirthDeathTrendChart] データ取得エラー:", error);
    return (
      <BirthDeathTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

