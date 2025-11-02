/**
 * 年度別投資的経費（都道府県財政）推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { InvestmentExpensesTrendChartClient } from "./InvestmentExpensesTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010104"; // 都道府県データ 基礎データ
const CAT01_INVESTMENT_EXPENSES = "D2110"; // 投資的経費（都道府県財政）

interface InvestmentExpensesTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別投資的経費（都道府県財政）推移チャート（Server Component）
 */
export async function InvestmentExpensesTrendChart({
  areaCode,
  title,
  description,
}: InvestmentExpensesTrendChartProps) {
  try {
    // e-Stat APIから投資的経費データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_INVESTMENT_EXPENSES,
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
        <InvestmentExpensesTrendChartClient
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
      <InvestmentExpensesTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error(
      "[InvestmentExpensesTrendChart] データ取得エラー:",
      error
    );
    return (
      <InvestmentExpensesTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

