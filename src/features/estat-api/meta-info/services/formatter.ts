/**
 * e-STATメタ情報フォーマッター
 * 責務: メタ情報の包括的な抽出・変換（純粋関数）
 *
 * @see GET_META_INFO完全ガイド
 */


import {
  CategoryInfo,
  ClassItem,
  ClassObject,
  EstatMetaInfoResponse,
  ParsedMetaInfo,
  TableInfo,
  TimeAxisInfo,
} from "../types";

/**
 * 統計表の基本情報を抽出
 *
 * @param metaInfo - e-Stat APIのメタ情報レスポンス
 * @returns 統計表の基本情報
 * @throws {Error} メタ情報が不足している場合
 *
 * @example
 * ```typescript
 * const tableInfo = extractTableInfo(metaInfo);
 * console.log(tableInfo.title); // "都道府県，男女別人口"
 * ```
 */
export function extractTableInfo(metaInfo: EstatMetaInfoResponse): TableInfo {
  const metaData = metaInfo.GET_META_INFO?.METADATA_INF;
  if (!metaData?.TABLE_INF) {
    throw new Error("統計表情報が見つかりません");
  }

  const tableInf = metaData.TABLE_INF;

  return {
    id: tableInf["@id"] || "",
    statName: tableInf.STAT_NAME?.$ || "",
    organization: tableInf.GOV_ORG?.$ || "",
    statisticsName: tableInf.STATISTICS_NAME || "",
    title: tableInf.TITLE?.$ || "",
    cycle: tableInf.CYCLE || "",
    surveyDate: tableInf.SURVEY_DATE || "",
    openDate: tableInf.OPEN_DATE || "",
    smallArea: tableInf.SMALL_AREA || "",
    collectArea: tableInf.COLLECT_AREA || "",
    mainCategory: {
      code: tableInf.MAIN_CATEGORY?.["@no"] || "",
      name: tableInf.MAIN_CATEGORY?.$ || "",
    },
    subCategory: tableInf.SUB_CATEGORY
      ? {
          code: tableInf.SUB_CATEGORY["@no"] || "",
          name: tableInf.SUB_CATEGORY.$ || "",
        }
      : undefined,
    totalRecords: parseInt(String(tableInf.OVERALL_TOTAL_NUMBER || "0")),
    updatedDate: tableInf.UPDATED_DATE || "",
    tabulationCategory: tableInf.STATISTICS_NAME_SPEC?.TABULATION_CATEGORY,
  };
}

/**
 * 全分類項目を抽出
 *
 * @param metaInfo - e-Stat APIのメタ情報レスポンス
 * @returns 分類項目情報の配列
 *
 * @see GET_META_INFO完全ガイド 4.3 CLASS_INF
 *
 * @example
 * ```typescript
 * const categories = extractCategories(metaInfo);
 * const genderCategory = categories.find(c => c.id === "cat01");
 * console.log(genderCategory?.items); // [{ code: "001", name: "総数", unit: "人" }, ...]
 * ```
 */
export function extractCategories(
  metaInfo: EstatMetaInfoResponse
): CategoryInfo[] {
  const classObjs = metaInfo.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
  if (!classObjs) {
    return [];
  }

  const categories: CategoryInfo[] = [];

  for (const classObj of classObjs) {
    if (classObj["@id"].startsWith("cat") && classObj.CLASS) {
      categories.push({
        id: classObj["@id"],
        name: classObj["@name"],
        items: Array.isArray(classObj.CLASS)
          ? classObj.CLASS.map((item) => ({
              code: item["@code"],
              name: item["@name"],
              unit: item["@unit"],
              level: item["@level"],
              parentCode: item["@parentCode"],
            }))
          : [
              {
                code: classObj.CLASS["@code"],
                name: classObj.CLASS["@name"],
                unit: classObj.CLASS["@unit"],
                level: classObj.CLASS["@level"],
                parentCode: classObj.CLASS["@parentCode"],
              },
            ],
      });
    }
  }

  return categories;
}

/**
 * 時間軸情報を抽出
 *
 * @param metaInfo - e-Stat APIのメタ情報レスポンス
 * @returns 時間軸情報
 *
 * @see GET_META_INFO完全ガイド 6.4 時間軸情報の取得
 *
 * @example
 * ```typescript
 * const timeAxis = extractTimeAxis(metaInfo);
 * console.log(timeAxis.availableYears); // ["2020000000", "2015000000"]
 * ```
 */
export function extractTimeAxis(metaInfo: EstatMetaInfoResponse): TimeAxisInfo {
  const timeClass = lookupClassObj(metaInfo, "time");
  if (!timeClass) {
    return {
      availableYears: [],
      formattedYears: [],
      minYear: "",
      maxYear: "",
    };
  }

  if (!timeClass.CLASS) {
    return {
      availableYears: [],
      formattedYears: [],
      minYear: "",
      maxYear: "",
    };
  }

  const classItems = Array.isArray(timeClass.CLASS)
    ? timeClass.CLASS.filter((item): item is ClassItem => item !== undefined)
    : [timeClass.CLASS];

  const years = classItems.map((item: ClassItem) => item["@code"]).sort();
  const formattedYears = classItems
    .map((item: ClassItem) => item["@name"])
    .sort();

  return {
    availableYears: years,
    formattedYears: formattedYears,
    minYear: years[0] || "",
    maxYear: years[years.length - 1] || "",
  };
}

/**
 * メタ情報を完全解析
 *
 * @param metaInfo - e-Stat APIのメタ情報レスポンス
 * @returns 完全解析済みメタ情報
 *
 * @see GET_META_INFO完全ガイド 6.5 メタ情報の完全解析
 *
 * @example
 * ```typescript
 * const parsed = parseCompleteMetaInfo(metaInfo);
 * console.log(parsed.tableInfo.title);
 * console.log(parsed.dimensions.categories.length);
 * ```
 */
export function parseCompleteMetaInfo(
  metaInfo: EstatMetaInfoResponse
): ParsedMetaInfo {
  const tableInfo = extractTableInfo(metaInfo);
  const categories = extractCategories(metaInfo);
  const areas = extractAreaHierarchy(metaInfo);
  const timeAxis = extractTimeAxis(metaInfo);

  return {
    tableInfo,
    dimensions: {
      categories,
      areas,
      timeAxis,
    },
  };
}

/**
 * 地域階層情報を抽出
 *
 * @param metaInfo - e-Stat APIのメタ情報レスポンス
 * @returns 地域情報の配列（階層構造を保持）
 *
 * @see GET_META_INFO完全ガイド 4.3 CLASS_INF area
 *
 * @example
 * ```typescript
 * const areas = extractAreaHierarchy(metaInfo);
 * const prefectures = areas.filter(a => a.level === 2);
 * ```
 */
function extractAreaHierarchy(metaInfo: EstatMetaInfoResponse) {
  const areaClass = lookupClassObj(metaInfo, "area");
  if (!areaClass) {
    return [];
  }

  if (!areaClass.CLASS) {
    return [];
  }

  return Array.isArray(areaClass.CLASS)
    ? areaClass.CLASS.filter(
        (item): item is ClassItem => item !== undefined
      ).map((item: ClassItem) => ({
        code: item["@code"],
        name: item["@name"],
        level: parseInt(item["@level"] || "1"),
        parentCode: item["@parentCode"],
        unit: item["@unit"],
      }))
    : [
        {
          code: areaClass.CLASS["@code"],
          name: areaClass.CLASS["@name"],
          level: parseInt(areaClass.CLASS["@level"] || "1"),
          parentCode: areaClass.CLASS["@parentCode"],
          unit: areaClass.CLASS["@unit"],
        },
      ];
}

/**
 * CLASS_OBJを検索するヘルパー関数
 *
 * @param metaInfo - e-Stat APIのメタ情報レスポンス
 * @param id - 検索するCLASS_OBJのID
 * @returns 該当するCLASS_OBJまたはundefined
 */
function lookupClassObj(
  metaInfo: EstatMetaInfoResponse,
  id: string
): ClassObject | undefined {
  const classObjs = metaInfo.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
  return classObjs?.find((obj) => obj["@id"] === id);
}
