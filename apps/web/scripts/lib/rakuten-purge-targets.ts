/**
 * 楽天カタログ同期のあと、表示が変わりうるページだけを Workers Cache から消すための写像 (純粋関数)。
 *
 * 楽天カードを描画するのは次の 5 か所だけ (`__tests__/rakuten-purge-targets.test.ts` が固定する)。
 * - 家計調査系ランキング (本文中段 + 右レール): 品目の商品か 1 位県の返礼品
 * - ブログ: タイトル・副題から品目の商品か単一県の返礼品
 * - 県ページ・市区町村ページ: その県の返礼品
 *
 * CLI: apps/web/scripts/resolve-rakuten-purge-urls.ts
 */
import { fetchCities } from "@stats47/area";

import { resolveContentVertical } from "../../src/features/ads/constants/affiliate-category";
import {
  applyBlogAffiliatePolicy,
  BLOG_RAKUTEN_VERTICALS,
} from "../../src/features/ads/constants/blog-affiliate-policy";

export interface RakutenSnapshotChange {
  /** 表示が変わった `app/rakuten/furusato/<県コード>.json` の県コード */
  furusatoPrefCodes: readonly string[];
  /** 表示が変わった `app/rakuten/items/<品目>.json` の品目 */
  itemTerms: readonly string[];
}

export interface BlogIndexEntry {
  slug: string;
  published?: boolean;
  tags?: ReadonlyArray<{ tagKey: string }>;
  surveyIds?: readonly string[] | null;
}

/**
 * snapshot の表示内容が変わったか。`generatedAt` は毎回変わるので比べず、items だけを比べる。
 * previous が null (本番 R2 に無い = 新規) なら変化ありとする。
 */
export function isSnapshotContentChanged(previous: unknown, next: unknown): boolean {
  if (previous === null) return true;
  return JSON.stringify(itemsOf(previous)) !== JSON.stringify(itemsOf(next));
}

function itemsOf(snapshot: unknown): unknown {
  return snapshot !== null && typeof snapshot === "object" && "items" in snapshot
    ? (snapshot as { items: unknown }).items
    : snapshot;
}

/**
 * 変わった snapshot を表示しうるページのパス (重複なし・昇順)。何も変わっていなければ空。
 *
 * ランキングは 1 位県 (年と値で変わる) と品目で、ブログは索引に無い副題も使ってカードを選ぶため、
 * どの snapshot を読むかをここでは決めきれない。何か変わればその種類のページを全件にする (多めに消す側)。
 * 県・市区町村ページは自県の返礼品しか読まないので、変わった県だけにする。
 */
export function resolveRakutenPurgePaths({
  change,
  kakeiRankingKeys,
  blogs,
}: {
  change: RakutenSnapshotChange;
  kakeiRankingKeys: readonly string[];
  blogs: readonly BlogIndexEntry[];
}): string[] {
  if (change.furusatoPrefCodes.length === 0 && change.itemTerms.length === 0) return [];

  const paths = new Set<string>();
  for (const key of kakeiRankingKeys) paths.add(`/ranking/${key}`);

  for (const blog of blogs) {
    if (blog.published === false) continue;
    // ブログページと同じ解決 (記事明示policy → 出典調査 → タグ)。page.tsx の affiliateInput と揃える。
    const { vertical } = resolveContentVertical(
      applyBlogAffiliatePolicy(blog.slug, {
        surveyIds: blog.surveyIds ?? [],
        tagKeys: (blog.tags ?? []).map((tag) => tag.tagKey),
      }),
    );
    if (vertical && BLOG_RAKUTEN_VERTICALS.has(vertical)) paths.add(`/blog/${blog.slug}`);
  }

  const prefCodes = new Set(change.furusatoPrefCodes);
  for (const prefCode of prefCodes) paths.add(`/areas/${prefCode}`);
  // 政令指定都市・特別区の区は prefCode が親の市 (千代田区 13101 → 13100)。URL の親は常に県なので
  // もう 1 段たどる (url-policy.ts の prefectureCodeForCity と同じ規則)。直接比べると 194 区が漏れる。
  const cities = fetchCities();
  const cityByCode = new Map(cities.map((city) => [city.cityCode, city]));
  for (const city of cities) {
    const prefCode = prefCodes.has(city.prefCode) ? city.prefCode : cityByCode.get(city.prefCode)?.prefCode;
    if (prefCode && prefCodes.has(prefCode)) paths.add(`/areas/${prefCode}/cities/${city.cityCode}`);
  }

  return [...paths].sort();
}
