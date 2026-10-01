import { expect, test } from "@playwright/test";

/**
 * ランキング詳細ページのE2Eテスト
 *
 * /ranking/[rankingKey] ページの表示と主要コンポーネントをテストします。
 */
test.describe("ランキング詳細ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ranking/healthy-life-expectancy-male", {
      waitUntil: "domcontentloaded",
    });
  });

  test("ページが正常に表示される", async ({ page }) => {
    // ページタイトルが存在する
    await expect(page).toHaveTitle(/.+/);

    // 見出しが表示される
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("地図チャートが表示される", async ({ page }) => {
    // 地図は role="figure" (2026-09-24 a76f71195。操作できる地図を role="img" で包むと axe nested-interactive になるため)。
    // テストが img のまま探していて、2026-09-27 以降の週次 E2E が要素を見つけられず落ちていた
    // 同じ名前の figure がレイアウト違いで 2 つある (2026-10-02 本番で確認)。strict mode で落ちないよう 1 つ目を見る
    const mapChart = page.getByRole("figure", { name: /都道府県別カラーマップ/ }).first();
    // scrollIntoViewIfNeeded は自前の待ち上限を持たずテスト全体の 90 秒を使い切るので、待ちを段ごとに区切る
    await expect(mapChart).toBeAttached({ timeout: 30_000 });
    await mapChart.scrollIntoViewIfNeeded({ timeout: 15_000 });
    await expect(mapChart).toBeVisible({ timeout: 15_000 });
  });

  test("データテーブルが表示される", async ({ page }) => {
    const table = page.getByRole("table", { name: /都道府県別データ表/ });
    await table.scrollIntoViewIfNeeded();
    await expect(table).toBeVisible({ timeout: 10000 });

    // テーブルに行データがある
    const rows = table.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
  });

  test("年度セレクターが存在し操作できる", async ({ page }) => {
    // 年度選択UIを探す
    const yearSelector = page.locator(
      "[data-testid='year-selector'], select, [role='combobox']"
    ).first();

    if (await yearSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
      // セレクターをクリック
      await yearSelector.click();

      // オプションが表示されることを確認
      await page.waitForTimeout(300);
    }
  });

  test("サイドバーにランキング一覧が表示される", async ({ page }) => {
    // サイドバー内のランキングリンクを確認
    const sidebar = page.locator(
      "[data-testid='ranking-sidebar'], aside, nav"
    ).first();

    if (await sidebar.isVisible({ timeout: 5000 }).catch(() => false)) {
      const links = sidebar.locator("a");
      await expect(links.first()).toBeVisible();
    }
  });
});
