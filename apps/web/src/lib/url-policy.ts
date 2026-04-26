/**
 * UrlPolicy — URL の取り扱い方針の Single Source of Truth (Phase 9, 2026-04-26)
 *
 * middleware / sitemap.ts / page.tsx の **すべて** が本ファイルを参照する。
 * 個別の `KNOWN_*_KEYS` / `GONE_*_KEYS` / `INDEXABLE_*` を直接 import せず、
 * UrlPolicy 経由でアクセスすることで「ある URL の判定が複数箇所で乖離する」事故を防ぐ。
 *
 * 過去事故（2026-04-26 批判レビュー）:
 * - middleware は INDEXABLE_AREA_CATEGORIES = [population, economy] 両方を indexable 扱い
 * - sitemap は population のみに絞り込み
 * - → /areas/{prefCode}/economy が orphan page（存在するが sitemap で発見できない）
 *
 * ルール:
 * - 削除シグナルは 410（gone() で統一）
 * - 旧 URL → 新 URL の 301 はリダイレクト先が known の場合のみ
 *   リダイレクト先が unknown なら直接 410（301→410 チェーン回避）
 */

import { GONE_BLOG_SLUGS } from "@/config/gone-blog-slugs";
import { GONE_RANKING_KEYS } from "@/config/gone-ranking-keys";
import { GONE_TAG_KEYS } from "@/config/gone-tag-keys";
import { INDEXABLE_RANKING_KEYS } from "@/config/indexable-ranking-keys";
import { KNOWN_RANKING_KEYS } from "@/config/known-ranking-keys";
import { KNOWN_TAG_KEYS } from "@/config/known-tag-keys";
import { KNOWN_THEME_SLUGS } from "@/config/known-theme-slugs";

/**
 * インデックス対象のエリア×カテゴリ。
 * middleware（200 で返す）と sitemap（出力する）で完全一致させる。
 */
export const INDEXABLE_AREA_CATEGORIES = ["population", "economy"] as const;
export type IndexableAreaCategory = (typeof INDEXABLE_AREA_CATEGORIES)[number];

const INDEXABLE_AREA_CATEGORIES_SET = new Set<string>(
  INDEXABLE_AREA_CATEGORIES,
);

/**
 * 都道府県コード（01000〜47000）の妥当性判定。
 * 5 桁数字かつ prefNum 01〜47、末尾 `000` のみ有効。
 */
export function isValidPrefCode(code: string): boolean {
  if (!/^\d{5}$/.test(code)) return false;
  const prefNum = parseInt(code.slice(0, 2), 10);
  const suffix = code.slice(2);
  return prefNum >= 1 && prefNum <= 47 && suffix === "000";
}

export const UrlPolicy = {
  area: {
    indexableCategories: INDEXABLE_AREA_CATEGORIES,
    isIndexableCategory: (cat: string): boolean =>
      INDEXABLE_AREA_CATEGORIES_SET.has(cat),
    isValidPrefCode,
  },
  ranking: {
    isKnown: (key: string): boolean => KNOWN_RANKING_KEYS.has(key),
    isGone: (key: string): boolean => GONE_RANKING_KEYS.has(key),
    isIndexable: (key: string): boolean => INDEXABLE_RANKING_KEYS.has(key),
    /**
     * sitemap 出力対象判定: 削除済みでなく、かつ Impressions ≥ 1 がある ranking のみ。
     */
    shouldIncludeInSitemap: (key: string): boolean =>
      !GONE_RANKING_KEYS.has(key) && INDEXABLE_RANKING_KEYS.has(key),
  },
  tag: {
    isKnown: (key: string): boolean => KNOWN_TAG_KEYS.has(key),
    isGone: (key: string): boolean => GONE_TAG_KEYS.has(key),
  },
  theme: {
    isKnown: (slug: string): boolean => KNOWN_THEME_SLUGS.has(slug),
  },
  blog: {
    isGone: (slug: string): boolean => GONE_BLOG_SLUGS.has(slug),
  },
} as const;
