/**
 * KDP 出品内容 (`.claude/config/kdp-listings.json`) の不変量。
 *
 * ★守りたいのは 1 つ: **読者が読む文章に社内の言葉を出さない**。
 *   2026-08-12 に実測したところ、紹介文が `concept` + `newContentNote` の素の連結で、
 *   Amazon の商品ページに次のような文が出る状態だった:
 *
 *     「詳細な全指標データ (Excel/PowerPoint) はココナラ商品 P-02 へ誘導するファネル。」
 *
 *   「P-02」は社内の商品 ID で読者には通じず、「ファネル」は売り手の用語。公開してからの
 *   修正は反映に時間がかかるので、出す前に機械で止める。
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const LISTINGS = join(REPO_ROOT, ".claude/config/kdp-listings.json");

interface Listing {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly priceYen: number;
  readonly epubPath: string;
}

function load(): Listing[] {
  const doc = JSON.parse(readFileSync(LISTINGS, "utf8")) as { listings: Record<string, Listing> };
  return Object.values(doc.listings);
}

/** 読者向けの文章に出てはいけない社内の言葉。 */
const INTERNAL_MARKERS: ReadonlyArray<readonly [RegExp, string]> = [
  [/P-\d{2}/, "社内の商品 ID (P-02 等)"],
  [/ファネル/, "売り手の用語「ファネル」"],
  [/へ誘導/, "売り手の用語「誘導」"],
  [/最激戦|競合\s*\(/, "競合分析のメモ"],
  [/上位5\+下位5/, "実装メモの記法"],
  [/S1-S3|K-S\d-\d\d/, "社内の書籍 ID"],
  [/観測値から生成/, "実装の言い回し"],
];

describe("kdp-listings — ★読者が読む文章に社内の言葉を出さない", () => {
  const rows = load();

  it("32 冊すべてが読み込める", () => {
    expect(rows.length).toBeGreaterThanOrEqual(32);
  });

  for (const [re, label] of INTERNAL_MARKERS) {
    it(`紹介文に ${label} を含まない`, () => {
      const bad = rows.filter((r) => re.test(r.description)).map((r) => r.id);
      expect(bad).toEqual([]);
    });
  }

  it("タイトルにも社内の言葉を含まない", () => {
    const bad = rows.filter((r) => INTERNAL_MARKERS.some(([re]) => re.test(r.title))).map((r) => r.id);
    expect(bad).toEqual([]);
  });

  it("紹介文が出典と免責に触れている (誤認防止は必須)", () => {
    // 「e-Stat の公認・推奨を示すものではない」は data-provenance-standards の要求。
    const bad = rows.filter((r) => !r.description.includes("e-Stat") || !r.description.includes("公認")).map((r) => r.id);
    expect(bad).toEqual([]);
  });

  it("紹介文が短すぎない (商品ページとして成立する長さ)", () => {
    const bad = rows.filter((r) => r.description.replace(/\s/g, "").length < 200).map((r) => r.id);
    expect(bad).toEqual([]);
  });
});
