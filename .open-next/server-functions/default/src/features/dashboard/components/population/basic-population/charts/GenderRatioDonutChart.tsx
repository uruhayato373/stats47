/**
 * 総人口男女別割合ドーナツチャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { DonutChart } from "@/components/molecules/charts";

import { fetchFormattedStatsData } from "@/features/estat-api/stats-data";

// チャート設定
const CHART_TITLE = "総人口男女別割合";
const CHART_DESCRIPTION = "総人口の男女別割合を表示";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計
const CAT01_TOTAL_POPULATION_MALE = "A110101"; // 総人口（男）
const CAT01_TOTAL_POPULATION_FEMALE = "A110102"; // 総人口（女）

interface GenderRatioDonutChartProps {
  /** 地域コード */
  areaCode: string;
  /** 年度（最新年度を取得する場合は指定しない） */
  timeCode?: string;
}

/**
 * 総人口男女別割合ドーナツチャート（Server Component）
 */
export async function GenderRatioDonutChart({
  areaCode,
  timeCode,
}: GenderRatioDonutChartProps) {
  try {
    // 男女別データを並列取得（fetchFormattedStatsDataで整形と変換まで実行）
    const [maleSchemas, femaleSchemas] = await Promise.all([
      fetchFormattedStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_TOTAL_POPULATION_MALE,
        areaFilter: areaCode,
      }),
      fetchFormattedStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_TOTAL_POPULATION_FEMALE,
        areaFilter: areaCode,
      }),
    ]);

    if (maleSchemas.length === 0 || femaleSchemas.length === 0) {
      return null;
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
      const maleDataItem = maleSchemas.find(
        (d) => d.timeCode === targetTimeCode
      );
      if (maleDataItem) {
        targetTimeName = maleDataItem.timeName;
      }
    }

    // 指定年度のデータを取得
    const maleValue =
      maleSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const femaleValue =
      femaleSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const total = maleValue + femaleValue;

    if (total === 0) {
      return null;
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

    // チャート設定
    const chartConfig = {
      male: {
        label: "男性",
        color: "hsl(221, 83%, 53%)", // Blue（青色）
      },
      female: {
        label: "女性",
        color: "hsl(346, 77%, 50%)", // Pink（ピンク色）
      },
    };

    const colors = [
      "hsl(221, 83%, 53%)", // 男性（青）
      "hsl(346, 77%, 50%)", // 女性（ピンク）
    ];

    return (
      <DonutChart
        chartData={chartData}
        title={CHART_TITLE}
        description={CHART_DESCRIPTION}
        extraInfo={targetTimeName}
        chartConfig={chartConfig}
        colors={colors}
        unit="人"
      />
    );
  } catch (error) {
    console.error("[GenderRatioDonutChart] データ取得エラー:", error);
    return null;
  }
}
