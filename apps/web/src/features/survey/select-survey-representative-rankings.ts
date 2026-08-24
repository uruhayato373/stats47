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
 * サイト共通の代表集合を優先しつつ、調査が複数カテゴリを跨ぐ場合はカテゴリの異なる
 * 指標を先に拾う。共通代表を1件も持たない小規模調査でも空にならないことが重要な契約。
 */
export function selectSurveyRepresentativeRankings<
  T extends SurveyRepresentativeCandidate,
>(items: readonly T[], limit = 4): T[] {
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
