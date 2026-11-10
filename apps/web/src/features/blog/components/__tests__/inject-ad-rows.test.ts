/**
 * 本文への広告の段の差し込み (injectAdRows) のテスト (2026-11-03)。
 *
 * 位置計算・手で置いた広告の尊重・見出し不足のときの段の減らし方が絡み、目視では退行を検知できない。
 * 配置の正本: data/ads/placements.json の blog
 */
import { describe, expect, it } from "vitest";

import { injectAdRows } from "../../lib/ad-row-positions";

/** h2 を n 個持つ記事本文を作る。 */
function article(h2Count: number): string {
  const parts = ["リード文の段落。"];
  for (let i = 1; i <= h2Count; i++) {
    parts.push(`## 見出し${i}`, `本文${i}の段落。`);
  }
  return parts.join("\n\n");
}

const rowIndexBefore = (md: string, heading: string) => {
  const lines = md.split("\n");
  const at = lines.indexOf(heading);
  return lines.slice(0, at).reverse().find((line) => line.trim() !== "") ?? "";
};

describe("injectAdRows", () => {
  it("h2 の 2・4・6 番目の直前に、段の番号を順に振って差し込む", () => {
    const out = injectAdRows(article(8), 3);
    expect(rowIndexBefore(out, "## 見出し2")).toBe('<ad-row index="0"></ad-row>');
    expect(rowIndexBefore(out, "## 見出し4")).toBe('<ad-row index="1"></ad-row>');
    expect(rowIndexBefore(out, "## 見出し6")).toBe('<ad-row index="2"></ad-row>');
    expect(out.split("<ad-row").length - 1).toBe(3);
  });

  it("見出しが足りない記事は段を減らす (1 番目の h2 の前には置かない)", () => {
    expect(injectAdRows(article(1), 3)).not.toContain("<ad-row");
    const out = injectAdRows(article(4), 3);
    expect(out.split("<ad-row").length - 1).toBe(2);
    expect(rowIndexBefore(out, "## 見出し1")).toBe("リード文の段落。");
  });

  it("段の数の上限を守る", () => {
    expect(injectAdRows(article(8), 1).split("<ad-row").length - 1).toBe(1);
    expect(injectAdRows(article(8), 0)).toBe(article(8));
  });

  it.each(["<ad-slot></ad-slot>", '<affiliate-banner src="x"></affiliate-banner>', '<affiliate-text index="0"></affiliate-text>'])(
    "手で広告を置いた記事は触らない: %s",
    (tag) => {
      const md = `${article(6)}\n\n${tag}`;
      expect(injectAdRows(md, 3)).toBe(md);
    },
  );

  it("コードフェンスの中の \"## \" は見出しに数えない", () => {
    const md = ["リード", "```", "## コード内", "```", "## 見出し1", "本文", "## 見出し2", "本文"].join("\n");
    const out = injectAdRows(md, 3);
    expect(out.split("<ad-row").length - 1).toBe(1);
    expect(rowIndexBefore(out, "## 見出し2")).toBe('<ad-row index="0"></ad-row>');
  });
});
