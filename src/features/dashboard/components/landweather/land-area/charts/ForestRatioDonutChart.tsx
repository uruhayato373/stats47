/**
 * 林野・森林面積割合ドーナツチャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  formatStatsData,
  convertToStatsSchema,
} from "@/features/estat-api/stats-data/services/formatter";

import { ForestRatioDonutChartClient } from "./ForestRatioDonutChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010102"; // 国土統計
const CAT01_FOREST_AREA = "B1105"; // 林野面積
const CAT01_WOODLAND_AREA = "B1106"; // 森林面積

interface ForestRatioDonutChartProps {
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
 * 林野・森林面積割合ドーナツチャート（Server Component）
 */
export async function ForestRatioDonutChart({
  areaCode,
  title,
  description,
  timeCode,
}: ForestRatioDonutChartProps) {
  try {
    // 林野面積と森林面積データを並列取得
    const [forestResponse, woodlandResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_FOREST_AREA,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_WOODLAND_AREA,
        areaFilter: areaCode,
      }),
    ]);

    // データを整形
    const forestFormattedData = formatStatsData(forestResponse);
    const woodlandFormattedData = formatStatsData(woodlandResponse);

    // StatsSchema形式に変換
    const forestSchemas = forestFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const woodlandSchemas = woodlandFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    if (forestSchemas.length === 0 || woodlandSchemas.length === 0) {
      return (
        <ForestRatioDonutChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // 年度順にソート
    forestSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    woodlandSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 指定年度のデータを取得（指定がない場合は最新年度）
    let targetTimeCode = timeCode;
    let targetTimeName = "";

    if (!targetTimeCode) {
      // 最新年度を取得
      const latestForest = forestSchemas[forestSchemas.length - 1];
      const latestWoodland = woodlandSchemas[woodlandSchemas.length - 1];
      if (latestForest && latestWoodland) {
        targetTimeCode = latestForest.timeCode;
        targetTimeName = latestForest.timeName;
      }
    } else {
      // 指定年度の名前を取得
      const forestDataItem = forestSchemas.find(
        (d) => d.timeCode === targetTimeCode
      );
      if (forestDataItem) {
        targetTimeName = forestDataItem.timeName;
      }
    }

    // 指定年度のデータを取得
    const forestValue =
      forestSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const woodlandValue =
      woodlandSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const total = forestValue + woodlandValue;

    if (total === 0) {
      return (
        <ForestRatioDonutChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // チャート用のデータ形式に変換
    // 林野面積 = 森林面積 + その他の林野面積
    // その他の林野面積 = 林野面積 - 森林面積
    const otherForestArea = Math.max(0, forestValue - woodlandValue);

    const chartData = [
      {
        name: "森林面積",
        value: woodlandValue,
        percentage: ((woodlandValue / forestValue) * 100).toFixed(1),
      },
      {
        name: "その他の林野面積",
        value: otherForestArea,
        percentage:
          otherForestArea > 0
            ? ((otherForestArea / forestValue) * 100).toFixed(1)
            : "0.0",
      },
    ];

    return (
      <ForestRatioDonutChartClient
        chartData={chartData}
        title={title}
        description={description}
        timeName={targetTimeName}
        totalValue={forestValue}
        unit="ｈａ"
      />
    );
  } catch (error) {
    console.error("[ForestRatioDonutChart] データ取得エラー:", error);
    return (
      <ForestRatioDonutChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}
