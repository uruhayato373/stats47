/**
 * 総人口男女別割合ドーナツチャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  formatStatsData,
  convertToStatsSchema,
} from "@/features/estat-api/stats-data/services/formatter";
import { GenderRatioDonutChartClient } from "./GenderRatioDonutChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計
const CAT01_TOTAL_POPULATION_MALE = "A110101"; // 総人口（男）
const CAT01_TOTAL_POPULATION_FEMALE = "A110102"; // 総人口（女）

interface GenderRatioDonutChartProps {
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
 * 総人口男女別割合ドーナツチャート（Server Component）
 */
export async function GenderRatioDonutChart({
  areaCode,
  title,
  description,
  timeCode,
}: GenderRatioDonutChartProps) {
  try {
    // 男女別データを並列取得
    const [maleResponse, femaleResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_TOTAL_POPULATION_MALE,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_TOTAL_POPULATION_FEMALE,
        areaFilter: areaCode,
      }),
    ]);

    // データを整形
    const maleFormattedData = formatStatsData(maleResponse);
    const femaleFormattedData = formatStatsData(femaleResponse);

    // StatsSchema形式に変換
    const maleSchemas = maleFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter((schema): schema is NonNullable<typeof schema> => schema !== undefined);

    const femaleSchemas = femaleFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter((schema): schema is NonNullable<typeof schema> => schema !== undefined);

    if (maleSchemas.length === 0 || femaleSchemas.length === 0) {
      return (
        <GenderRatioDonutChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // 年度順にソート
    maleSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    femaleSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 指定年度のデータを取得（指定がない場合は最新年度）
    let targetTimeCode = timeCode;
    let targetTimeName = "";

    if (!targetTimeCode) {
      // 最新年度を取得
      const latestMale = maleSchemas[maleSchemas.length - 1];
      const latestFemale = femaleSchemas[femaleSchemas.length - 1];
      if (latestMale && latestFemale) {
        targetTimeCode = latestMale.timeCode;
        targetTimeName = latestMale.timeName;
      }
    } else {
      // 指定年度の名前を取得
      const maleDataItem = maleSchemas.find((d) => d.timeCode === targetTimeCode);
      if (maleDataItem) {
        targetTimeName = maleDataItem.timeName;
      }
    }

    // 指定年度のデータを取得
    const maleValue = maleSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const femaleValue = femaleSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const total = maleValue + femaleValue;

    if (total === 0) {
      return (
        <GenderRatioDonutChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // チャート用のデータ形式に変換
    const chartData = [
      {
        name: "男性",
        value: maleValue,
        percentage: ((maleValue / total) * 100).toFixed(1),
      },
      {
        name: "女性",
        value: femaleValue,
        percentage: ((femaleValue / total) * 100).toFixed(1),
      },
    ];

    return (
      <GenderRatioDonutChartClient
        chartData={chartData}
        title={title}
        description={description}
        timeName={targetTimeName}
      />
    );
  } catch (error) {
    console.error("[GenderRatioDonutChart] データ取得エラー:", error);
    return (
      <GenderRatioDonutChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

