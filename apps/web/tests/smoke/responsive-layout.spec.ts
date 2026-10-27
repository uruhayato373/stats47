import { expect, test } from "@playwright/test";

/**
 * breakpoint 別レイアウト検証（本番スモーク）
 *
 * playwright.smoke.config.ts の responsive-* projects (375 / 768 / 1024 / 1280) で
 * 同一 spec を 4 viewport 実行し、PageShell のレイアウト契約を機械検証する:
 *
 *   1. 横スクロールが発生しない（breakpoint 崩れの最頻出症状）
 *   2. h1 が表示される
 *   3. 右レール契約: ranking / blog 詳細は shell コンテナ (@container/shell) の幅が
 *      988px 以上で本文カラムが縮む（レール 316px + gap 16px）。988px 未満は 1 カラム。
 *      境界はビューポートではなくコンテナ幅なので、サイドバーの開閉 (lg 以上で 256px)
 *      を含めた実測のコンテナ幅で判定する (2026-10-27 にサイドバー型の骨組みへ移行)。
 *
 * 背景 (2026-07-03 運営総点検): 従来の Playwright は Desktop Chrome 単一で
 * breakpoint 別の表示検証がゼロだった。ranking と blog のサイドバー breakpoint
 * 不統一 (xl vs lg) も機械検出できなかったため、レール契約をテストとして固定する。
 * 正典: docs/01_技術設計/04_デザインシステム.md / PageShell.tsx
 */

/** 右レールが出る shell コンテナの幅 (PageShell.tsx の RIGHT_RAIL_GRID_CLASS と同値) */
const RIGHT_RAIL_CONTAINER_WIDTH = 988;

/** 右レールを持つ代表ページ（右レール契約の検証対象） */
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
    test(`${target.name} の右レール契約 (shell 988px で本文カラムが縮む)`, async ({ page }) => {
      await page.goto(target.path, { waitUntil: "domcontentloaded" });
      // ページで唯一の <main> はルートレイアウトが持ち、Shell の本文列は
      // div[data-slot=shell-main] で描く。本文列と、それを囲む shell コンテナの幅を比べる。
      const shellMain = page.locator('[data-slot="shell-main"]').first();
      await expect(shellMain).toBeVisible({ timeout: 15_000 });
      await expect(page.locator("main")).toHaveCount(1);
      const widths = await shellMain.evaluate((el) => {
        const shell = el.closest('[class*="@container/shell"]');
        return {
          main: el.getBoundingClientRect().width,
          shell: shell?.getBoundingClientRect().width ?? 0,
        };
      });
      expect(widths.shell, "shell コンテナが見つからない").toBeGreaterThan(0);
      const ratio = widths.main / widths.shell;

      if (widths.shell >= RIGHT_RAIL_CONTAINER_WIDTH) {
        // 右レール (316px + gap 16px) が表示され本文カラムが縮むこと。
        // shell 988px 時: 本文 656/988 ≈ 0.66、1280px 時: 948/1280 ≈ 0.74
        expect(
          ratio,
          `shell ${Math.round(widths.shell)}px なのに本文カラムが全幅 (${Math.round(ratio * 100)}%) = 右レール未表示`,
        ).toBeLessThan(0.8);
      } else {
        // 988px 未満は 1 カラム (本文がコンテナの全幅)
        expect(
          ratio,
          `shell ${Math.round(widths.shell)}px なのに本文カラムが縮んでいる (${Math.round(ratio * 100)}%)`,
        ).toBeGreaterThan(0.95);
      }
    });
  }
});
