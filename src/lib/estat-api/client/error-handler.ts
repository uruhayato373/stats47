/**
 * e-Stat エラーハンドリングクラス
 * 責務: e-Stat API固有のエラーハンドリングのみを担当
 */

import { EstatAPIError } from "../types";
import { EstatResponseParser } from "./response-parser";

/**
 * e-Stat エラーハンドリングクラス
 * 責務: e-Stat API固有のエラーコード処理とエラーメッセージ管理
 */
export class EstatErrorHandler {
  /**
   * e-Stat APIのエラーをチェック
   *
   * @param data - e-Stat APIのレスポンスデータ
   * @param url - リクエストURL（エラー詳細に含める）
   */
  static checkEstatError(data: unknown, url: string): void {
    const result = EstatResponseParser.extractResult(data);

    if (result && typeof result === "object" && result !== null) {
      const resultObj = result as Record<string, unknown>;

      if (typeof resultObj.STATUS === "number") {
        // STATUS=1は警告（データは取得できている）なのでログのみ
        if (resultObj.STATUS === 1) {
          console.warn(
            "e-STAT API warning (STATUS=1):",
            resultObj.ERROR_MSG || "一部にエラーがあります"
          );
        }
        // STATUS>=100は実際のエラー
        else if (resultObj.STATUS >= 100) {
          const errorDetails = {
            STATUS: resultObj.STATUS,
            ERROR_MSG: resultObj.ERROR_MSG,
            URL: url,
            fullResponse: result,
          };
          console.error("e-STAT API error details:", errorDetails);
          console.error("Raw resultObj:", resultObj);
          console.error("Raw response data:", data);
          throw EstatAPIError.fromErrorCode(resultObj.STATUS, errorDetails);
        }
      }
    }
  }
}
