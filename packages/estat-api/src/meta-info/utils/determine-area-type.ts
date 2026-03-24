import { AreaType } from "@stats47/area";
import { TableInfo } from "../types";

/**
 * 地域タイプを判定
 */
export function determineAreaType(
  tableInfo: TableInfo
): AreaType {
  const tabulationCategory = (tableInfo.tabulationCategory || "").trim();
  const collectArea = (tableInfo.collectArea || "").trim();
  
  if (tabulationCategory.includes("都道府県") || tabulationCategory.includes("都道府県データ")) {
    return "prefecture";
  } else if (
    tabulationCategory.includes("市区町村") || 
    tabulationCategory.includes("市町村") || 
    tabulationCategory.includes("市区町村データ")
  ) {
    return "city";
  }

  if (collectArea === "全国") {
    return "prefecture";
  }

  return "prefecture";
}
