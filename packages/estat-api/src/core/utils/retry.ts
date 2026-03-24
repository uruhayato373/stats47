/**
 * リトライ処理モジュール
 *
 * ネットワークエラーやサーバーエラーなど、一時的な障害で失敗した
 * API呼び出しを自動的に再試行します。
 *
 * 指数バックオフ（Exponential Backoff）アルゴリズムを採用し、
 * リトライごとに待機時間を増加させることでサーバーへの負荷を軽減します。
 *
 * @example
 * ```typescript
 * const data = await executeWithRetry(
 *   () => fetch(url).then(res => res.json()),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */

import { logger } from "@stats47/logger";
import { ESTAT_API_CONFIG } from "../config/index";
import { EstatApiError } from "../errors/index";

/**
 * リトライ処理のオプション
 */
export interface RetryOptions {
  /** 最大リトライ回数（デフォルト: ESTAT_API_CONFIG.MAX_RETRIES = 3） */
  maxRetries?: number;

  /** 初回リトライまでの待機時間（ミリ秒）（デフォルト: ESTAT_API_CONFIG.RETRY_DELAY_MS = 2000） */
  initialDelay?: number;

  /** 最大待機時間（ミリ秒）（デフォルト: 10000） */
  maxDelay?: number;

  /** 待機時間の増加倍率（デフォルト: 2） */
  backoffMultiplier?: number;

  /** エラーがリトライ可能かを判定する関数 */
  isRetryable?: (error: unknown) => boolean;
}

/**
 * デフォルトのリトライ可能判定関数
 *
 * 以下のエラーをリトライ可能と判定:
 * - ネットワークエラー（fetch failed, network, connection, timeout）
 * - DNS解決エラー（econnrefused, enotfound）
 * - サーバーエラー（HTTP 5xx）
 *
 * @param error - 発生したエラー
 * @returns リトライすべき場合は true
 */
function defaultIsRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // ネットワーク関連のエラー
    if (
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("enotfound")
    ) {
      return true;
    }

    // サーバーエラー（5xx）
    if (error instanceof EstatApiError) {
      if (error.statusCode !== undefined && error.statusCode >= 500 && error.statusCode < 600) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 指数バックオフ付きリトライ処理を実行する
 *
 * 与えられた非同期関数を実行し、リトライ可能なエラーが発生した場合は
 * 指定された回数まで再試行します。
 *
 * 待機時間の計算式:
 * ```
 * delay = min(initialDelay * (backoffMultiplier ^ attempt), maxDelay)
 * ```
 *
 * 例（デフォルト設定の場合）:
 * - 1回目のリトライ: 2000ms 待機
 * - 2回目のリトライ: 4000ms 待機
 * - 3回目のリトライ: 8000ms 待機
 *
 * @typeParam T - 関数の戻り値の型
 * @param fn - 実行する非同期関数
 * @param options - リトライオプション
 * @returns 関数の実行結果
 * @throws 最大リトライ回数を超えた場合、またはリトライ不可能なエラーの場合
 *
 * @example
 * ```typescript
 * // 基本的な使い方
 * const result = await executeWithRetry(() => fetchData());
 *
 * // オプションをカスタマイズ
 * const result = await executeWithRetry(
 *   () => fetchData(),
 *   {
 *     maxRetries: 5,
 *     initialDelay: 500,
 *     isRetryable: (error) => error instanceof NetworkError,
 *   }
 * );
 * ```
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = ESTAT_API_CONFIG.MAX_RETRIES,
    initialDelay = ESTAT_API_CONFIG.RETRY_DELAY_MS,
    maxDelay = 10000,
    backoffMultiplier = 2,
    isRetryable = defaultIsRetryable,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const shouldRetry = isRetryable(error);

      // リトライ不可能、または最大回数到達
      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }

      // 指数バックオフで待機時間を計算
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      logger.warn(
        { attempt: attempt + 1, delay },
        "[Retry] リトライ実行中"
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
