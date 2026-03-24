import { AreaInfo, EstatMetaInfoResponse, ParsedMetaInfo, TableInfo, TimeAxisInfo } from "../types";
import { extractCategories } from "./extract-categories";

/**
 * e-Stat メタ情報を ParsedMetaInfo に解析
 */
export function parseCompleteMetaInfo(metaInfo: EstatMetaInfoResponse): ParsedMetaInfo {
  const tableInf = metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF;
  const classInf = metaInfo.GET_META_INFO?.METADATA_INF?.CLASS_INF;

  // 基本情報の解析
  const tableInfo: TableInfo = {
    id: tableInf?.["@id"] || "",
    statName: tableInf?.STAT_NAME?.["$"] || "",
    title: tableInf?.TITLE?.["$"] || "",
    organization: tableInf?.GOV_ORG?.["$"] || "",
    statisticsName: tableInf?.STATISTICS_NAME || "",
    cycle: tableInf?.CYCLE || "",
    surveyDate: tableInf?.SURVEY_DATE || "",
    openDate: tableInf?.OPEN_DATE || "",
    smallArea: tableInf?.SMALL_AREA || "",
    collectArea: tableInf?.COLLECT_AREA || "",
    mainCategory: {
      code: tableInf?.MAIN_CATEGORY?.["@code"] || "",
      name: tableInf?.MAIN_CATEGORY?.["$"] || "",
    },
    subCategory: tableInf?.SUB_CATEGORY ? {
      code: tableInf.SUB_CATEGORY["@code"] || "",
      name: tableInf.SUB_CATEGORY["$"] || "",
    } : undefined,
    totalRecords: Number(tableInf?.OVERALL_TOTAL_NUMBER) || 0,
    updatedDate: tableInf?.UPDATED_DATE || "",
    tabulationCategory: tableInf?.STATISTICS_NAME_SPEC?.TABULATION_CATEGORY || "",
  };

  // カテゴリ（分類）の解析
  const categories = extractCategories(metaInfo);

  // 地域の解析
  const areaObj = classInf?.CLASS_OBJ?.find(obj => obj["@id"] === "area");
  const areas: AreaInfo[] = [];
  if (areaObj && areaObj.CLASS) {
    const classes = Array.isArray(areaObj.CLASS) ? areaObj.CLASS : [areaObj.CLASS];
    for (const item of classes) {
      areas.push({
        code: item["@code"],
        name: item["@name"],
        level: Number(item["@level"]) || 0,
        parentCode: item["@parentCode"],
        unit: item["@unit"],
      });
    }
  }

  // 時間軸の解析
  const timeObj = classInf?.CLASS_OBJ?.find(obj => obj["@id"] === "time");
  const availableYears: string[] = [];
  const formattedYears: string[] = [];
  if (timeObj && timeObj.CLASS) {
    const classes = Array.isArray(timeObj.CLASS) ? timeObj.CLASS : [timeObj.CLASS];
    for (const item of classes) {
      availableYears.push(item["@code"]);
      formattedYears.push(item["@name"]);
    }
  }

  const timeAxis: TimeAxisInfo = {
    availableYears,
    formattedYears,
    minYear: availableYears.length > 0 ? availableYears[0] : "",
    maxYear: availableYears.length > 0 ? availableYears[availableYears.length - 1] : "",
  };

  return {
    tableInfo,
    dimensions: {
      categories,
      areas,
      timeAxis,
    },
  };
}
