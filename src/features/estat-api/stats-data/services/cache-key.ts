/**
 * stats-data用キャッシュキー生成ユーティリティ
 * 責務: パラメータから一意のキャッシュキーを生成
 */

import { GetStatsDataParams } from "@/features/estat-api/core/types";

/**
 * パラメータを正規化する
 * 空文字列やundefinedを除去し、一貫した形式にする
 */
function normalizeStatsDataParams(
  params: GetStatsDataParams
): GetStatsDataParams {
  const normalized: GetStatsDataParams = {
    appId: params.appId,
    statsDataId: params.statsDataId,
  };

  // オプションパラメータを追加
  if (params.cdCat01) normalized.cdCat01 = params.cdCat01;
  if (params.cdArea) normalized.cdArea = params.cdArea;
  if (params.cdTime) normalized.cdTime = params.cdTime;
  if (params.cdCat02) normalized.cdCat02 = params.cdCat02;
  if (params.cdCat03) normalized.cdCat03 = params.cdCat03;
  if (params.cdCat04) normalized.cdCat04 = params.cdCat04;
  if (params.cdCat05) normalized.cdCat05 = params.cdCat05;
  if (params.cdCat06) normalized.cdCat06 = params.cdCat06;
  if (params.cdCat07) normalized.cdCat07 = params.cdCat07;
  if (params.cdCat08) normalized.cdCat08 = params.cdCat08;
  if (params.cdCat09) normalized.cdCat09 = params.cdCat09;
  if (params.cdCat10) normalized.cdCat10 = params.cdCat10;
  if (params.cdCat11) normalized.cdCat11 = params.cdCat11;
  if (params.cdCat12) normalized.cdCat12 = params.cdCat12;
  if (params.cdCat13) normalized.cdCat13 = params.cdCat13;
  if (params.cdCat14) normalized.cdCat14 = params.cdCat14;
  if (params.cdCat15) normalized.cdCat15 = params.cdCat15;
  if (params.cdCat16) normalized.cdCat16 = params.cdCat16;
  if (params.cdCat17) normalized.cdCat17 = params.cdCat17;
  if (params.cdCat18) normalized.cdCat18 = params.cdCat18;
  if (params.cdCat19) normalized.cdCat19 = params.cdCat19;
  if (params.cdCat20) normalized.cdCat20 = params.cdCat20;

  return normalized;
}

/**
 * パラメータからキャッシュキーを生成
 *
 * @param params - 統計データ取得パラメータ
 * @returns キャッシュキー文字列、またはnull（無効な場合）
 */
export function generateStatsDataCacheKey(
  params: GetStatsDataParams | null
): string | null {
  // パラメータがnullまたは必須項目が不足している場合はnullを返す
  if (!params || !params.appId || !params.statsDataId) {
    return null;
  }

  // パラメータを正規化
  const normalized = normalizeStatsDataParams(params);

  // キーをソートして一意性を保証
  const sortedKeys = Object.keys(normalized).sort();

  // クエリパラメータ形式でキーを生成
  const queryParams = new URLSearchParams();

  sortedKeys.forEach((key) => {
    const value = normalized[key as keyof GetStatsDataParams];
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  // キャッシュキーを生成
  const cacheKey = `/api/estat-api/stats-data?${queryParams.toString()}`;

  console.log("🔵 Stats Data Cache Key Generated:", {
    original: params,
    normalized,
    cacheKey,
  });

  return cacheKey;
}

/**
 * キャッシュキーからパラメータを復元
 *
 * @param cacheKey - キャッシュキー
 * @returns パラメータ、またはnull（無効な場合）
 */
export function parseStatsDataCacheKey(
  cacheKey: string
): GetStatsDataParams | null {
  try {
    const url = new URL(cacheKey, "http://localhost");
    const params = new URLSearchParams(url.search);

    const result: GetStatsDataParams = {
      appId: params.get("appId") || "",
      statsDataId: params.get("statsDataId") || "",
    };

    // オプションパラメータを解析
    const optionalParams = [
      "cdCat01",
      "cdArea",
      "cdTime",
      "cdCat02",
      "cdCat03",
      "cdCat04",
      "cdCat05",
      "cdCat06",
      "cdCat07",
      "cdCat08",
      "cdCat09",
      "cdCat10",
      "cdCat11",
      "cdCat12",
      "cdCat13",
      "cdCat14",
      "cdCat15",
      "cdCat16",
      "cdCat17",
      "cdCat18",
      "cdCat19",
      "cdCat20",
    ];

    optionalParams.forEach((param) => {
      const value = params.get(param);
      if (value) {
        (result as any)[param] = value;
      }
    });

    console.log("🔵 Stats Data Cache Key Parsed:", {
      cacheKey,
      params: result,
    });

    return result;
  } catch (error) {
    console.error("❌ Failed to parse stats data cache key:", cacheKey, error);
    return null;
  }
}

/**
 * キャッシュキーが有効かどうかを判定
 *
 * @param cacheKey - キャッシュキー
 * @returns 有効な場合true
 */
export function isValidStatsDataCacheKey(cacheKey: string): boolean {
  return (
    cacheKey.startsWith("/api/estat-api/stats-data?") &&
    cacheKey.length > "/api/estat-api/stats-data?".length
  );
}
