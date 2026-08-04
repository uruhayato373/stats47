/**
 * 本文への広告挿入 (injectAffiliateUnits) のテスト。
 *
 * 位置計算・ad-slot 衝突回避・在庫不足時の抑制が絡み、目視では退行を検知できない。
 * 仕様の正典: .claude/rules/affiliate-ads-standards.md §12 「枠の拡張」
 */
import { describe, expect, it } from "vitest";

import { injectAffiliateUnits } from "../md-content";

/** h2 を n 個持つ記事本文を作る。 */
function article(h2Count: number): string {
  const parts = ["リード文の段落。"];
  for (let i = 1; i <= h2Count; i++) {
    parts.push(`## 見出し${i}`, `本文${i}の段落。`);
  }
  return parts.join("\n\n");
}

const countTag = (md: string, tag: string) => md.split(`<${tag}`).length - 1;

describe("injectAffiliateUnits", () => {
  it("text 版は本文にテキストリンクを最大 3 本入れる", () => {
    const out = injectAffiliateUnits(article(8), { textCount: 4, bannerCount: 4, format: "text" });
    expect(countTag(out, "affiliate-text")).toBe(3);
  });

  it("banner 版は本文にバナーを入れ、テキストは入れない", () => {
    const out = injectAffiliateUnits(article(8), { textCount: 4, bannerCount: 4, format: "banner" });
    expect(countTag(out, "affiliate-text")).toBe(0);
    // 本文 3 + 末尾 1
    expect(countTag(out, "affiliate-banner")).toBe(4);
  });

  it("記事末尾は format に関わらず常にバナー", () => {
    for (const format of ["text", "banner"] as const) {
      const out = injectAffiliateUnits(article(8), { textCount: 4, bannerCount: 4, format });
      expect(out.trimEnd().endsWith("</affiliate-banner>"), `${format} 版の末尾がバナーでない`).toBe(true);
      expect(out).toContain('slot="end"');
    }
  });

  it("末尾バナーの index が本文で使った分の次を指す (同じ広告の重複を避ける)", () => {
    const banner = injectAffiliateUnits(article(8), { textCount: 4, bannerCount: 4, format: "banner" });
    // 本文で 0,1,2 を消費 → 末尾は 3
    expect(banner).toContain('<affiliate-banner index="3" slot="end">');
    // text 版は本文でバナーを使わないので末尾は 0
    const text = injectAffiliateUnits(article(8), { textCount: 4, bannerCount: 4, format: "text" });
    expect(text).toContain('<affiliate-banner index="0" slot="end">');
  });

  it("在庫が無ければ枠を作らない (空枠を残さない)", () => {
    const out = injectAffiliateUnits(article(8), { textCount: 0, bannerCount: 0, format: "text" });
    expect(countTag(out, "affiliate-text")).toBe(0);
    expect(countTag(out, "affiliate-banner")).toBe(0);
  });

  it("在庫が本文枠より少なければその分しか入れない", () => {
    const out = injectAffiliateUnits(article(8), { textCount: 2, bannerCount: 1, format: "text" });
    expect(countTag(out, "affiliate-text")).toBe(2);
    expect(countTag(out, "affiliate-banner")).toBe(1); // 末尾のみ
  });

  it("banner 版は末尾ぶん 1 件を残すので本文は bannerCount-1 まで", () => {
    const out = injectAffiliateUnits(article(8), { textCount: 4, bannerCount: 2, format: "banner" });
    expect(countTag(out, "affiliate-banner")).toBe(2); // 本文 1 + 末尾 1
  });

  it("h2 が少ない記事では入る本数も減る", () => {
    // h2 が 2 個なら 2 番目の h2 (index 1) の 1 箇所だけ
    const out = injectAffiliateUnits(article(2), { textCount: 4, bannerCount: 4, format: "text" });
    expect(countTag(out, "affiliate-text")).toBe(1);
  });

  it("手動で広告を配置した記事は一切触らない", () => {
    const manual = `${article(8)}\n\n<affiliate-text index="0"></affiliate-text>`;
    expect(injectAffiliateUnits(manual, { textCount: 4, bannerCount: 4, format: "text" })).toBe(manual);

    const manualBanner = `${article(8)}\n\n<affiliate-banner src="x.png"></affiliate-banner>`;
    expect(injectAffiliateUnits(manualBanner, { textCount: 4, bannerCount: 4, format: "banner" })).toBe(
      manualBanner,
    );
  });

  it("既存の ad-slot と隣接しないよう挿入位置をずらす", () => {
    // 2 番目の h2 の直前に ad-slot がある記事
    const md = [
      "リード。",
      "## 見出し1",
      "本文1。",
      "<ad-slot></ad-slot>",
      "## 見出し2",
      "本文2。",
      "## 見出し3",
      "本文3。",
      "## 見出し4",
      "本文4。",
    ].join("\n\n");
    const out = injectAffiliateUnits(md, { textCount: 4, bannerCount: 0, format: "text" });
    const lines = out.split("\n");
    const adSlotLine = lines.findIndex((l) => l.includes("<ad-slot"));
    const firstAffiliate = lines.findIndex((l) => l.includes("<affiliate-text"));
    // 広告が連続して並ばないこと (間に 1 行以上のコンテンツがある)
    expect(Math.abs(firstAffiliate - adSlotLine)).toBeGreaterThan(2);
  });

  it("コードフェンス内の ## を見出しと誤認しない", () => {
    const md = ["リード。", "```", "## これはコード", "```", "## 本物の見出し1", "本文。", "## 本物の見出し2", "本文。"].join(
      "\n\n",
    );
    const out = injectAffiliateUnits(md, { textCount: 4, bannerCount: 0, format: "text" });
    // 見出しは 2 個 → 2 番目の直前に 1 本だけ
    expect(countTag(out, "affiliate-text")).toBe(1);
    // コードフェンス内は壊さない
    expect(out).toContain("## これはコード");
  });
});
