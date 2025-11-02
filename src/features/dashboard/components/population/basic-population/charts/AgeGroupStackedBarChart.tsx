/**
 * 年齢区分別人口スタックバーチャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { AgeGroupStackedBarChartClient } from "./AgeGroupStackedBarChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計
const CAT01_YOUNG_POPULATION = "A1301"; // 15歳未満人口
const CAT01_PRODUCTION_AGE_POPULATION = "A1302"; // 15～64歳人口
const CAT01_OLD_POPULATION = "A1303"; // 65歳以上人口

interface AgeGroupStackedBarChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年齢区分別人口スタックバーチャート（Server Component）
 */
export async function AgeGroupStackedBarChart({
  areaCode,
  title,
  description,
}: AgeGroupStackedBarChartProps) {
  try {
    // 3つの年齢区分データを並列取得
    const [youngResponse, productionResponse, oldResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_YOUNG_POPULATION,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_PRODUCTION_AGE_POPULATION,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_OLD_POPULATION,
        areaFilter: areaCode,
      }),
    ]);

    // データを整形
    const youngFormattedData = formatStatsData(youngResponse);
    const productionFormattedData = formatStatsData(productionResponse);
    const oldFormattedData = formatStatsData(oldResponse);

    // StatsSchema形式に変換
    const youngSchemas = youngFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const productionSchemas = productionFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const oldSchemas = oldFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    if (
      youngSchemas.length === 0 ||
      productionSchemas.length === 0 ||
      oldSchemas.length === 0
    ) {
      return (
        <AgeGroupStackedBarChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // 年度順にソート
    youngSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    productionSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    oldSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 年度ごとにデータを統合
    const timeCodeMap = new Map<
      string,
      {
        year: string;
        yearName: string;
        young: number;
        production: number;
        old: number;
      }
    >();

    // 15歳未満人口のデータを追加
    for (const schema of youngSchemas) {
      const existing = timeCodeMap.get(schema.timeCode);
      if (existing) {
        existing.young = schema.value;
      } else {
        timeCodeMap.set(schema.timeCode, {
          year: schema.timeCode,
          yearName: schema.timeName,
          young: schema.value,
          production: 0,
          old: 0,
        });
      }
    }

    // 15～64歳人口のデータを追加
    for (const schema of productionSchemas) {
      const existing = timeCodeMap.get(schema.timeCode);
      if (existing) {
        existing.production = schema.value;
      } else {
        timeCodeMap.set(schema.timeCode, {
          year: schema.timeCode,
          yearName: schema.timeName,
          young: 0,
          production: schema.value,
          old: 0,
        });
      }
    }

    // 65歳以上人口のデータを追加
    for (const schema of oldSchemas) {
      const existing = timeCodeMap.get(schema.timeCode);
      if (existing) {
        existing.old = schema.value;
      } else {
        timeCodeMap.set(schema.timeCode, {
          year: schema.timeCode,
          yearName: schema.timeName,
          young: 0,
          production: 0,
          old: schema.value,
        });
      }
    }

    // チャート用のデータ形式に変換
    const chartData = Array.from(timeCodeMap.values())
      .filter((item) => item.young > 0 || item.production > 0 || item.old > 0)
      .map((item) => ({
        year: item.year,
        yearName: item.yearName,
        young: item.young,
        production: item.production,
        old: item.old,
        total: item.young + item.production + item.old,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));

    return (
      <AgeGroupStackedBarChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error("[AgeGroupStackedBarChart] データ取得エラー:", error);
    return (
      <AgeGroupStackedBarChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

