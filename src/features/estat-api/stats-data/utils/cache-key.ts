/**
 * stats-data用キャッシュキー生成ユーティリティ
 * 責務: パラメータから一意のキャッシュキー（ファイル名）を生成
 */

import type { FetchOptions } from "../types";

/**
 * ファイル名として使用できない文字をサニタイズ
 *
 * @param value - サニタイズする値
 * @returns サニタイズされた値
 */
function sanitizeFilename(value: string): string {
  return value
    .replace(/[/\\:*?"<>| ]/g, "-") // ファイル名として使用できない文字を`-`に置換
    .replace(/-+/g, "-") // 連続する`-`を1つに
    .replace(/^-|-$/g, ""); // 先頭と末尾の`-`を削除
}

/**
 * FetchOptionsからパラメータを抽出して正規化
 *
 * @param options - 取得オプション
 * @returns 正規化されたパラメータオブジェクト
 */
function normalizeParams(options: FetchOptions): Record<string, string> {
  const params: Record<string, string> = {};

  if (options.areaFilter) {
    params.cdArea = options.areaFilter;
  }
  if (options.yearFilter) {
    params.cdTime = options.yearFilter;
  }
  if (options.categoryFilter) {
    params.cdCat01 = options.categoryFilter;
  }
  if (options.limit) {
    params.limit = String(options.limit);
  }

  return params;
}

/**
 * パラメータからキャッシュキー（ファイル名）を生成
 *
 * @param statsDataId - 統計表ID
 * @param options - 取得オプション
 * @returns キャッシュキー（例: `estat-api/stats-data/{statsDataId}/{params_filename}.json`）
 */
export function generateStatsDataCacheKey(
  statsDataId: string,
  options: FetchOptions = {}
): string {
  const params = normalizeParams(options);
  const paramKeys = Object.keys(params).sort(); // ソートして一貫性を保証

  // パラメータがない場合は`default.json`
  if (paramKeys.length === 0) {
    return `estat-api/stats-data/${statsDataId}/default.json`;
  }

  // パラメータを`パラメータ名=値`の形式で結合
  const paramParts = paramKeys.map((key) => {
    const value = sanitizeFilename(String(params[key]));
    return `${key}=${value}`;
  });

  const paramsFilename = paramParts.join("_");
  return `estat-api/stats-data/${statsDataId}/${paramsFilename}.json`;
}
