/**
 * 年度別住宅構造スタックバーチャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { HousingStructureStackedBarChartClient } from "./HousingStructureStackedBarChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010108"; // 都道府県データ 基礎データ
const CAT01_DETACHED_HOUSES = "H1401"; // 一戸建住宅数
const CAT01_ROW_HOUSES = "H1402"; // 長屋建住宅数
const CAT01_APARTMENT_BUILDINGS = "H1403"; // 共同住宅数

interface HousingStructureStackedBarChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別住宅構造スタックバーチャート（Server Component）
 */
export async function HousingStructureStackedBarChart({
  areaCode,
  title,
  description,
}: HousingStructureStackedBarChartProps) {
  try {
    // e-Stat APIから住宅構造データを取得（全年度）
    const [detachedResponse, rowResponse, apartmentResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_DETACHED_HOUSES,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_ROW_HOUSES,
        areaFilter: areaCode,
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_APARTMENT_BUILDINGS,
        areaFilter: areaCode,
      }),
    ]);

    // データを整形
    const detachedData = formatStatsData(detachedResponse);
    const rowData = formatStatsData(rowResponse);
    const apartmentData = formatStatsData(apartmentResponse);

    // StatsSchema形式に変換
    const detachedSchemas = detachedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const rowSchemas = rowData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const apartmentSchemas = apartmentData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    if (detachedSchemas.length === 0 && rowSchemas.length === 0 && apartmentSchemas.length === 0) {
      return (
        <HousingStructureStackedBarChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // 年度順にソート
    detachedSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    rowSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    apartmentSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 年度の一覧を取得
    const allYears = new Set([
      ...detachedSchemas.map((s) => s.timeCode),
      ...rowSchemas.map((s) => s.timeCode),
      ...apartmentSchemas.map((s) => s.timeCode),
    ]);

    // StatsSchemaをチャート用のデータ形式に変換
    const chartData = Array.from(allYears)
      .sort()
      .map((year) => {
        const detached = detachedSchemas.find((s) => s.timeCode === year);
        const row = rowSchemas.find((s) => s.timeCode === year);
        const apartment = apartmentSchemas.find((s) => s.timeCode === year);

        return {
          year,
          yearName: detached?.timeName || row?.timeName || apartment?.timeName || year,
          detached:
            typeof detached?.value === "number"
              ? detached.value
              : Number(detached?.value) || 0,
          row:
            typeof row?.value === "number" ? row.value : Number(row?.value) || 0,
          apartment:
            typeof apartment?.value === "number"
              ? apartment.value
              : Number(apartment?.value) || 0,
        };
      });

    return (
      <HousingStructureStackedBarChartClient
        chartData={chartData}
        title={title}
        description={description}
      />
    );
  } catch (error) {
    console.error(
      "[HousingStructureStackedBarChart] データ取得エラー:",
      error
    );
    return (
      <HousingStructureStackedBarChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}

