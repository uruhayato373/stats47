/**
 * アフィリエイト広告コンポーネントの **impression 計装カバレッジ契約**。
 *
 * 背景 (2026-08-04): 広告を描画する 9 コンポーネントのうち AdImpressionTracker を通って
 * いたのは 2 系統だけで、NativeAffiliateRow / FurusatoNozeiCard / RakutenItemsCard /
 * VariantAdSlot(text variant) の 4 つは **クリックだけ送って impression を送っていなかった**。
 * 分子にクリックが入り分母に impression が入らないため CTR が系統的に歪み、数週間気づかれ
 * なかった (native 枠は blog / ranking / category / survey / tag / themes / home / compare と
 * ほぼ全ページ種別に出る)。
 *
 * 規約: **TrackedAffiliateLink を使うファイルは、AdImpressionTracker を直接使うか、
 * 計装済みコンポーネント (BannerAd / AffiliateTextAdList) に描画を委譲していること。**
 *
 * 手本: right-rail-banner-contract.test.ts (ソース文字列検査) +
 *       load-finance-cards.test.ts (readdirSync でディレクトリ列挙)
 * 正典: .claude/rules/analytics-event-standards.md
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

// vitest の cwd はモノレポ root なので、テストファイルからの相対で解決する
// (右レール契約テストと同じ考え方)。
const COMPONENTS_DIR = resolve(import.meta.dirname, "../components");

/** 計装済み = これらを描画すれば impression が送られる。 */
const INSTRUMENTED = ["BannerAd", "AffiliateTextAdList"];

/**
 * 規約の対象外。理由を必ず書くこと (無言の除外を増やさないため)。
 */
const EXEMPT: Record<string, string> = {
  "tracked-affiliate-link.tsx": "クリック計測プリミティブ自身。これを包む側が impression を持つ",
  "AdImpressionTracker.tsx": "impression 計測プリミティブ自身",
};

function listComponentFiles(): string[] {
  return readdirSync(COMPONENTS_DIR)
    .filter((f) => f.endsWith(".tsx"))
    .sort();
}

/** import 行を相対・絶対 alias の両形式で拾う (NativeAffiliateRow は絶対 alias)。 */
function usesSymbol(source: string, symbol: string): boolean {
  return new RegExp(`\\b${symbol}\\b`).test(source);
}

describe("広告コンポーネントの impression 計装カバレッジ", () => {
  const files = listComponentFiles();

  it("components ディレクトリを列挙できる", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files)("%s: クリック計測があれば impression 計測もある", (file) => {
    if (EXEMPT[file]) return;
    const source = readFileSync(join(COMPONENTS_DIR, file), "utf8");

    // クリック計測を持たない = 広告を描画していない (AdSense ラッパ等) → 対象外
    if (!usesSymbol(source, "TrackedAffiliateLink")) return;

    const direct = usesSymbol(source, "AdImpressionTracker");
    const delegated = INSTRUMENTED.some((c) => usesSymbol(source, c));

    expect(
      direct || delegated,
      `${file} は TrackedAffiliateLink でクリックを送るが impression を送っていない。` +
        `AdImpressionTracker で包むか、BannerAd / AffiliateTextAdList に描画を委譲すること。` +
        `(クリックだけ計測すると CTR の分母が欠け、A/B や枠別評価が不能になる)`,
    ).toBe(true);
  });

  it("2026-08-04 に是正した 4 コンポーネントが計装を維持している", () => {
    // 退行の直接検知。ここが落ちたら計装が剥がれている。
    for (const file of [
      "NativeAffiliateRow.tsx",
      "FurusatoNozeiCard.tsx",
      "RakutenItemsCard.tsx",
      "VariantAdSlot.tsx",
    ]) {
      const source = readFileSync(join(COMPONENTS_DIR, file), "utf8");
      const ok = usesSymbol(source, "AdImpressionTracker") || INSTRUMENTED.some((c) => usesSymbol(source, c));
      expect(ok, `${file} の impression 計装が失われている`).toBe(true);
    }
  });

  it("VariantAdSlot の text variant 分岐が AdImpressionTracker を直接持つ", () => {
    // BannerAd 委譲は banner variant 経路だけで、text variant は自前で包む必要がある。
    // 「BannerAd を import しているから OK」で見逃さないための個別検査。
    const source = readFileSync(join(COMPONENTS_DIR, "VariantAdSlot.tsx"), "utf8");
    expect(source).toContain("AdImpressionTracker");
  });
});
