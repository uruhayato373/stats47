"use server";

import { cache } from "react";

import {
  fetchAllYearsRankingValuesOnDemand,
  readAllYearsNormalizedRankingValuesFromR2,
  readRankingItemFromR2,
} from "@stats47/ranking/server";
import { err, ok, isOk, type Result } from "@stats47/types";

import type { AreaType } from "@stats47/area";
import type { RankingValue } from "@stats47/ranking";

/**
 * 全年分のランキングデータを取得する（内部キャッシュ付き）
 *
 * React `cache()` でリクエスト単位にデダップされる。
 * 同一リクエスト内で TrendSparklineCard と DataDownloadCard が
 * 同じ rankingKey で呼んでも DB クエリは 1 回のみ。
 */
const fetchAllYearsCore = cache(async (
  rankingKey: string,
  areaType: AreaType,
): Promise<Result<RankingValue[], Error>> => {
  try {
    const itemResult = await readRankingItemFromR2(rankingKey, areaType);
    if (!isOk(itemResult) || !itemResult.data) {
      return err(new Error("Ranking item not found"));
    }

    const values = await fetchAllYearsRankingValuesOnDemand(itemResult.data);
    return ok(values);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
});

/**
 * 受け入れ可能な正規化タイプの whitelist。
 * R2 オブジェクトキー (`app/ranking/{key}/values-{type}.json`) に流入するため、
 * path traversal 対策としてサーバ側で固定値以外を弾く。
 */
const ALLOWED_NORMALIZATION_TYPES = new Set([
  "per_population",
  "per_area",
]);

/**
 * 全年分のランキングデータを取得する（TrendSparkline・データダウンロード用）
 *
 * DB キャッシュを確認し、不足分があれば e-Stat API から一括取得する。
 * normalizationType を指定した場合は事前計算済みの正規化スナップショットを返す
 * (例: per_population なら 人口10万人あたりの全年度値)。
 *
 * @param parentAreaCode 都道府県コード（市区町村フィルタ用、例: "13000"）
 */
export async function fetchAllYearsRankingValuesAction(
  rankingKey: string,
  areaType: AreaType,
  parentAreaCode?: string,
  normalizationType?: string,
): Promise<Result<RankingValue[], Error>> {
  let result: Result<RankingValue[], Error>;
  // normalizationType は ?norm= query param 由来でユーザー制御値。
  // 後続の R2 キーパス生成に流入するため、固定 whitelist でのみ受理する。
  const safeNormalizationType =
    normalizationType && ALLOWED_NORMALIZATION_TYPES.has(normalizationType)
      ? normalizationType
      : undefined;
  if (safeNormalizationType) {
    const normResult = await readAllYearsNormalizedRankingValuesFromR2(
      rankingKey,
      areaType,
      safeNormalizationType,
    );
    // 正規化スナップショットが見つからなければ総数で fallback
    result = isOk(normResult) && normResult.data.length > 0
      ? normResult
      : await fetchAllYearsCore(rankingKey, areaType);
  } else {
    result = await fetchAllYearsCore(rankingKey, areaType);
  }
  if (!isOk(result)) return result;

  if (!parentAreaCode) return result;

  // 都道府県内の市区町村に絞り込み、年度ごとに順位を振り直す
  const prefPrefix = parentAreaCode.slice(0, 2);
  const filtered = result.data.filter((v) => v.areaCode.startsWith(prefPrefix));

  const byYear = new Map<string, RankingValue[]>();
  for (const v of filtered) {
    const arr = byYear.get(v.yearCode);
    if (arr) arr.push(v);
    else byYear.set(v.yearCode, [v]);
  }
  const reranked: RankingValue[] = [];
  for (const vals of byYear.values()) {
    vals.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    for (let i = 0; i < vals.length; i++) {
      reranked.push({ ...vals[i], rank: i + 1 });
    }
  }

  return ok(reranked);
}
