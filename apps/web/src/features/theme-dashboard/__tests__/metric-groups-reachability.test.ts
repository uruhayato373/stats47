import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { THEME_CATALOGS } from "@stats47/data-configs/theme-catalog";
import { describe, expect, it } from "vitest";

/**
 * `metricGroups` を定義したテーマが、それを実際に描くページ経路に乗っているかの検査。
 *
 * ★2026-08-06 に踏んだ: local-finance に metricGroups を書いたが、このテーマだけ
 * bespoke ページ (`app/themes/local-finance/page.tsx`) を持っていて `[themeSlug]` →
 * ThemePageLayout → ThemeMetricsDashboard を通らないため、**設定が誰にも読まれない
 * dead config** になっていた。型検査も validator も通ってしまい、dev で実際に HTML を
 * 見て初めてタイルが 0 枚だと分かった。
 *
 * 同じ形の失敗は今日 1 度目撃している (`MetricConfig.tags` が 2,295 config すべてで
 * 未記入のまま型・builder・描画だけ揃っていた)。「宣言されているが誰も読まない SSOT」を
 * 機械で止める。
 *
 * bespoke ページの一覧はハードコードせず**ファイルシステムから導出**する
 * (新しい bespoke ページを足したら自動的に検査対象に入る)。
 */

const THEMES_DIR = path.resolve(__dirname, "../../../app/themes");

/** `app/themes/<slug>/page.tsx` を持つ = `[themeSlug]` を迂回する bespoke ページ */
function bespokeThemeSlugs(): string[] {
  return readdirSync(THEMES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "[themeSlug]")
    .filter((e) => existsSync(path.join(THEMES_DIR, e.name, "page.tsx")))
    .map((e) => e.name);
}

describe("metricGroups の到達性", () => {
  it("bespoke ページのテーマに metricGroups を定義しない (誰も読まない dead config になる)", () => {
    const bespoke = new Set(bespokeThemeSlugs());
    // 検査そのものが空振りしていないことを確かめる (bespoke が 0 件なら意味がない)
    expect(bespoke.size).toBeGreaterThan(0);

    const dead = Object.entries(THEME_CATALOGS)
      .filter(([key, c]) => bespoke.has(key) && (c.metricGroups?.length ?? 0) > 0)
      .map(([key]) => key);

    expect(dead).toEqual([]);
  });

  it("local-finance が bespoke ページとして検出できている (検査の前提の固定)", () => {
    expect(bespokeThemeSlugs()).toContain("local-finance");
  });
});
