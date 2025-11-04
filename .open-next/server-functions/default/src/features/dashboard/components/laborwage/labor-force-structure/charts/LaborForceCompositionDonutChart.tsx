/**
 * 労働力構造ドーナツチャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { LaborForceCompositionDonutChartClient } from "./LaborForceCompositionDonutChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010106"; // 労働統計
const CAT01_LABOR_FORCE_POPULATION = "F1101"; // 労働力人口
const CAT01_NON_LABOR_FORCE_POPULATION = "F1108"; // 非労働力人口

interface LaborForceCompositionDonutChartProps {
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
 * 労働力構造ドーナツチャート（Server Component）
 */
export async function LaborForceCompositionDonutChart({
  areaCode,
  title,
  description,
  timeCode,
}: LaborForceCompositionDonutChartProps) {
  try {
    // 労働力人口と非労働力人口を並列取得
    const [laborForceResponse, nonLaborForceResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_LABOR_FORCE_POPULATION,
        areaFilter: areaCode,
        ...(timeCode && { yearFilter: timeCode }),
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_NON_LABOR_FORCE_POPULATION,
        areaFilter: areaCode,
        ...(timeCode && { yearFilter: timeCode }),
      }),
    ]);

    // データを整形
    const laborForceFormattedData = formatStatsData(laborForceResponse);
    const nonLaborForceFormattedData = formatStatsData(nonLaborForceResponse);

    // StatsSchema形式に変換
    const laborForceSchemas = laborForceFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const nonLaborForceSchemas = nonLaborForceFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    if (laborForceSchemas.length === 0 || nonLaborForceSchemas.length === 0) {
      return (
        <LaborForceCompositionDonutChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // 年度順にソート
    laborForceSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    nonLaborForceSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 指定年度のデータを取得（指定がない場合は最新年度）
    let targetTimeCode = timeCode;
    let targetTimeName = "";

    if (!targetTimeCode) {
      // 最新年度を取得
      const latestLaborForce = laborForceSchemas[laborForceSchemas.length - 1];
      const latestNonLaborForce =
        nonLaborForceSchemas[nonLaborForceSchemas.length - 1];
      if (latestLaborForce && latestNonLaborForce) {
        targetTimeCode = latestLaborForce.timeCode;
        targetTimeName = latestLaborForce.timeName;
      }
    } else {
      // 指定年度の名前を取得
      const laborForceDataItem = laborForceSchemas.find(
        (d) => d.timeCode === targetTimeCode
      );
      if (laborForceDataItem) {
        targetTimeName = laborForceDataItem.timeName;
      }
    }

    // 指定年度のデータを取得
    const laborForceValue =
      laborForceSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const nonLaborForceValue =
      nonLaborForceSchemas.find((d) => d.timeCode === targetTimeCode)
        ?.value || 0;
    const total = laborForceValue + nonLaborForceValue;

    if (total === 0) {
      return (
        <LaborForceCompositionDonutChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // チャート用のデータ形式に変換
    const chartData = [
      {
        name: "労働力人口",
        value: laborForceValue,
        percentage:
          total > 0
            ? ((laborForceValue / total) * 100).toFixed(1)
            : "0.0",
      },
      {
        name: "非労働力人口",
        value: nonLaborForceValue,
        percentage:
          total > 0
            ? ((nonLaborForceValue / total) * 100).toFixed(1)
            : "0.0",
      },
    ];

    return (
      <LaborForceCompositionDonutChartClient
        chartData={chartData}
        title={title}
        description={description}
        timeName={targetTimeName}
        totalValue={total}
        unit="人"
      />
    );
  } catch (error) {
    console.error(
      "[LaborForceCompositionDonutChart] データ取得エラー:",
      error
    );
    return (
      <LaborForceCompositionDonutChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

