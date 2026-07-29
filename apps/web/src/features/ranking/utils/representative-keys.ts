import { REPRESENTATIVE_RANKING_KEYS } from "@stats47/data-configs/ranking-prominence";

/**
 * 索引が代表として出すランキングキーの集合。
 *
 * 一覧は生成物 (`generate-ranking-prominence.ts`) が唯一の出所で、ここは Set 化するだけ。
 * 旧 `RankingItem.isFeatured` は 2,295 件中 8 件しか設定されておらず、しかもその 8 件は
 * ホームの注目と完全重複していたため、ほぼ全調査で 0 件だった。
 */
export const REPRESENTATIVE_RANKING_KEY_SET: ReadonlySet<string> = new Set(
  REPRESENTATIVE_RANKING_KEYS,
);
