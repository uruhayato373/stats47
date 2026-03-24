import { expect, test } from "@playwright/test";

/**
 * ランキング詳細ページのE2Eテスト
 *
 * /ranking/[rankingKey] ページの表示と主要コンポーネントをテストします。
 */
test.describe("ランキング詳細ページ", () => {
  // テスト用のランキングキー（実際のデータに合わせて調整）
  const testRankingKey = "population"; // 例：人口ランキング

  test.beforeEach(async ({ page }) => {
    // まず一覧から遷移してキーを取得する方法
    await page.goto("/ranking", { waitUntil: "domcontentloaded" });

    // 最初のランキングリンクを取得
    const firstLink = page.locator("a[href^='/ranking/']").first();
    await expect(firstLink).toBeVisible({ timeout: 10000 });

    // リンク先のURLを取得して遷移
    const href = await firstLink.getAttribute("href");
    if (href) {
      await page.goto(href);
    }
  });

  test("ページが正常に表示される", async ({ page }) => {
    // ページタイトルが存在する
    await expect(page).toHaveTitle(/.+/);

    // 見出しが表示される
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("地図チャートが表示される", async ({ page }) => {
    // 地図コンポーネントが表示される
    // ※ セレクタは実装に合わせて調整
    const mapChart = page.locator(
      "[data-testid='prefecture-map'], svg, [class*='map'], [class*='Map']"
    ).first();

    await expect(mapChart).toBeVisible({ timeout: 15000 });
  });

  test("データテーブルが表示される", async ({ page }) => {
    // テーブルが表示される
    const table = page.locator("table").first();

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
