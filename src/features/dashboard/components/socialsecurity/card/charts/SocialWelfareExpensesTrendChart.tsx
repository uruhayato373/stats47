/**
 * 年度別社会福祉費推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { SocialWelfareExpensesTrendChartClient } from "./SocialWelfareExpensesTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010104"; // 都道府県データ 基礎データ
const CAT01_SOCIAL_WELFARE_EXPENSES = "D3103031"; // 社会福祉費（都道府県財政）

interface SocialWelfareExpensesTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別社会福祉費推移チャート（Server Component）
 */
export async function SocialWelfareExpensesTrendChart({
  areaCode,
  title,
  description,
}: SocialWelfareExpensesTrendChartProps) {
  try {
    // e-Stat APIから社会福祉費データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_SOCIAL_WELFARE_EXPENSES,
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
        <SocialWelfareExpensesTrendChartClient
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
      <SocialWelfareExpensesTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error(
      "[SocialWelfareExpensesTrendChart] データ取得エラー:",
      error
    );
    return (
      <SocialWelfareExpensesTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

