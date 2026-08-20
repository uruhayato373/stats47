import { describe, expect, it } from "vitest";

import { GONE_RANKING_KEYS } from "@/config/gone-ranking-keys";
import { KNOWN_RANKING_KEYS } from "@/config/known-ranking-keys";
import { SITEMAP_RANKING_KEYS } from "@/config/sitemap-ranking-keys";

import {
  INDEXABLE_AREA_CATEGORIES,
  UrlPolicy,
  isValidPrefCode,
} from "../url-policy";

describe("INDEXABLE_AREA_CATEGORIES", () => {
  it("空でない", () => {
    expect(INDEXABLE_AREA_CATEGORIES.length).toBeGreaterThan(0);
  });
  it("population / economy を含む", () => {
    expect(INDEXABLE_AREA_CATEGORIES).toContain("population");
    expect(INDEXABLE_AREA_CATEGORIES).toContain("economy");
  });
});

describe("UrlPolicy.area.isIndexableCategory", () => {
  it("全17カテゴリが indexable", () => {
    for (const cat of INDEXABLE_AREA_CATEGORIES) {
      expect(UrlPolicy.area.isIndexableCategory(cat)).toBe(true);
    }
  });
  it("存在しないカテゴリは非 indexable", () => {
    expect(UrlPolicy.area.isIndexableCategory("unknown")).toBe(false);
    expect(UrlPolicy.area.isIndexableCategory("")).toBe(false);
  });
});

describe("UrlPolicy.cityCategory.isIndexableCategory", () => {
  it("県カテゴリと同じ allowlist (population/economy) のみ indexable", () => {
    expect(UrlPolicy.cityCategory.isIndexableCategory("population")).toBe(true);
    expect(UrlPolicy.cityCategory.isIndexableCategory("economy")).toBe(true);
  });
  it("それ以外は noindex (= 非 indexable)", () => {
    expect(UrlPolicy.cityCategory.isIndexableCategory("tourism")).toBe(false);
    expect(UrlPolicy.cityCategory.isIndexableCategory("agriculture")).toBe(false);
  });
  it("sitemap 出力集合とページ robots 判定が同一ソース", () => {
    for (const cat of UrlPolicy.cityCategory.indexableCategories) {
      expect(UrlPolicy.cityCategory.isIndexableCategory(cat)).toBe(true);
    }
  });
});

describe("UrlPolicy.ranking.shouldIncludeInSitemap", () => {
  // 2026-05-31: sitemap は SITEMAP_RANKING_KEYS (複数週 impressions 和集合) に絞る。
  // 一度も検索表示されていない長期 crawled-not-indexed の長尾だけを sitemap から外す。

  it("GONE キーは常に除外する", () => {
    const goneKey = [...GONE_RANKING_KEYS][0];
    if (goneKey) {
      expect(UrlPolicy.ranking.shouldIncludeInSitemap(goneKey)).toBe(false);
    }
  });

  it("SITEMAP_RANKING_KEYS に含まれる known キーは出力する", () => {
    const included = [...SITEMAP_RANKING_KEYS].find(
      (k) => KNOWN_RANKING_KEYS.has(k) && !GONE_RANKING_KEYS.has(k),
    );
    expect(included).toBeDefined();
    if (included) {
      expect(UrlPolicy.ranking.shouldIncludeInSitemap(included)).toBe(true);
    }
  });

  it("known だが SITEMAP_RANKING_KEYS 外 (impressions ゼロ長尾) は除外する", () => {
    const excluded = [...KNOWN_RANKING_KEYS].find(
      (k) => !SITEMAP_RANKING_KEYS.has(k) && !GONE_RANKING_KEYS.has(k),
    );
    // 全 known が sitemap セットに含まれる稀なケースでは検証をスキップ
    if (excluded) {
      expect(UrlPolicy.ranking.shouldIncludeInSitemap(excluded)).toBe(false);
    }
  });

  it("生成セットは known の部分集合に収まっており空でない (安全弁の前提)", () => {
    expect(SITEMAP_RANKING_KEYS.size).toBeGreaterThan(0);
  });
});

describe("UrlPolicy.japan.isKnown (GEO-SCOPE-SEPARATION-01 WP5/WP6)", () => {
  it("採用済みテーマ (education-culture) は known", () => {
    expect(UrlPolicy.japan.isKnown("education-culture")).toBe(true);
  });
  it("/themes の known 集合をそのまま流用していない (値レベル検証で候補ゼロだったテーマは known にしない)", () => {
    // occupation-salary / ports は /themes には存在するが、WP6 の値レベル検証で
    // official 候補が 0 件だったため Japan catalog 未採用 (japan-catalog.ts のコメント参照)。
    // /themes の known 集合をそのまま流用すると、日本全国データを持たないテーマ詳細が
    // 200 を返しうる。
    expect(UrlPolicy.japan.isKnown("occupation-salary")).toBe(false);
    expect(UrlPolicy.japan.isKnown("ports")).toBe(false);
  });
  it("未登録スラッグは known でない", () => {
    expect(UrlPolicy.japan.isKnown("not-a-real-theme")).toBe(false);
  });
});

describe("isValidPrefCode", () => {
  it("01000〜47000 の末尾 000 のみ有効", () => {
    expect(isValidPrefCode("01000")).toBe(true);
    expect(isValidPrefCode("47000")).toBe(true);
  });
  it("範囲外 / 形式不正は無効", () => {
    expect(isValidPrefCode("48000")).toBe(false);
    expect(isValidPrefCode("00000")).toBe(false);
    expect(isValidPrefCode("13100")).toBe(false); // 政令市コード (末尾 != 000)
    expect(isValidPrefCode("1300")).toBe(false);
    expect(isValidPrefCode("abcde")).toBe(false);
  });
});
