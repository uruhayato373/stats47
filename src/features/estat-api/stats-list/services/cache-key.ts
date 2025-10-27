/**
 * stats-list用キャッシュキー生成ユーティリティ
 * 責務: 検索オプションから一意のキャッシュキーを生成
 */

import { StatsListSearchOptions } from "@/features/estat-api/stats-list/types";

/**
 * 検索オプションを正規化する
 * 空文字列やundefinedを除去し、一貫した形式にする
 */
function normalizeSearchOptions(
  options: StatsListSearchOptions
): StatsListSearchOptions {
  const normalized: StatsListSearchOptions = {};

  // 必須項目のみをコピー
  if (options.searchWord) normalized.searchWord = options.searchWord;
  if (options.statsCode) normalized.statsCode = options.statsCode;
  if (options.statsField) normalized.statsField = options.statsField;
  if (options.collectArea) normalized.collectArea = options.collectArea;
  if (options.surveyYears) normalized.surveyYears = options.surveyYears;
  if (options.openYears) normalized.openYears = options.openYears;
  if (options.limit) normalized.limit = options.limit;
  if (options.startPosition) normalized.startPosition = options.startPosition;

  return normalized;
}

/**
 * 検索オプションからキャッシュキーを生成
 *
 * @param options - 検索オプション
 * @returns キャッシュキー文字列、またはnull（無効な場合）
 */
export function generateStatsListCacheKey(
  options: StatsListSearchOptions
): string | null {
  // オプションが空の場合はnullを返す
  if (!options || Object.keys(options).length === 0) {
    return null;
  }

  // オプションを正規化
  const normalized = normalizeSearchOptions(options);

  // 正規化後も空の場合はnullを返す
  if (Object.keys(normalized).length === 0) {
    return null;
  }

  // キーをソートして一意性を保証
  const sortedKeys = Object.keys(normalized).sort();

  // クエリパラメータ形式でキーを生成
  const queryParams = new URLSearchParams();

  sortedKeys.forEach((key) => {
    const value = normalized[key as keyof StatsListSearchOptions];
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  // キャッシュキーを生成
  const cacheKey = `/api/estat-api/stats-list?${queryParams.toString()}`;

  console.log("🔵 Cache Key Generated:", {
    original: options,
    normalized,
    cacheKey,
  });

  return cacheKey;
}

/**
 * キャッシュキーから検索オプションを復元
 *
 * @param cacheKey - キャッシュキー
 * @returns 検索オプション、またはnull（無効な場合）
 */
export function parseStatsListCacheKey(
  cacheKey: string
): StatsListSearchOptions | null {
  try {
    const url = new URL(cacheKey, "http://localhost");
    const params = new URLSearchParams(url.search);

    const options: StatsListSearchOptions = {};

    // 各パラメータを解析
    for (const [key, value] of params.entries()) {
      switch (key) {
        case "searchWord":
        case "statsCode":
        case "statsField":
        case "collectArea":
        case "surveyYears":
        case "openYears":
          options[key] = value;
          break;
        case "limit":
        case "startPosition":
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            options[key] = numValue;
          }
          break;
      }
    }

    console.log("🔵 Cache Key Parsed:", {
      cacheKey,
      options,
    });

    return options;
  } catch (error) {
    console.error("❌ Failed to parse cache key:", cacheKey, error);
    return null;
  }
}

/**
 * キャッシュキーが有効かどうかを判定
 *
 * @param cacheKey - キャッシュキー
 * @returns 有効な場合true
 */
export function isValidStatsListCacheKey(cacheKey: string): boolean {
  return (
    cacheKey.startsWith("/api/estat-api/stats-list?") &&
    cacheKey.length > "/api/estat-api/stats-list?".length
  );
}
