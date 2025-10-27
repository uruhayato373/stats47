/**
 * e-Stat レスポンス解析（純粋関数）
 * 責務: e-Stat APIのレスポンス構造から実際のデータ部分を抽出
 */

/**
 * レスポンスからRESULT情報を抽出
 * e-Stat APIのレスポンス構造から実際のデータ部分を取得
 *
 * @param data - e-Stat APIのレスポンスデータ
 * @returns 抽出されたRESULT情報
 */
export function extractResult(data: unknown): unknown {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;

    if (obj.GET_STATS_DATA && typeof obj.GET_STATS_DATA === "object") {
      const statsData = obj.GET_STATS_DATA as Record<string, unknown>;
      return statsData.RESULT;
    }
    if (obj.GET_META_INFO && typeof obj.GET_META_INFO === "object") {
      const metaInfo = obj.GET_META_INFO as Record<string, unknown>;
      return metaInfo.RESULT;
    }
    if (obj.GET_STATS_LIST && typeof obj.GET_STATS_LIST === "object") {
      const statsList = obj.GET_STATS_LIST as Record<string, unknown>;
      return statsList.RESULT;
    }
    if (obj.GET_DATA_CATALOG && typeof obj.GET_DATA_CATALOG === "object") {
      const dataCatalog = obj.GET_DATA_CATALOG as Record<string, unknown>;
      return dataCatalog.RESULT;
    }
  }
  return null;
}
