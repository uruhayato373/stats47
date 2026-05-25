"use server";

import {
  computeNormalization,
  fetchRankingValuesOnDemand,
  readNormalizedRankingValuesFromR2,
  readRankingValuesFromR2,
  readRankingItemFromR2,
} from "@stats47/ranking/server";
import { err, isOk, ok, type Result } from "@stats47/types";

import type { AreaType } from "@stats47/area";
import type { RankingValue } from "@stats47/ranking";

/**
 * 受け入れ可能な正規化タイプの whitelist。
 * R2 オブジェクトキー (`app/ranking/{key}/values-{type}.json`) に流入するため、
 * path traversal 対策としてサーバ側で固定値以外を弾く。
 */
const ALLOWED_NORMALIZATION_TYPES = new Set([
  "per_population",
  "per_area",
  "per_household",
]);

/**
 * ランキングデータを取得する（正規化対応）
 *
 * @param parentAreaCode 都道府県コード（市区町村フィルタ用、例: "13000"）
 */
export async function fetchRankingValuesAction(
  rankingKey: string,
  areaType: AreaType,
  yearCode: string,
  normalizationType?: string,
  parentAreaCode?: string,
): Promise<Result<RankingValue[], Error>> {
  try {
    // アイテム情報を取得
    const itemResult = await readRankingItemFromR2(rankingKey, areaType);
    if (!isOk(itemResult) || !itemResult.data) {
      return err(new Error("Ranking item not found"));
    }
    const rankingItem = itemResult.data;

    let values: RankingValue[];

    // normalizationType は ?norm= query param 由来でユーザー制御値。
    // 後続の R2 キーパス生成に流入するため、固定 whitelist でのみ受理する。
    const safeNormalizationType =
      normalizationType && ALLOWED_NORMALIZATION_TYPES.has(normalizationType)
        ? normalizationType
        : undefined;

    // 正規化が指定されている場合
    if (safeNormalizationType) {
      // 事前計算済み R2 スナップショットを優先使用
      const normResult = await readNormalizedRankingValuesFromR2(
        rankingKey,
        areaType,
        yearCode,
        safeNormalizationType,
      );
      if (isOk(normResult) && normResult.data.length > 0) {
        values = normResult.data;
      } else {
        // フォールバック: 実行時計算（カスタム denominatorKey 等）
        values = await computeNormalization(rankingItem, yearCode, safeNormalizationType);
      }
    } else {
      // DB から取得（なければ e-Stat API からオンデマンド取得 + キャッシュ）
      const result = await readRankingValuesFromR2(rankingKey, areaType, yearCode);
      if (!isOk(result)) return result;
      values = result.data;

      if (values.length === 0) {
        values = await fetchRankingValuesOnDemand(rankingItem, yearCode);
      }
    }

    // 都道府県内フィルタ
    if (parentAreaCode) {
      const prefPrefix = parentAreaCode.slice(0, 2);
      values = values.filter((v) => v.areaCode.startsWith(prefPrefix));
      values.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
      values = values.map((v, i) => ({ ...v, rank: i + 1 }));
    }

    return ok(values);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
