import type { ThemeCatalog } from './types';

/** テーマ内の役割の重み。context (背景として添えただけの指標) は回遊の根拠にしない。 */
const ROLE_WEIGHT = { primary: 2, secondary: 1, context: 0 } as const;

export interface RelatedThemeByMetric {
  key: string;
  title: string;
  /** そのテーマが使う、渡した指標のうちのもの */
  rankingKeys: string[];
}

/**
 * 渡した指標を使うテーマ。ランキング・ブログ・エリアから「この指標を深掘りするテーマ」へ回遊するための逆引き。
 *
 * 公開する分類軸 (Category / Theme / Tag) は増やさず、既存の Theme へ「同じ指標を使う」関係で接続する
 * (`docs/01_技術設計/03_情報設計.md`「三つの分類軸」)。一致した指標の役割の重み合計の大きい順。
 * context の指標だけで一致するテーマは返さない。
 */
export function listThemesUsingRankingKeys(
  rankingKeys: readonly string[],
  catalogs: readonly ThemeCatalog[],
): RelatedThemeByMetric[] {
  const wanted = new Set(rankingKeys);
  const scored: Array<RelatedThemeByMetric & { score: number }> = [];
  for (const catalog of catalogs) {
    const matched = catalog.metrics.filter((m) => wanted.has(m.rankingKey) && ROLE_WEIGHT[m.role] > 0);
    if (matched.length === 0) continue;
    scored.push({
      key: catalog.key,
      title: catalog.title,
      rankingKeys: [...new Set(matched.map((m) => m.rankingKey))],
      score: matched.reduce((sum, m) => sum + ROLE_WEIGHT[m.role], 0),
    });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'ja'))
    .map(({ score: _score, ...theme }) => theme);
}
