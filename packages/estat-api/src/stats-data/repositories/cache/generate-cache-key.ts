import type { GetStatsDataParams } from "../../types";

/** キャッシュキー生成に使用するフィルタリングパラメータ */
const FILTER_PARAM_KEYS = [
  'cdTab', 'cdTime', 'cdArea',
  'cdTimeFrom', 'cdTimeTo',
  'cdAreaFrom', 'cdAreaTo',
  'cdCat01', 'cdCat02', 'cdCat03', 'cdCat04', 'cdCat05',
  'cdCat06', 'cdCat07', 'cdCat08', 'cdCat09', 'cdCat10',
  'cdCat11', 'cdCat12', 'cdCat13', 'cdCat14', 'cdCat15',
] as const;

/**
 * ファイル名として使用できない文字をサニタイズ
 */
function sanitizeFilename(value: string): string {
  return value
    .replace(/[/\\:*?"<>| ]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * パラメータからキャッシュキー（ファイル名）を生成
 *
 * @param params - e-Stat APIパラメータ
 * @returns キャッシュキー（例: `estat-api/stats-data/{statsDataId}/{params_filename}.json`）
 */
export function generateCacheKey(params: GetStatsDataParams): string {
  const { statsDataId } = params;

  // フィルタリングパラメータを抽出
  const filterParams: [string, string][] = [];
  for (const key of FILTER_PARAM_KEYS) {
    const value = params[key];
    if (value) {
      filterParams.push([key, sanitizeFilename(value)]);
    }
  }

  // パラメータがない場合は`default.json`
  if (filterParams.length === 0) {
    return `estat-api/stats-data/${statsDataId}/default.json`;
  }

  // パラメータを`パラメータ名=値`の形式で結合
  const paramsFilename = filterParams
    .map(([key, value]) => `${key}=${value}`)
    .join("_");

  return `estat-api/stats-data/${statsDataId}/${paramsFilename}.json`;
}
