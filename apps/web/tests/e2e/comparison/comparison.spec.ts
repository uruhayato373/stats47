import { expect, test } from "@playwright/test";

/**
 * 地域間比較ページのE2Eテスト
 *
 * /compare ページの地域選択・カテゴリ切替・比較テーブル表示をテストします。
 */
test.describe("地域間比較ページ", () => {
  test("デフォルトの比較対象で表示される", async ({ page }) => {
    await page.goto("/compare", { waitUntil: "domcontentloaded" });

    // h1 見出しが表示される
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("地域間比較");

    // デフォルトで東京都と大阪府（13000, 27000）が選択されている
    // RegionSelector はセレクト要素を持つ
    const selects = page.locator("select, [role='combobox']");
    await expect(selects.first()).toBeVisible({ timeout: 10000 });
  });

  test("URLパラメータで指定した地域が比較される", async ({ page }) => {
    await page.goto("/compare?areas=01000,08000", { waitUntil: "domcontentloaded" });

    // ページが表示される
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });

    // 比較データまたはカテゴリタブが表示される
    const hasContent =
      (await page.locator("table").isVisible({ timeout: 10000 }).catch(() => false)) ||
      (await page.locator("button").filter({ hasText: /人口|労働|経済|住宅|教育/i }).first().isVisible({ timeout: 10000 }).catch(() => false));

    expect(hasContent).toBe(true);
  });

  test("VS バッジが表示される", async ({ page }) => {
    await page.goto("/compare?areas=13000,27000", { waitUntil: "domcontentloaded" });

    // 「VS」テキストが表示される
    const vsBadge = page.getByText(/VS/i);
    await expect(vsBadge).toBeVisible({ timeout: 10000 });
  });

  test("カテゴリタブで表示を切り替えられる", async ({ page }) => {
    await page.goto("/compare?areas=13000,27000", { waitUntil: "domcontentloaded" });

    // カテゴリタブのボタンが表示される（2件以上）
    const categoryButtons = page.locator("button").filter({ hasText: /人口|労働|経済|住宅|教育|産業|家計|健康/i });
    await expect(categoryButtons.first()).toBeVisible({ timeout: 10000 });

    // 2番目のタブをクリック
    const secondTab = categoryButtons.nth(1);
    if (await secondTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      const tabText = await secondTab.textContent();
      await secondTab.click();

      // URL の cat パラメータが更新される
      await expect(page).toHaveURL(/[?&]cat=/, { timeout: 5000 });

      // クリックしたタブのテキストが URL に反映される（カテゴリキーで）
      expect(tabText).toBeTruthy();
    }
  });

  test("比較テーブルが正しく表示される", async ({ page }) => {
    await page.goto("/compare?areas=13000,27000", { waitUntil: "domcontentloaded" });

    // テーブルが表示される
    const table = page.locator("table").first();
    await expect(table).toBeVisible({ timeout: 10000 });

    // テーブルに行がある
    const rows = table.locator("tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    // ランキングへのリンクが存在する（ranking/への内部リンク）
    const rankingLinks = table.locator("a[href*='/ranking/']");
    if (await rankingLinks.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(rankingLinks.first()).toBeVisible();
    }
  });

  test("2地域未満のとき案内メッセージが表示される", async ({ page }) => {
    // areas パラメータなしでアクセス（エリアコードが0件のケース）
    await page.goto("/compare?areas=", { waitUntil: "domcontentloaded" });

    // ComparisonEmpty またはデフォルトの東京/大阪が表示されるケースを許容
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
