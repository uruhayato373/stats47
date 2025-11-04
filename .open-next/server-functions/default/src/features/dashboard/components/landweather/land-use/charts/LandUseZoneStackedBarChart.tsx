/**
 * 用途地域内訳スタックバーチャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { LandUseZoneStackedBarChartClient } from "./LandUseZoneStackedBarChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010108"; // 住宅・土地統計調査
const CAT01_RESIDENTIAL_ONLY_ZONE = "H810401"; // 住居専用地域面積
const CAT01_RESIDENTIAL_ZONE = "H810402"; // 住居地域面積
const CAT01_NEIGHBORHOOD_COMMERCIAL_ZONE = "H810403"; // 近隣商業地域面積
const CAT01_COMMERCIAL_ZONE = "H810404"; // 商業地域面積
const CAT01_QUASI_INDUSTRIAL_ZONE = "H810405"; // 準工業地域面積
const CAT01_INDUSTRIAL_ZONE = "H810406"; // 工業地域面積
const CAT01_INDUSTRIAL_ONLY_ZONE = "H810407"; // 工業専用地域面積

interface LandUseZoneStackedBarChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 用途地域内訳スタックバーチャート（Server Component）
 */
export async function LandUseZoneStackedBarChart({
  areaCode,
  title,
  description,
}: LandUseZoneStackedBarChartProps) {
  try {
    // 7つの用途地域区分データを並列取得
    const [
      residentialOnlyResponse,
      residentialResponse,
      neighborhoodCommercialResponse,
      commercialResponse,
      quasiIndustrialResponse,
      industrialResponse,
      industrialOnlyResponse,
    ] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_RESIDENTIAL_ONLY_ZONE,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_RESIDENTIAL_ZONE,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_NEIGHBORHOOD_COMMERCIAL_ZONE,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_COMMERCIAL_ZONE,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_QUASI_INDUSTRIAL_ZONE,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_INDUSTRIAL_ZONE,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_INDUSTRIAL_ONLY_ZONE,
        areaFilter: areaCode,
      }),
    ]);

    // データを整形
    const residentialOnlyFormattedData = formatStatsData(residentialOnlyResponse);
    const residentialFormattedData = formatStatsData(residentialResponse);
    const neighborhoodCommercialFormattedData = formatStatsData(neighborhoodCommercialResponse);
    const commercialFormattedData = formatStatsData(commercialResponse);
    const quasiIndustrialFormattedData = formatStatsData(quasiIndustrialResponse);
    const industrialFormattedData = formatStatsData(industrialResponse);
    const industrialOnlyFormattedData = formatStatsData(industrialOnlyResponse);

    // StatsSchema形式に変換
    const residentialOnlySchemas = residentialOnlyFormattedData.values
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

    const neighborhoodCommercialSchemas = neighborhoodCommercialFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const commercialSchemas = commercialFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const quasiIndustrialSchemas = quasiIndustrialFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const industrialSchemas = industrialFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const industrialOnlySchemas = industrialOnlyFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    // 年度順にソート
    residentialOnlySchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    residentialSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    neighborhoodCommercialSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    commercialSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    quasiIndustrialSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    industrialSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    industrialOnlySchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 年度ごとにデータを統合
    const timeCodeMap = new Map<
      string,
      {
        year: string;
        yearName: string;
        residentialOnly: number;
        residential: number;
        neighborhoodCommercial: number;
        commercial: number;
        quasiIndustrial: number;
        industrial: number;
        industrialOnly: number;
      }
    >();

    // 各区分のデータを追加
    const addData = (
      schemas: Array<{ timeCode: string; timeName: string; value: number }>,
      key: "residentialOnly" | "residential" | "neighborhoodCommercial" | "commercial" | "quasiIndustrial" | "industrial" | "industrialOnly"
    ) => {
      for (const schema of schemas) {
        const existing = timeCodeMap.get(schema.timeCode);
        if (existing) {
          existing[key] = schema.value;
        } else {
          timeCodeMap.set(schema.timeCode, {
            year: schema.timeCode,
            yearName: schema.timeName,
            residentialOnly: 0,
            residential: 0,
            neighborhoodCommercial: 0,
            commercial: 0,
            quasiIndustrial: 0,
            industrial: 0,
            industrialOnly: 0,
            [key]: schema.value,
          });
        }
      }
    };

    addData(residentialOnlySchemas, "residentialOnly");
    addData(residentialSchemas, "residential");
    addData(neighborhoodCommercialSchemas, "neighborhoodCommercial");
    addData(commercialSchemas, "commercial");
    addData(quasiIndustrialSchemas, "quasiIndustrial");
    addData(industrialSchemas, "industrial");
    addData(industrialOnlySchemas, "industrialOnly");

    // チャート用のデータ形式に変換
    const chartData = Array.from(timeCodeMap.values())
      .filter(
        (item) =>
          item.residentialOnly > 0 ||
          item.residential > 0 ||
          item.neighborhoodCommercial > 0 ||
          item.commercial > 0 ||
          item.quasiIndustrial > 0 ||
          item.industrial > 0 ||
          item.industrialOnly > 0
      )
      .map((item) => ({
        year: item.year,
        yearName: item.yearName,
        residentialOnly: item.residentialOnly,
        residential: item.residential,
        neighborhoodCommercial: item.neighborhoodCommercial,
        commercial: item.commercial,
        quasiIndustrial: item.quasiIndustrial,
        industrial: item.industrial,
        industrialOnly: item.industrialOnly,
        total:
          item.residentialOnly +
          item.residential +
          item.neighborhoodCommercial +
          item.commercial +
          item.quasiIndustrial +
          item.industrial +
          item.industrialOnly,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));

    return (
      <LandUseZoneStackedBarChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error("[LandUseZoneStackedBarChart] データ取得エラー:", error);
    return (
      <LandUseZoneStackedBarChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

