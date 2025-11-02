/**
 * 世帯構成スタックバーチャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { HouseholdCompositionStackedBarChartClient } from "./HouseholdCompositionStackedBarChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計
const CAT01_GENERAL_HOUSEHOLDS = "A710101"; // 一般世帯数
const CAT01_SINGLE_HOUSEHOLDS = "A810105"; // 単独世帯数
const CAT01_NUCLEAR_FAMILY_HOUSEHOLDS = "A810102"; // 核家族世帯数
const CAT01_NON_NUCLEAR_FAMILY_HOUSEHOLDS = "A810103"; // 核家族以外の世帯数

interface HouseholdCompositionStackedBarChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** 年度（最新年度を取得する場合は指定しない） */
  timeCode?: string;
}

/**
 * 世帯構成スタックバーチャート（Server Component）
 */
export async function HouseholdCompositionStackedBarChart({
  areaCode,
  title,
  description,
  timeCode,
}: HouseholdCompositionStackedBarChartProps) {
  try {
    // 各種世帯数を並列取得
    const [
      generalResponse,
      singleResponse,
      nuclearResponse,
      nonNuclearResponse,
    ] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_GENERAL_HOUSEHOLDS,
        areaFilter: areaCode,
        ...(timeCode && { yearFilter: timeCode }),
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_SINGLE_HOUSEHOLDS,
        areaFilter: areaCode,
        ...(timeCode && { yearFilter: timeCode }),
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_NUCLEAR_FAMILY_HOUSEHOLDS,
        areaFilter: areaCode,
        ...(timeCode && { yearFilter: timeCode }),
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_NON_NUCLEAR_FAMILY_HOUSEHOLDS,
        areaFilter: areaCode,
        ...(timeCode && { yearFilter: timeCode }),
      }),
    ]);

    // データを整形
    const generalFormattedData = formatStatsData(generalResponse);
    const singleFormattedData = formatStatsData(singleResponse);
    const nuclearFormattedData = formatStatsData(nuclearResponse);
    const nonNuclearFormattedData = formatStatsData(nonNuclearResponse);

    // StatsSchema形式に変換
    const generalSchemas = generalFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const singleSchemas = singleFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const nuclearSchemas = nuclearFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const nonNuclearSchemas = nonNuclearFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    if (
      generalSchemas.length === 0 ||
      singleSchemas.length === 0 ||
      nuclearSchemas.length === 0 ||
      nonNuclearSchemas.length === 0
    ) {
      return (
        <HouseholdCompositionStackedBarChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // 年度順にソート
    generalSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    singleSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    nuclearSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    nonNuclearSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 指定年度のデータを取得（指定がない場合は最新年度）
    let targetTimeCode = timeCode;
    let targetTimeName = "";

    if (!targetTimeCode) {
      // 最新年度を取得
      const latestGeneral = generalSchemas[generalSchemas.length - 1];
      if (latestGeneral) {
        targetTimeCode = latestGeneral.timeCode;
        targetTimeName = latestGeneral.timeName;
      }
    } else {
      // 指定年度の名前を取得
      const generalDataItem = generalSchemas.find(
        (d) => d.timeCode === targetTimeCode
      );
      if (generalDataItem) {
        targetTimeName = generalDataItem.timeName;
      }
    }

    // 指定年度のデータを取得
    const generalValue =
      generalSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const singleValue =
      singleSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const nuclearValue =
      nuclearSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const nonNuclearValue =
      nonNuclearSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;

    // その他の世帯数（一般世帯数 - 単独世帯数 - 核家族世帯数 - 核家族以外の世帯数）
    const otherValue = generalValue - singleValue - nuclearValue - nonNuclearValue;

    // チャート用のデータ形式に変換
    const chartData = [
      {
        category: "世帯構成",
        "単独世帯": singleValue,
        "核家族世帯": nuclearValue,
        "核家族以外の世帯": nonNuclearValue,
        "その他": otherValue > 0 ? otherValue : 0,
      },
    ];

    return (
      <HouseholdCompositionStackedBarChartClient
        chartData={chartData}
        title={title}
        description={description}
        timeName={targetTimeName}
        unit="世帯"
      />
    );
  } catch (error) {
    console.error(
      "[HouseholdCompositionStackedBarChart] データ取得エラー:",
      error
    );
    return (
      <HouseholdCompositionStackedBarChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

