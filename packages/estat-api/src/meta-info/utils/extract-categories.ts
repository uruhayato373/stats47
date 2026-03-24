import { CategoryInfo, EstatMetaInfoResponse } from "../types";

/**
 * 全分類項目を抽出
 *
 * @param metaInfo - e-Stat APIのメタ情報レスポンス
 * @returns 分類項目情報の配列
 */
export function extractCategories(
  metaInfo: EstatMetaInfoResponse
): CategoryInfo[] {
  const classObjInf = metaInfo.GET_META_INFO?.METADATA_INF?.CLASS_INF;
  const classObjs = classObjInf?.CLASS_OBJ;
  
  if (!classObjs) {
    return [];
  }

  const categories: CategoryInfo[] = [];

  for (const classObj of classObjs) {
    const id = classObj["@id"];
    if ((id.startsWith("cat") || id === "tab") && classObj.CLASS) {
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
