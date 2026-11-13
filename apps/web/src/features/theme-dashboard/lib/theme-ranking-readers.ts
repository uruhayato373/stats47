import "server-only";

import { cache } from "react";

import { readAllYearsRankingValuesFromR2, readRankingItemFromR2 } from "@stats47/ranking/server";
import { isOk, type AreaType, type Result } from "@stats47/types";

/**
 * 失敗した取得 (失敗の結果、または例外) を 1 回だけ取り直す。
 * R2 に無い指標は成功 (null や空の配列) で返るので取り直さない。2 回目の結果はそのまま返す。
 */
export async function readWithOneRetry<T>(read: () => Promise<Result<T, Error>>): Promise<Result<T, Error>> {
  try {
    const first = await read();
    if (isOk(first)) return first;
  } catch {
    // 下で取り直す
  }
  return read();
}

/**
 * テーマのページが 1 回のリクエストで読む指標の定義 (app/ranking/<key>/item.json)。
 *
 * 題と説明文を作る段 (theme-seo.ts の readThemeLeadFact) と本文の段 (load-theme-data.ts) が同じ指標を別々に読んでいたので、
 * React の cache() でリクエストごとに 1 回にまとめる (CF-RENDER-CPU-01)。次のリクエストは必ず読み直す。
 * cache() は失敗の結果も覚えるので、取り直しは覚える関数の内側に置く (外側で取り直すと、覚えた失敗が返るだけになる)。
 */
export const readThemeRankingItem = cache((rankingKey: string, areaType: AreaType) =>
  readWithOneRetry(() => readRankingItemFromR2(rankingKey, areaType)),
);

/** テーマのページが 1 回のリクエストで読む都道府県の全年の値 (app/ranking/<key>/values.json)。まとめ方は上と同じ */
export const readThemePrefectureValues = cache((rankingKey: string) =>
  readWithOneRetry(() => readAllYearsRankingValuesFromR2(rankingKey, "prefecture")),
);
