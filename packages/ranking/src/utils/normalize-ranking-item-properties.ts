import type { RankingItem, RankingItemForDisplay } from "../types/ranking-item";
import { getRankingTitle } from "./get-ranking-title";

/**
 * プロパティのフォールバック処理を適用した RankingItem を取得・整形するユーティリティ
 */

/**
 * RankingItem の各プロパティに対して標準的なフォールバックを適用する
 *
 * @param item - 変換前の RankingItem
 * @returns フォールバック適用済みのオブジェクト
 */
export function normalizeRankingItemProperties(item: RankingItem) {
  return {
    ...item,
    // タイトルのフォールバック
    displayTitle: getRankingTitle(item),
    // 解説文のフォールバック
    displayDescription: item.annotation || item.description || null,
    // 表示用単位のフォールバック
    displayUnit: getDisplayUnit(item),
  };
}

/**
 * RankingItem から表示用単位を解決する
 *
 * valueDisplay.displayUnit が設定されていればそれを優先し、
 * なければ item.unit にフォールバックする。
 */
export function getDisplayUnit(item: Pick<RankingItem, "valueDisplay" | "unit">): string {
  return item.valueDisplay?.displayUnit || item.unit || "";
}

/**
 * RankingItem を画像生成など外部パッケージ向けの軽量インターフェースに変換する
 *
 * - unit は displayUnit 解決済み
 * - visualization はパース済みオブジェクト
 */
export function toRankingItemForDisplay(item: RankingItem): RankingItemForDisplay {
  return {
    title: item.title,
    subtitle: item.subtitle,
    demographicAttr: item.demographicAttr,
    normalizationBasis: item.normalizationBasis,
    unit: getDisplayUnit(item),
    visualization: item.visualization,
  };
}
