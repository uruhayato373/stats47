/**
 * 年度別幼稚園在園者数推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { KindergartenEnrollmentTrendChartClient } from "./KindergartenEnrollmentTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010105"; // 都道府県データ 基礎データ
const CAT01_KINDERGARTEN_ENROLLMENT = "E1501"; // 幼稚園在園者数

interface KindergartenEnrollmentTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別幼稚園在園者数推移チャート（Server Component）
 */
export async function KindergartenEnrollmentTrendChart({
  areaCode,
  title,
  description,
}: KindergartenEnrollmentTrendChartProps) {
  try {
    // e-Stat APIから幼稚園在園者数データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_KINDERGARTEN_ENROLLMENT,
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
        <KindergartenEnrollmentTrendChartClient
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
      <KindergartenEnrollmentTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error(
      "[KindergartenEnrollmentTrendChart] データ取得エラー:",
      error
    );
    return (
      <KindergartenEnrollmentTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

