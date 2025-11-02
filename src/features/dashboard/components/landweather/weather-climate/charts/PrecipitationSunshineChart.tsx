/**
 * 年度別降水量・日照時間推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { PrecipitationSunshineChartClient } from "./PrecipitationSunshineChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010102"; // 国土統計
const CAT01_ANNUAL_PRECIPITATION = "B4109"; // 降水量（年間）
const CAT01_ANNUAL_SUNSHINE_DURATION = "B4108"; // 日照時間（年間）

interface PrecipitationSunshineChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別降水量・日照時間推移チャート（Server Component）
 */
export async function PrecipitationSunshineChart({
  areaCode,
  title,
  description,
}: PrecipitationSunshineChartProps) {
  try {
    // 降水量と日照時間データを並列取得
    const [precipitationResponse, sunshineResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_ANNUAL_PRECIPITATION,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_ANNUAL_SUNSHINE_DURATION,
        areaFilter: areaCode,
      }),
    ]);

    // データを整形
    const precipitationFormattedData = formatStatsData(precipitationResponse);
    const sunshineFormattedData = formatStatsData(sunshineResponse);

    // StatsSchema形式に変換
    const precipitationSchemas = precipitationFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const sunshineSchemas = sunshineFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    // 年度順にソート
    precipitationSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    sunshineSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 年度ごとにデータを統合
    const timeCodeMap = new Map<
      string,
      {
        year: string;
        yearName: string;
        precipitation: number;
        sunshine: number;
      }
    >();

    // 降水量データを追加
    for (const schema of precipitationSchemas) {
      const existing = timeCodeMap.get(schema.timeCode);
      if (existing) {
        existing.precipitation = schema.value;
      } else {
        timeCodeMap.set(schema.timeCode, {
          year: schema.timeCode,
          yearName: schema.timeName,
          precipitation: schema.value,
          sunshine: 0,
        });
      }
    }

    // 日照時間データを追加
    for (const schema of sunshineSchemas) {
      const existing = timeCodeMap.get(schema.timeCode);
      if (existing) {
        existing.sunshine = schema.value;
      } else {
        timeCodeMap.set(schema.timeCode, {
          year: schema.timeCode,
          yearName: schema.timeName,
          precipitation: 0,
          sunshine: schema.value,
        });
      }
    }

    // チャート用のデータ形式に変換
    const chartData = Array.from(timeCodeMap.values())
      .filter((item) => item.precipitation > 0 || item.sunshine > 0)
      .map((item) => ({
        year: item.year,
        yearName: item.yearName,
        precipitation: item.precipitation,
        sunshine: item.sunshine,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));

    return (
      <PrecipitationSunshineChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error("[PrecipitationSunshineChart] データ取得エラー:", error);
    return (
      <PrecipitationSunshineChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

