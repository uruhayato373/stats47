/**
 * 年度別生活保護被保護実世帯数推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { PublicAssistanceHouseholdsTrendChartClient } from "./PublicAssistanceHouseholdsTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010110"; // 都道府県データ 基礎データ
const CAT01_PUBLIC_ASSISTANCE_HOUSEHOLDS = "J1101"; // 生活保護被保護実世帯数

interface PublicAssistanceHouseholdsTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別生活保護被保護実世帯数推移チャート（Server Component）
 */
export async function PublicAssistanceHouseholdsTrendChart({
  areaCode,
  title,
  description,
}: PublicAssistanceHouseholdsTrendChartProps) {
  try {
    // e-Stat APIから生活保護被保護実世帯数データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_PUBLIC_ASSISTANCE_HOUSEHOLDS,
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
      return (
        <PublicAssistanceHouseholdsTrendChartClient
          chartData={[]}
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

    return (
      <PublicAssistanceHouseholdsTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error(
      "[PublicAssistanceHouseholdsTrendChart] データ取得エラー:",
      error
    );
    return (
      <PublicAssistanceHouseholdsTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

