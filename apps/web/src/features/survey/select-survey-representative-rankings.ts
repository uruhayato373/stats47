import { normalizeTitleForDedup } from '@stats47/data-configs/prominence';
import { REPRESENTATIVE_RANKING_KEYS } from '@stats47/data-configs/ranking-prominence';

export interface SurveyRepresentativeCandidate {
  rankingKey: string;
  title: string;
  categoryKey?: string | null;
}

const SITE_REPRESENTATIVE_KEYS = new Set(REPRESENTATIVE_RANKING_KEYS);

/**
 * 調査内の代表ランキングを決定的に選ぶ。
 *
 * preferredKeys (調査の編集設定の「読者の問い」が指すランキング) を与えた順に最優先で取る。
 * 残りはサイト共通の代表集合を優先しつつ、調査が複数カテゴリを跨ぐ場合はカテゴリの異なる
 * 指標を先に拾う。共通代表を1件も持たない小規模調査でも空にならないことが重要な契約。
 *
 * preferredKeys が無いと、家計調査では件数 2 件の「情報通信」分類の情報通信係数が、
 * 需要上位の納豆・米より先に代表になっていた (2026-11-02)。
 */
export function selectSurveyRepresentativeRankings<
  T extends SurveyRepresentativeCandidate,
>(items: readonly T[], limit = 4, preferredKeys: readonly string[] = []): T[] {
  if (limit <= 0) return [];

  const uniqueItems = items.filter(
    (item, index, source) =>
      source.findIndex(
        (candidate) => candidate.rankingKey === item.rankingKey
      ) === index
  );
  const selected: T[] = [];
  const selectedKeys = new Set<string>();
  const selectedCategories = new Set<string>();
  const selectedTitles = new Set<string>();

  const take = (predicate: (item: T) => boolean): void => {
    for (const item of uniqueItems) {
      if (selected.length >= limit) return;
      if (selectedKeys.has(item.rankingKey) || !predicate(item)) continue;

      selected.push(item);
      selectedKeys.add(item.rankingKey);
      if (item.categoryKey) selectedCategories.add(item.categoryKey);
      selectedTitles.add(normalizeTitleForDedup(item.title));
    }
  };
  const hasNewCategory = (item: T) =>
    !!item.categoryKey && !selectedCategories.has(item.categoryKey);
  const hasNewTitle = (item: T) =>
    !selectedTitles.has(normalizeTitleForDedup(item.title));
  const isSiteRepresentative = (item: T) =>
    SITE_REPRESENTATIVE_KEYS.has(item.rankingKey);

  for (const key of preferredKeys) {
    take((item) => item.rankingKey === key && hasNewTitle(item));
  }

  take(
    (item) =>
      isSiteRepresentative(item) && hasNewCategory(item) && hasNewTitle(item)
  );
  take((item) => hasNewCategory(item) && hasNewTitle(item));
  take((item) => isSiteRepresentative(item) && hasNewTitle(item));
  take(hasNewTitle);
  take(() => true);

  return selected;
}

/**
 * 調査のランキング一覧を、preferredKeys (読者の問いが指すランキング) を与えた順に先頭へ並べ替える。
 * 残りは元の順を保つ。ランキングページの「同じ調査のランキング」に使う。
 */
export function prioritizeSurveyRankings<T extends { rankingKey: string }>(
  items: readonly T[],
  preferredKeys: readonly string[]
): T[] {
  const order = new Map(preferredKeys.map((key, index) => [key, index]));
  const preferred = items
    .filter((item) => order.has(item.rankingKey))
    .sort((a, b) => (order.get(a.rankingKey) ?? 0) - (order.get(b.rankingKey) ?? 0));
  return [...preferred, ...items.filter((item) => !order.has(item.rankingKey))];
}

/**
 * 代表カードに出したランキングの問いを、上の「答えを探す」の一覧から外す。
 * 同じ問いをカードと一覧の両方に並べると、ハブの冒頭で同じ導線が 2 度続く (2026-11-02)。
 */
export function excludeFeaturedQuestions<T extends { rankingKey: string }>(
  questions: readonly T[],
  featuredKeys: readonly string[]
): T[] {
  const featured = new Set(featuredKeys);
  return questions.filter((question) => !featured.has(question.rankingKey));
}
