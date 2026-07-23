import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

/**
 * home `/` のポータル構造を source レベルで検証する (仕様 §20 Home)。
 * DOM render は R2 依存 (FeaturedRankings / listLatestArticles) のため、hero 不在と
 * セクション順・単一 h1 の不変条件は page.tsx のソースで担保する。
 */
const PAGE = readFileSync(
  path.resolve(process.cwd(), "src/app/page.tsx"),
  "utf8",
);

describe("home page structure (portal)", () => {
  it("暗色 hero と hero 画像参照が存在しない", () => {
    expect(PAGE).not.toContain("hero-home");
    expect(PAGE).not.toContain("bg-slate-900");
    expect(PAGE).not.toContain("SHELL_WIDTH_CLASS");
    // oversized display 見出し (home hero の h1) が無い
    expect(PAGE).not.toMatch(/text-4xl|text-5xl/);
  });

  it("PageHeader (単一 h1) と HomeSearch から始まる", () => {
    expect(PAGE).toContain("PageHeader");
    expect(PAGE).toContain("HomeSearch");
    // PageHeader は 1 回だけ (ページ唯一の h1)
    const pageHeaderUses = PAGE.match(/<PageHeader/g) ?? [];
    expect(pageHeaderUses).toHaveLength(1);
  });

  it("発見セクションが仕様順で並ぶ", () => {
    const order = [
      "カテゴリから探す",
      "<FeaturedRankings limit",
      "知りたいことから探す",
      "都道府県から探す",
      "統計を読み解く",
    ];
    let cursor = -1;
    for (const marker of order) {
      const idx = PAGE.indexOf(marker);
      expect(idx, `${marker} が見つからない`).toBeGreaterThan(-1);
      expect(idx, `${marker} の順序が不正`).toBeGreaterThan(cursor);
      cursor = idx;
    }
  });

  it("force-dynamic を維持する (R2 runtime read)", () => {
    expect(PAGE).toContain('export const dynamic = "force-dynamic"');
  });
});
