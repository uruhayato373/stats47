import { expect, test } from "@playwright/test";

/**
 * breakpoint 別レイアウト検証（本番スモーク）
 *
 * playwright.smoke.config.ts の responsive-* projects (375 / 768 / 1024 / 1280) で
 * 同一 spec を 4 viewport 実行し、PageShell のレイアウト契約を機械検証する:
 *
 *   1. 横スクロールが発生しない（breakpoint 崩れの最頻出症状）
 *   2. h1 が表示される
 *   3. 右レール契約: ranking / blog 詳細は rightRailBreakpoint="lg" (1024px) で
 *      本文カラムが縮む（レール 360px + gap が確保される）。lg 未満は 1 カラム。
 *
 * 背景 (2026-07-03 運営総点検): 従来の Playwright は Desktop Chrome 単一で
 * breakpoint 別の表示検証がゼロだった。ranking と blog のサイドバー breakpoint
 * 不統一 (xl vs lg) も機械検出できなかったため、レール契約をテストとして固定する。
 * 正典: docs/01_技術設計/04_デザインシステム.md / PageShell.tsx
 */

const LG_BREAKPOINT = 1024;

/** 右レールを持つ代表ページ（rightRailBreakpoint="lg" 契約の検証対象） */
const RAIL_PAGES = [
  { name: "ranking詳細", path: "/ranking/total-population" },
  { name: "blog詳細", path: "/blog/noodle-consumption-prefecture-character" },
];

/** レール契約は問わないが「崩れない」ことを検証する代表ページ */
const LAYOUT_PAGES = [
  { name: "ホーム", path: "/" },
  { name: "カテゴリ", path: "/category/population" },
  { name: "都道府県詳細", path: "/areas/01000" },
  // テーマページは client fetch のチャートを多数積むため崩れやすい (2026-08-04 の重なり不具合)
  { name: "テーマ", path: "/themes/population-dynamics" },
];

async function assertNoHorizontalScroll(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  // 1px はスクロールバー等の誤差として許容
  expect(overflow, "横スクロールが発生している (breakpoint 崩れ)").toBeLessThanOrEqual(1);
}

test.describe("breakpoint 別レイアウト", () => {
  for (const target of [...RAIL_PAGES, ...LAYOUT_PAGES]) {
    test(`${target.name} (${target.path}) が崩れず表示される`, async ({ page }) => {
      await page.goto(target.path, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({
        timeout: 15_000,
      });
      await assertNoHorizontalScroll(page);
    });
  }

  for (const target of RAIL_PAGES) {
    test(`${target.name} の右レール契約 (lg=1024px で本文カラムが縮む)`, async ({ page }) => {
      const viewport = page.viewportSize();
      test.skip(!viewport, "viewport 未定義");
      const width = viewport?.width ?? 0;

      await page.goto(target.path, { waitUntil: "domcontentloaded" });
      // app/layout.tsx が全幅の外側 <main> を持つため、ページ内側の <main>
      // (PageShell の grid カラム内・ranking/blog 双方に存在) を "main main" で選択する。
      // .first() だと外側 main (常に 100% 幅) を掴み契約検証にならない (2026-07-03 初回 CI 実測)。
      const main = page.locator("main main").first();
      await expect(main).toBeVisible({ timeout: 15_000 });
      const box = await main.boundingBox();
      expect(box, "main の boundingBox が取得できない").not.toBeNull();
      const ratio = (box?.width ?? 0) / width;

      if (width >= LG_BREAKPOINT) {
        // 右レール (360px + gap 32px) が表示され本文カラムが縮むこと。
        // 1024px 時: 本文 ≈ 584/1024 ≈ 0.57、1280px 時: ≈ 840/1280 ≈ 0.66
        expect(
          ratio,
          `lg+ (${width}px) なのに本文カラムが全幅 (${Math.round(ratio * 100)}%) = 右レール未表示`,
        ).toBeLessThan(0.8);
      } else {
        // lg 未満は 1 カラム (本文がほぼ全幅)
        expect(
          ratio,
          `lg 未満 (${width}px) なのに本文カラムが縮んでいる (${Math.round(ratio * 100)}%)`,
        ).toBeGreaterThan(0.85);
      }
    });
  }
});
