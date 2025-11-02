/**
 * 評価総地積内訳スタックバーチャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { AssessedLandAreaStackedBarChartClient } from "./AssessedLandAreaStackedBarChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010102"; // 国土統計
const CAT01_TOTAL_ASSESSED_LAND = "B1201"; // 評価総地積（課税対象土地）
const CAT01_ASSESSED_LAND_PADDY = "B120101"; // 評価総地積（田）
const CAT01_ASSESSED_LAND_FIELD = "B120102"; // 評価総地積（畑）
const CAT01_ASSESSED_LAND_RESIDENTIAL = "B120103"; // 評価総地積（宅地）
const CAT01_ASSESSED_LAND_MOUNTAIN_FOREST = "B120104"; // 評価総地積（山林）
const CAT01_ASSESSED_LAND_PASTURE = "B120105"; // 評価総地積（牧場）
const CAT01_ASSESSED_LAND_WILDERNESS = "B120106"; // 評価総地積（原野）
const CAT01_ASSESSED_LAND_OTHER = "B120107"; // 評価総地積（その他）

interface AssessedLandAreaStackedBarChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 評価総地積内訳スタックバーチャート（Server Component）
 */
export async function AssessedLandAreaStackedBarChart({
  areaCode,
  title,
  description,
}: AssessedLandAreaStackedBarChartProps) {
  try {
    // 7つの評価総地積区分データを並列取得
    const [
      paddyResponse,
      fieldResponse,
      residentialResponse,
      mountainForestResponse,
      pastureResponse,
      wildernessResponse,
      otherResponse,
    ] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_ASSESSED_LAND_PADDY,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_ASSESSED_LAND_FIELD,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_ASSESSED_LAND_RESIDENTIAL,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_ASSESSED_LAND_MOUNTAIN_FOREST,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_ASSESSED_LAND_PASTURE,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_ASSESSED_LAND_WILDERNESS,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_ASSESSED_LAND_OTHER,
        areaFilter: areaCode,
      }),
    ]);

    // データを整形
    const paddyFormattedData = formatStatsData(paddyResponse);
    const fieldFormattedData = formatStatsData(fieldResponse);
    const residentialFormattedData = formatStatsData(residentialResponse);
    const mountainForestFormattedData = formatStatsData(mountainForestResponse);
    const pastureFormattedData = formatStatsData(pastureResponse);
    const wildernessFormattedData = formatStatsData(wildernessResponse);
    const otherFormattedData = formatStatsData(otherResponse);

    // StatsSchema形式に変換
    const paddySchemas = paddyFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const fieldSchemas = fieldFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const residentialSchemas = residentialFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const mountainForestSchemas = mountainForestFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const pastureSchemas = pastureFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const wildernessSchemas = wildernessFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const otherSchemas = otherFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    // 年度順にソート
    paddySchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    fieldSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    residentialSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    mountainForestSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    pastureSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    wildernessSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    otherSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 年度ごとにデータを統合
    const timeCodeMap = new Map<
      string,
      {
        year: string;
        yearName: string;
        paddy: number;
        field: number;
        residential: number;
        mountainForest: number;
        pasture: number;
        wilderness: number;
        other: number;
      }
    >();

    // 各区分のデータを追加
    const addData = (
      schemas: Array<{ timeCode: string; timeName: string; value: number }>,
      key:
        | "paddy"
        | "field"
        | "residential"
        | "mountainForest"
        | "pasture"
        | "wilderness"
        | "other"
    ) => {
      for (const schema of schemas) {
        const existing = timeCodeMap.get(schema.timeCode);
        if (existing) {
          existing[key] = schema.value;
        } else {
          timeCodeMap.set(schema.timeCode, {
            year: schema.timeCode,
            yearName: schema.timeName,
            paddy: 0,
            field: 0,
            residential: 0,
            mountainForest: 0,
            pasture: 0,
            wilderness: 0,
            other: 0,
            [key]: schema.value,
          });
        }
      }
    };

    addData(paddySchemas, "paddy");
    addData(fieldSchemas, "field");
    addData(residentialSchemas, "residential");
    addData(mountainForestSchemas, "mountainForest");
    addData(pastureSchemas, "pasture");
    addData(wildernessSchemas, "wilderness");
    addData(otherSchemas, "other");

    // チャート用のデータ形式に変換
    const chartData = Array.from(timeCodeMap.values())
      .filter(
        (item) =>
          item.paddy > 0 ||
          item.field > 0 ||
          item.residential > 0 ||
          item.mountainForest > 0 ||
          item.pasture > 0 ||
          item.wilderness > 0 ||
          item.other > 0
      )
      .map((item) => ({
        year: item.year,
        yearName: item.yearName,
        paddy: item.paddy,
        field: item.field,
        residential: item.residential,
        mountainForest: item.mountainForest,
        pasture: item.pasture,
        wilderness: item.wilderness,
        other: item.other,
        total:
          item.paddy +
          item.field +
          item.residential +
          item.mountainForest +
          item.pasture +
          item.wilderness +
          item.other,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));

    return (
      <AssessedLandAreaStackedBarChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error("[AssessedLandAreaStackedBarChart] データ取得エラー:", error);
    return (
      <AssessedLandAreaStackedBarChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}
