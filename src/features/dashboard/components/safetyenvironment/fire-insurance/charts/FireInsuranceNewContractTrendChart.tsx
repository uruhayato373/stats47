/**
 * 年度別火災保険新契約件数推移チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { FireInsuranceNewContractTrendChartClient } from "./FireInsuranceNewContractTrendChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010111"; // 都道府県データ 基礎データ
const CAT01_FIRE_INSURANCE_NEW_CONTRACT_COUNT = "K2209"; // 火災保険新契約件数

interface FireInsuranceNewContractTrendChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別火災保険新契約件数推移チャート（Server Component）
 */
export async function FireInsuranceNewContractTrendChart({
  areaCode,
  title,
  description,
}: FireInsuranceNewContractTrendChartProps) {
  try {
    // e-Stat APIから火災保険新契約件数データを取得（全年度）
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_FIRE_INSURANCE_NEW_CONTRACT_COUNT,
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
        <FireInsuranceNewContractTrendChartClient
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
      <FireInsuranceNewContractTrendChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error(
      "[FireInsuranceNewContractTrendChart] データ取得エラー:",
      error
    );
    return (
      <FireInsuranceNewContractTrendChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

