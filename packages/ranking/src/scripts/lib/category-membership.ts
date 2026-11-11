/**
 * カテゴリ一覧 (`app/category/<key>/items.json`) の所属漏れを見つける純粋関数。
 *
 * 元データは `app/ranking-items/all.json` で、所属の決め方はエクスポーター
 * (`exporters/ranking-items-per-url-snapshot.ts`) と同じ:
 * 有効な指標は `categoryKey` と `additionalCategories` に挙げたカテゴリすべての一覧に入る。
 *
 * 件数が 0 でないことや前回の半分を下回らないことは別の検査が見ている。
 * それでは 1,013 件のうち 9 件が欠けても気づけない (2026-11-11 に economy の `*-budget-share-kakei` で発生)。
 * ここでは「入っているはずのキーが一覧に無い」ことを直接数える。
 */

export interface CategoryMemberSource {
  rankingKey: string;
  isActive?: boolean;
  categoryKey?: string | null;
  additionalCategories?: readonly string[] | null;
}

export interface MissingCategoryMember {
  categoryKey: string;
  rankingKey: string;
}

/** 有効な指標を、入っているべきカテゴリごとのキー集合にする */
export function expectedCategoryMembers(
  items: readonly CategoryMemberSource[],
): Map<string, Set<string>> {
  const expected = new Map<string, Set<string>>();
  for (const item of items) {
    if (item.isActive === false) continue;
    const categories = new Set<string>();
    if (item.categoryKey) categories.add(item.categoryKey);
    for (const extra of item.additionalCategories ?? []) categories.add(extra);
    for (const categoryKey of categories) {
      let keys = expected.get(categoryKey);
      if (!keys) expected.set(categoryKey, (keys = new Set()));
      keys.add(item.rankingKey);
    }
  }
  return expected;
}

/**
 * 入っているはずなのに一覧に無いキーを返す。
 * `actual` に無いカテゴリ (取得できなかった一覧) は、別の検査が取得失敗として扱うのでここでは数えない。
 */
export function findMissingCategoryMembers(
  items: readonly CategoryMemberSource[],
  actual: ReadonlyMap<string, ReadonlySet<string>>,
): MissingCategoryMember[] {
  const missing: MissingCategoryMember[] = [];
  for (const [categoryKey, keys] of expectedCategoryMembers(items)) {
    const have = actual.get(categoryKey);
    if (!have) continue;
    for (const rankingKey of keys) {
      if (!have.has(rankingKey)) missing.push({ categoryKey, rankingKey });
    }
  }
  return missing.sort(
    (a, b) => a.categoryKey.localeCompare(b.categoryKey) || a.rankingKey.localeCompare(b.rankingKey),
  );
}
