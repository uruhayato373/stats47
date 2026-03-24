import { logger } from "@stats47/logger";

/**
 * 統計データレスポンスの詳細検証
 *
 * @param data - APIレスポンス
 * @param url - リクエストURL
 */
export function validateResponse(data: any, url: string): void {
  if (!data || typeof data !== "object") {
    throw new Error(`不正なレスポンス形式です: ${url}`);
  }

  const result = data.GET_STATS_DATA?.RESULT;
  if (!result) return;

  const status = result.STATUS;
  if (status !== 0 && status !== 1) {
    const errorMsg = result.ERROR_MSG || "不明なエラー";
    logger.error({ status, errorMsg, url }, "e-Stat APIエラーレスポンス");
    throw new Error(`e-Stat APIエラー [${status}]: ${errorMsg}`);
  }
}
