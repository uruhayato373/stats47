/**
 * ranking の sitemap lastmod の出所 (SITEMAP_RANKING_LASTMOD) の整合を守る (GSC-SITEMAP-LASTMOD-01)。
 *
 * 全キーが同じ日付 (旧 SITEMAP_BASELINE の一律日付) に戻ると、lastmod は実更新を表さなくなる。
 * 生成は .claude/scripts/gsc/build-sitemap-ranking-keys.cjs。
 */
import { describe, expect, it } from "vitest";

import { SITEMAP_RANKING_KEYS } from "../sitemap-ranking-keys";
import { SITEMAP_RANKING_LASTMOD } from "../sitemap-ranking-lastmod";

describe("SITEMAP_RANKING_LASTMOD", () => {
  it("掲載キー以外の日付を持たない", () => {
    const stray = [...SITEMAP_RANKING_LASTMOD.keys()].filter((k) => !SITEMAP_RANKING_KEYS.has(k));
    expect(stray).toEqual([]);
  });

  it("日付は YYYY-MM-DD の実在日で、未来の日付を含まない", () => {
    const today = new Date().toISOString().slice(0, 10);
    const bad = [...SITEMAP_RANKING_LASTMOD].filter(
      ([, day]) =>
        !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
        Number.isNaN(Date.parse(`${day}T00:00:00Z`)) ||
        day > today,
    );
    expect(bad).toEqual([]);
  });

  it("全キーが同じ日付ではない (実更新日が出所であることの確認)", () => {
    expect(new Set(SITEMAP_RANKING_LASTMOD.values()).size).toBeGreaterThan(1);
  });

  it("掲載キーの大半に日付がある (生成が空で終わっていない)", () => {
    expect(SITEMAP_RANKING_LASTMOD.size).toBeGreaterThanOrEqual(SITEMAP_RANKING_KEYS.size * 0.9);
  });
});
