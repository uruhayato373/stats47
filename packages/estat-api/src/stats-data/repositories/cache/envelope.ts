import type { EstatStatsDataResponse, GetStatsDataParams } from '../../types';

/**
 * R2 に保存する e-Stat 統計データキャッシュの封筒。
 *
 * ★このキャッシュは「復元可能・出典再現可能」であることを設計要件とする。
 *   - `response` は e-Stat の生レスポンス丸ごと。`TABLE_INF` に統計表名・政府機関・調査年
 *     (= 出典) が自己記述されているので、この 1 ファイルから出典を再現できる。
 *   - `params` は取得に使ったリクエスト全体。キー文字列 (generateCacheKey) は一部の
 *     パラメータしか反映しないため、これが無いと「どの条件で得たデータか」を後から
 *     確定できず再取得できない。v2 で追加した。
 *   - `cachedAt` は取得日時。`CACHE_TTL_DAYS` を超えたものは stale として読み捨て、
 *     再取得・上書きする (統計は年次更新されるので write-once では新年度を取り込めない)。
 */
export interface StatsDataCacheEnvelope {
  /** ISO8601。取得日時 */
  cachedAt: string;
  /** 取得に使った e-Stat API リクエストパラメータ全体 (v2〜) */
  params?: GetStatsDataParams;
  /** e-Stat API のバージョン (v2〜) */
  apiVersion?: string;
  /** e-Stat の生レスポンス */
  response: EstatStatsDataResponse;
}

/** 現在利用している e-Stat API バージョン */
export const ESTAT_API_VERSION = "3.0";

/**
 * キャッシュの鮮度上限 (日)。
 *
 * 統計表は年次で更新されるため、無期限キャッシュだと新しい年のデータが永久に反映されない。
 * 30 日で自然に再取得させることで、GC も手動 invalidate も不要な自己更新にする。
 */
export const CACHE_TTL_DAYS = 30;

/**
 * `cachedAt` が鮮度上限を超えているか。
 *
 * 不正・欠落 (v1 以前の壊れた封筒) は stale 扱いにして再取得させる。
 */
export function isStale(
  cachedAt: unknown,
  now: number = Date.now(),
  ttlDays: number = CACHE_TTL_DAYS,
): boolean {
  if (typeof cachedAt !== "string") return true;
  const saved = Date.parse(cachedAt);
  if (Number.isNaN(saved)) return true;
  return now - saved > ttlDays * 24 * 60 * 60 * 1000;
}
