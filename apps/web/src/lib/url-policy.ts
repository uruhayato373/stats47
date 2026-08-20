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
import { KNOWN_JAPAN_SLUGS } from "@/config/known-japan-slugs";
import { KNOWN_RANKING_KEYS } from "@/config/known-ranking-keys";
import { KNOWN_TAG_KEYS } from "@/config/known-tag-keys";
import { KNOWN_THEME_SLUGS } from "@/config/known-theme-slugs";
import { SITEMAP_RANKING_KEYS } from "@/config/sitemap-ranking-keys";
import { UNPUBLISHED_BLOG_SLUGS } from "@/config/unpublished-blog-slugs";

/**
 * インデックス対象のエリア×カテゴリ（都道府県レベル）。
 * middleware（200 で返す）と sitemap（出力する）で完全一致させる。
 *
 * 2026-06-02 全17カテゴリに拡張:
 *   page_components が全カテゴリ設定済み（各9〜21コンポーネント）のため
 *   thin content 懸念なし。47×17=799 URL を sitemap/indexing 対象に追加。
 *   city-category は municipality×category で規模が大きいため population/economy 維持。
 */
export const INDEXABLE_AREA_CATEGORIES = [
  "population",
  "economy",
  "laborwage",
  "construction",
  "landweather",
  "socialsecurity",
  "energy",
  "tourism",
  "administrativefinancial",
  "agriculture",
  "commercial",
  "educationsports",
  "ict",
  "infrastructure",
  "international",
  "miningindustry",
  "safetyenvironment",
] as const;

const INDEXABLE_AREA_CATEGORIES_SET = new Set<string>(
  INDEXABLE_AREA_CATEGORIES,
);

/**
 * city-category (/areas/{pref}/cities/{city}/{cat}) のインデックス対象。
 * municipality × category は規模が大きいため population/economy に限定維持（2026-06-01 決定）。
 */
const INDEXABLE_CITY_CATEGORIES = ["population", "economy"] as const;
const INDEXABLE_CITY_CATEGORIES_SET = new Set<string>(INDEXABLE_CITY_CATEGORIES);

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
  /**
   * city-category (/areas/{pref}/cities/{city}/{category})。
   * municipality×category は規模が大きいため population/economy に限定（2026-06-01 決定）。
   * sitemap も indexableCategories のみ出力し、ページの robots 判定と完全一致させる。
   */
  cityCategory: {
    indexableCategories: INDEXABLE_CITY_CATEGORIES,
    isIndexableCategory: (cat: string): boolean =>
      INDEXABLE_CITY_CATEGORIES_SET.has(cat),
  },
  ranking: {
    isKnown: (key: string): boolean => KNOWN_RANKING_KEYS.has(key),
    isGone: (key: string): boolean => GONE_RANKING_KEYS.has(key),
    isIndexable: (key: string): boolean => INDEXABLE_RANKING_KEYS.has(key),
    /**
     * sitemap 出力対象判定 (2026-05-31 改訂):
     *   削除済みでなく、known（200 を返す）かつ SITEMAP_RANKING_KEYS に含まれるキー。
     *
     * SITEMAP_RANKING_KEYS は「複数週 GSC impressions の和集合 + 既存 INDEXABLE」で、
     * 過去に検索表示された実績がある（= indexed 済みの可能性が高い）キーを保守的に拾う。
     * 一度も impressions を得ていない長期 crawled-not-indexed の長尾だけを sitemap から外し、
     * クロール予算を温存して「未登録」滞留を減らす。
     *
     * 2026-05-05 の失敗（単一週 Impressions≥1 = 338 件に絞り 1,584 件が消えてインデックス
     * 大量削除）を回避するため、(a) 単一週でなく全週和集合、(b) 既存 INDEXABLE を内包、
     * (c) 生成セットが空なら KNOWN 全件にフォールバック、の三重の安全弁を持つ。
     * 再生成: node .claude/scripts/gsc/build-sitemap-ranking-keys.cjs
     */
    shouldIncludeInSitemap: (key: string): boolean => {
      if (GONE_RANKING_KEYS.has(key)) return false;
      if (!KNOWN_RANKING_KEYS.has(key)) return false;
      // 安全弁: 生成失敗等で空なら現行挙動 (KNOWN 全件) にフォールバック
      if (SITEMAP_RANKING_KEYS.size === 0) return true;
      return SITEMAP_RANKING_KEYS.has(key);
    },
  },
  tag: {
    isKnown: (key: string): boolean => KNOWN_TAG_KEYS.has(key),
    isGone: (key: string): boolean => GONE_TAG_KEYS.has(key),
  },
  theme: {
    isKnown: (slug: string): boolean => KNOWN_THEME_SLUGS.has(slug),
  },
  /**
   * `/japan/<slug>` — 日本全国値のみを扱う面 (GEO-SCOPE-SEPARATION-01)。
   * `/themes/*` (47都道府県比較) とは別のデータ契約・別の known 集合を持つ。
   * 混同しないよう `theme.isKnown` を流用せず独立の判定を持つ。
   */
  japan: {
    isKnown: (slug: string): boolean => KNOWN_JAPAN_SLUGS.has(slug),
  },
  blog: {
    isGone: (slug: string): boolean => GONE_BLOG_SLUGS.has(slug),
    /**
     * 未公開 (published:false) の記事。恒久削除 (isGone) とは別概念で、
     * R2 blog snapshot から自動生成される (再公開すれば自動的に外れる)。
     * middleware で前段短絡しないと OpenNext が焼き付けた notFound prerender が
     * HTTP 200 +「記事が見つかりません」として永久配信される (2026-07-24 実測)。
     */
    isUnpublished: (slug: string): boolean => UNPUBLISHED_BLOG_SLUGS.has(slug),
  },
} as const;
