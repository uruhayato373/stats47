import { logger } from "@stats47/logger";

/**
 * 統計データレスポンスの詳細検証
 *
 * @param data - APIレスポンス
 * @param url - リクエストURL
 */
export function validateResponse(data: unknown, url: string): void {
  if (!data || typeof data !== "object") {
    throw new Error(`不正なレスポンス形式です: ${url}`);
  }

  const record = data as Record<string, unknown>;
  const statsData = record.GET_STATS_DATA;
  const result =
    statsData && typeof statsData === "object"
      ? (statsData as Record<string, unknown>).RESULT
      : undefined;
  if (!result || typeof result !== "object") return;

  const resultRecord = result as Record<string, unknown>;
  const status = resultRecord.STATUS;
  if (status !== 0 && status !== 1) {
    const errorMsg =
      typeof resultRecord.ERROR_MSG === "string"
        ? resultRecord.ERROR_MSG
        : "不明なエラー";
    logger.error({ status, errorMsg, url }, "e-Stat APIエラーレスポンス");
    throw new Error(`e-Stat APIエラー [${status}]: ${errorMsg}`);
  }
}
