/**
 * 国立・国定公園面積割合ドーナツチャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  formatStatsData,
  convertToStatsSchema,
} from "@/features/estat-api/stats-data/services/formatter";
import { NationalParkRatioDonutChartClient } from "./NationalParkRatioDonutChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010102"; // 国土統計
const CAT01_NATIONAL_PARK_AREA = "B2104"; // 国立公園面積
const CAT01_QUASI_NATIONAL_PARK_AREA = "B2105"; // 国定公園面積

interface NationalParkRatioDonutChartProps {
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
 * 国立・国定公園面積割合ドーナツチャート（Server Component）
 */
export async function NationalParkRatioDonutChart({
  areaCode,
  title,
  description,
  timeCode,
}: NationalParkRatioDonutChartProps) {
  try {
    // 国立公園と国定公園データを並列取得
    const [nationalResponse, quasiNationalResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_NATIONAL_PARK_AREA,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_QUASI_NATIONAL_PARK_AREA,
        areaFilter: areaCode,
      }),
    ]);

    // データを整形
    const nationalFormattedData = formatStatsData(nationalResponse);
    const quasiNationalFormattedData = formatStatsData(quasiNationalResponse);

    // StatsSchema形式に変換
    const nationalSchemas = nationalFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter((schema): schema is NonNullable<typeof schema> => schema !== undefined);

    const quasiNationalSchemas = quasiNationalFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter((schema): schema is NonNullable<typeof schema> => schema !== undefined);

    if (nationalSchemas.length === 0 || quasiNationalSchemas.length === 0) {
      return (
        <NationalParkRatioDonutChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // 年度順にソート
    nationalSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    quasiNationalSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 指定年度のデータを取得（指定がない場合は最新年度）
    let targetTimeCode = timeCode;
    let targetTimeName = "";

    if (!targetTimeCode) {
      // 最新年度を取得
      const latestNational = nationalSchemas[nationalSchemas.length - 1];
      const latestQuasiNational = quasiNationalSchemas[quasiNationalSchemas.length - 1];
      if (latestNational && latestQuasiNational) {
        targetTimeCode = latestNational.timeCode;
        targetTimeName = latestNational.timeName;
      }
    } else {
      // 指定年度の名前を取得
      const nationalDataItem = nationalSchemas.find((d) => d.timeCode === targetTimeCode);
      if (nationalDataItem) {
        targetTimeName = nationalDataItem.timeName;
      }
    }

    // 指定年度のデータを取得
    const nationalValue = nationalSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const quasiNationalValue = quasiNationalSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const total = nationalValue + quasiNationalValue;

    if (total === 0) {
      return (
        <NationalParkRatioDonutChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // チャート用のデータ形式に変換
    const chartData = [
      {
        name: "国立公園",
        value: nationalValue,
        percentage: total > 0 ? ((nationalValue / total) * 100).toFixed(1) : "0.0",
      },
      {
        name: "国定公園",
        value: quasiNationalValue,
        percentage: total > 0 ? ((quasiNationalValue / total) * 100).toFixed(1) : "0.0",
      },
    ];

    return (
      <NationalParkRatioDonutChartClient
        chartData={chartData}
        title={title}
        description={description}
        timeName={targetTimeName}
        totalValue={total}
        unit="ｈａ"
      />
    );
  } catch (error) {
    console.error("[NationalParkRatioDonutChart] データ取得エラー:", error);
    return (
      <NationalParkRatioDonutChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

