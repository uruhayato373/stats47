/**
 * レート制限（Rate Limiting）モジュール
 *
 * e-Stat APIには利用制限があり、短時間に大量のリクエストを送ると
 * 一時的にブロックされる可能性があります。このモジュールは
 * トークンバケットアルゴリズムを使用してリクエスト頻度を制御します。
 *
 * @example
 * ```typescript
 * // リクエスト前に acquire() を呼び出す
 * await estatRateLimiter.acquire();
 * const response = await fetch(url);
 * ```
 *
 * @see https://www.e-stat.go.jp/api/api-info/api-guide API利用ガイド
 */

import { logger } from "@stats47/logger";
import { ESTAT_API_CONFIG } from "../config/index";

/**
 * トークンバケット方式のレート制限クラス
 *
 * トークンバケットアルゴリズム:
 * - バケットには最大 maxTokens 個のトークンが入る
 * - リクエストごとに1トークンを消費
 * - 時間経過でトークンが補充される（1分間で maxTokens 個）
 * - トークンがない場合は補充されるまで待機
 *
 * @example
 * ```typescript
 * const limiter = new RateLimiter(60, "MyAPI"); // 1分間に60リクエストまで
 * await limiter.acquire(); // リクエスト前に呼び出し
 * ```
 */
export class RateLimiter {
  /** 現在のトークン数 */
  private tokens: number;

  /** 最後にトークンを補充した時刻（ミリ秒） */
  private lastRefill: number;

  /** バケットの最大トークン数（= 1分間の最大リクエスト数） */
  private readonly maxTokens: number;

  /** トークン補充レート（1秒あたりの補充数） */
  private readonly refillRate: number;

  /** ログ出力用の識別名 */
  private readonly name: string;

  /**
   * RateLimiterを作成
   *
   * @param maxPerMinute - 1分間あたりの最大リクエスト数
   * @param name - ログ出力用の識別名（デフォルト: "RateLimiter"）
   */
  constructor(maxPerMinute: number, name: string = "RateLimiter") {
    this.maxTokens = maxPerMinute;
    this.tokens = maxPerMinute; // 初期状態は満タン
    this.refillRate = maxPerMinute / 60; // 1秒あたりの補充数
    this.lastRefill = Date.now();
    this.name = name;
  }

  /**
   * 経過時間に応じてトークンを補充する
   * トークン数は maxTokens を超えない
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // 秒単位
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * リクエスト実行の許可を取得する
   *
   * トークンが利用可能であれば即座に返る。
   * トークンがない場合は、補充されるまで待機してから返る。
   *
   * @returns リクエスト実行が許可されたら解決するPromise
   *
   * @example
   * ```typescript
   * await rateLimiter.acquire();
   * // ここでAPIリクエストを実行
   * ```
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      // トークンが足りない場合、補充されるまで待機
      const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;

      logger.debug(
        { name: this.name, waitTime, tokens: this.tokens },
        "[RateLimiter] トークン不足、待機中"
      );

      await new Promise((resolve) => setTimeout(resolve, Math.ceil(waitTime)));
      this.refill();
    }

    // トークンを1つ消費
    this.tokens -= 1;
  }
}

/**
 * e-Stat API用のレート制限インスタンス
 *
 * 設定値は ESTAT_API_CONFIG.RATE_LIMIT_PER_MINUTE から取得
 * （デフォルト: 1分間に60リクエスト）
 */
export const estatRateLimiter = new RateLimiter(
  ESTAT_API_CONFIG.RATE_LIMIT_PER_MINUTE,
  "EstatAPI"
);
