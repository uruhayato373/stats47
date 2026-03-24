import { logger } from "@stats47/logger";

/**
 * e-Stat APIレスポンスを検証
 */
export function validateResponse(data: unknown): void {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.GET_META_INFO && typeof obj.GET_META_INFO === "object") {
      const metaInfo = obj.GET_META_INFO as Record<string, unknown>;
      const result = metaInfo.RESULT;
      if (result && typeof result === "object" && result !== null) {
        const resultObj = result as Record<string, unknown>;
        if (typeof resultObj.STATUS === "number") {
          if (resultObj.STATUS === 1) {
            logger.warn({ status: resultObj.STATUS }, "e-STAT API警告");
          } else if (resultObj.STATUS >= 100) {
            throw new Error(`e-STAT APIエラー (STATUS=${resultObj.STATUS}): ${resultObj.ERROR_MSG || "不明なエラー"}`);
          }
        }
      }
    } else {
      throw new Error("不正なレスポンス形式です");
    }
  } else {
     throw new Error("不正なレスポンス形式です");
  }
}
