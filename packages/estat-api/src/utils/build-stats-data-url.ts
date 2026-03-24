import type { StatsDataFormValues } from "../stats-data/schemas/stats-data-form.schema";
import { buildStatsDataUrlParams } from "./build-stats-data-url-params";

/**
 * 統計データ表示ページ用のURLを構築
 * @param values - フォームデータ
 * @returns 構築されたURL文字列
 */
export function buildStatsDataUrl(values: StatsDataFormValues): string {
  const params = buildStatsDataUrlParams(values);
  return `/estat-api/stats-data?${params.toString()}`;
}
