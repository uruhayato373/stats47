"use server";

import {
  computeNormalization,
  fetchRankingValuesOnDemand,
  readNormalizedRankingValuesFromR2,
  readRankingValuesFromR2,
  readRankingItemFromR2,
} from "@stats47/ranking/server";
import { err, isOk, ok, type Result } from "@stats47/types";

import { findSeriesOption } from "../utils";

import { sanitizeNormalizationType } from "./normalization-types";

import type { AreaType } from "@stats47/area";
import type { RankingValue } from "@stats47/ranking";

/**
 * ランキングデータを取得する（正規化対応）
 */
export async function fetchRankingValuesAction(
  rankingKey: string,
  areaType: AreaType,
  yearCode: string,
  normalizationType?: string,
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
    const safeNormalizationType = sanitizeNormalizationType(normalizationType);
    // 別の指標の公表値を出す見方 (series)。指標のキーは item の選択肢と一致したものだけを使う (?norm= の値をキーに直接使わない)
    const seriesOption = findSeriesOption(rankingItem, normalizationType);

    if (seriesOption) {
      const result = await readRankingValuesFromR2(seriesOption.metric, areaType, yearCode);
      if (!isOk(result)) return result;
      values = result.data;
      // 系列の年は親と揃わないことがある (製造品出荷額等は 2024 年、従業者1人当たりは 2023 年まで)。
      // 選んだ年の値が無ければ、その系列の選んだ年以前で最も新しい年を返す。行の yearCode で画面の年も合わせる
      if (values.length === 0) {
        const seriesItem = await readRankingItemFromR2(seriesOption.metric, areaType);
        const fallbackYear = isOk(seriesItem)
          ? (seriesItem.data?.availableYears ?? [])
              .map((year) => year.yearCode)
              .filter((code) => code.slice(0, 4) <= yearCode.slice(0, 4))
              .sort()
              .at(-1)
          : undefined;
        if (fallbackYear) {
          const fallback = await readRankingValuesFromR2(seriesOption.metric, areaType, fallbackYear);
          if (isOk(fallback)) values = fallback.data;
        }
      }
    } else if (safeNormalizationType) {
      // 人口・面積で割る見方
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

    return ok(values);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
