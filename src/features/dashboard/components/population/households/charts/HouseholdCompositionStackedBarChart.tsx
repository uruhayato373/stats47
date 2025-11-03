/**
 * 世帯構成スタックバーチャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { StackedBarChart } from "@/components/molecules/charts";

import { fetchFormattedStatsData } from "@/features/estat-api/stats-data";

// チャート設定
const CHART_TITLE = "世帯構成";
const CHART_DESCRIPTION =
  "単独世帯、核家族世帯、核家族以外の世帯、その他の内訳を表示";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計
const CAT01_GENERAL_HOUSEHOLDS = "A710101"; // 一般世帯数
const CAT01_SINGLE_HOUSEHOLDS = "A810105"; // 単独世帯数
const CAT01_NUCLEAR_FAMILY_HOUSEHOLDS = "A810102"; // 核家族世帯数
const CAT01_NON_NUCLEAR_FAMILY_HOUSEHOLDS = "A810103"; // 核家族以外の世帯数

interface HouseholdCompositionStackedBarChartProps {
  /** 地域コード */
  areaCode: string;
  /** 年度（最新年度を取得する場合は指定しない） */
  timeCode?: string;
}

/**
 * 世帯構成スタックバーチャート（Server Component）
 */
export async function HouseholdCompositionStackedBarChart({
  areaCode,
  timeCode,
}: HouseholdCompositionStackedBarChartProps) {
  try {
    // 各種世帯数を並列取得（fetchFormattedStatsDataで整形と変換まで実行）
    const [generalSchemas, singleSchemas, nuclearSchemas, nonNuclearSchemas] =
      await Promise.all([
        fetchFormattedStatsData(STATS_DATA_ID, {
          categoryFilter: CAT01_GENERAL_HOUSEHOLDS,
          areaFilter: areaCode,
          ...(timeCode && { yearFilter: timeCode }),
        }),
        fetchFormattedStatsData(STATS_DATA_ID, {
          categoryFilter: CAT01_SINGLE_HOUSEHOLDS,
          areaFilter: areaCode,
          ...(timeCode && { yearFilter: timeCode }),
        }),
        fetchFormattedStatsData(STATS_DATA_ID, {
          categoryFilter: CAT01_NUCLEAR_FAMILY_HOUSEHOLDS,
          areaFilter: areaCode,
          ...(timeCode && { yearFilter: timeCode }),
        }),
        fetchFormattedStatsData(STATS_DATA_ID, {
          categoryFilter: CAT01_NON_NUCLEAR_FAMILY_HOUSEHOLDS,
          areaFilter: areaCode,
          ...(timeCode && { yearFilter: timeCode }),
        }),
      ]);

    if (
      generalSchemas.length === 0 ||
      singleSchemas.length === 0 ||
      nuclearSchemas.length === 0 ||
      nonNuclearSchemas.length === 0
    ) {
      return null;
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
    const otherValue =
      generalValue - singleValue - nuclearValue - nonNuclearValue;

    // チャート用のデータ形式に変換
    const chartData = [
      {
        category: "世帯構成",
        単独世帯: singleValue,
        核家族世帯: nuclearValue,
        核家族以外の世帯: nonNuclearValue,
        その他: otherValue > 0 ? otherValue : 0,
      },
    ];

    // チャート設定
    const chartConfig = {
      単独世帯: {
        dataKey: "単独世帯",
        label: "単独世帯",
        color: "hsl(221, 83%, 53%)", // Blue（青色）
      },
      核家族世帯: {
        dataKey: "核家族世帯",
        label: "核家族世帯",
        color: "hsl(142, 76%, 36%)", // Green（緑色）
      },
      核家族以外の世帯: {
        dataKey: "核家族以外の世帯",
        label: "核家族以外の世帯",
        color: "hsl(38, 92%, 50%)", // Orange（オレンジ色）
      },
      その他: {
        dataKey: "その他",
        label: "その他",
        color: "hsl(346, 77%, 50%)", // Pink（ピンク色）
      },
    };

    return (
      <StackedBarChart
        chartData={chartData}
        title={CHART_TITLE}
        description={
          targetTimeName
            ? `${CHART_DESCRIPTION}（${targetTimeName}）`
            : CHART_DESCRIPTION
        }
        chartConfig={chartConfig}
        xAxisDataKey="category"
        height={300}
        showTotal
        totalLabel="合計"
        unit="世帯"
      />
    );
  } catch (error) {
    console.error(
      "[HouseholdCompositionStackedBarChart] データ取得エラー:",
      error
    );
    return null;
  }
}
