/**
 * 本文への広告の段の差し込み (injectAdRows) のテスト (2026-11-03・2026-11-12 に位置を等間隔へ変えた)。
 *
 * 位置計算・手で置いた広告の尊重・見出し不足のときの段の減らし方が絡み、目視では退行を検知できない。
 * 配置の正本: data/ads/placements.json の blog
 */
import { describe, expect, it } from "vitest";

import { injectAdRows } from "../../lib/ad-row-positions";

/** 見出しごとの本文の段落数 (1 段落 = 40 字) を指定して記事を作る */
function article(paragraphsPerSection: number[]): string {
  const parts = ["リード文の段落。"];
  paragraphsPerSection.forEach((count, i) => {
    parts.push(`## 見出し${i + 1}`);
    for (let p = 0; p < count; p++) parts.push("本".repeat(40));
  });
  return parts.join("\n\n");
}
const uniform = (h2Count: number) => article(Array.from({ length: h2Count }, () => 2));

const rowIndexBefore = (md: string, heading: string) => {
  const lines = md.split("\n");
  const at = lines.indexOf(heading);
  return lines.slice(0, at).reverse().find((line) => line.trim() !== "") ?? "";
};
const headingsWithRows = (md: string) =>
  md.split("\n").flatMap((line, i, lines) => {
    if (!line.startsWith("## ")) return [];
    const prev = lines.slice(0, i).reverse().find((l) => l.trim() !== "") ?? "";
    return prev.startsWith("<ad-row") ? [line.replace("## ", "")] : [];
  });

describe("injectAdRows", () => {
  it("段の数は h2 の本数で決まる (2 本で 1 段・4 本で 2 段・6 本以上で 3 段)", () => {
    expect(injectAdRows(uniform(1), 3)).not.toContain("<ad-row");
    for (const [h2, rows] of [[2, 1], [3, 1], [4, 2], [5, 2], [6, 3], [9, 3]]) {
      expect(injectAdRows(uniform(h2), 3).split("<ad-row").length - 1, `h2 ${h2} 本`).toBe(rows);
    }
  });

  it("段の番号を上から順に振り、1 番目の h2 の前には置かない", () => {
    const out = injectAdRows(uniform(8), 3);
    expect(rowIndexBefore(out, "## 見出し1")).toBe("リード文の段落。");
    const order = [...out.matchAll(/<ad-row index="(\d)">/g)].map((m) => Number(m[1]));
    expect(order).toEqual([0, 1, 2]);
  });

  it("見出しの長さが同じなら、本文をほぼ等分する位置に置く", () => {
    // 見出し 8 本・各 2 段落: 本文を 4 等分した点は見出し 3・5・7 の手前 (旧ルールは 2・4・6 で前に寄っていた)
    expect(headingsWithRows(injectAdRows(uniform(8), 3))).toEqual(["見出し3", "見出し5", "見出し7"]);
  });

  it("見出しの間の文章が長い記事でも、旧の 2・4・6 番目より間隔が揃う (2026-11-12 の動機)", () => {
    // 見出し 2 の節だけが極端に長い記事。旧ルールは見出し 2 と 4 の前に置き、その間が空いた
    const md = article([1, 1, 12, 1, 1, 1]);
    const rows = headingsWithRows(injectAdRows(md, 3));
    expect(rows).toHaveLength(3);
    // 長い節 (見出し 3) の手前と直後に段が入り、長い節の前後で広告が途切れない
    expect(rows).toContain("見出し3");
    expect(rows).toContain("見出し4");
  });

  it("段の数の上限を守る", () => {
    expect(injectAdRows(uniform(8), 1).split("<ad-row").length - 1).toBe(1);
    expect(injectAdRows(uniform(8), 0)).toBe(uniform(8));
  });

  it.each(["<ad-slot></ad-slot>", '<affiliate-banner src="x"></affiliate-banner>', '<affiliate-text index="0"></affiliate-text>'])(
    "手で広告を置いた記事は触らない: %s",
    (tag) => {
      const md = `${uniform(6)}\n\n${tag}`;
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
