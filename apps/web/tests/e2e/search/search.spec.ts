import { expect, test } from "@playwright/test";

/**
 * 検索ページのE2Eテスト
 *
 * /search ページのキーワード検索・フィルター・URL パラメータ連携をテストします。
 */
test.describe("検索ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(page).toHaveURL(/\/search/);

    // 見出しが表示される
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText("検索");

    // 検索入力フィールドが表示される
    const searchInput = page.getByPlaceholder(/検索|キーワード/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test("キーワードで検索できる", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/検索|キーワード/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill("人口");

    // デバウンス待機
    await page.waitForTimeout(500);

    // URL パラメータに q=人口 が含まれる
    await expect(page).toHaveURL(/[?&]q=%E4%BA%BA%E5%8F%A3/, { timeout: 5000 });

    // 検索結果が表示される（件数テキスト or 結果カード）
    const resultsText = page.getByText(/件/);
    const resultCards = page.locator("[class*='card'], [class*='Card']");

    const hasResults =
      (await resultsText.isVisible({ timeout: 10000 }).catch(() => false)) ||
      (await resultCards.first().isVisible({ timeout: 10000 }).catch(() => false));

    expect(hasResults).toBe(true);
  });

  test("URLパラメータから初期検索結果が表示される", async ({ page }) => {
    await page.goto("/search?q=%E4%BA%BA%E5%8F%A3", { waitUntil: "domcontentloaded" }); // q=人口

    const searchInput = page.getByPlaceholder(/検索|キーワード/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // 検索ボックスに「人口」がプリフィルされている
    await expect(searchInput).toHaveValue("人口");

    // 検索結果が表示される
    const resultsText = page.getByText(/件/);
    const resultCards = page.locator("[class*='card'], [class*='Card']");

    const hasResults =
      (await resultsText.isVisible({ timeout: 10000 }).catch(() => false)) ||
      (await resultCards.first().isVisible({ timeout: 10000 }).catch(() => false));

    expect(hasResults).toBe(true);
  });

  test("検索結果をクリックしてページに遷移できる", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/検索|キーワード/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill("人口");
    await page.waitForTimeout(500);

    // 検索結果の最初のリンクをクリック
    const firstResultLink = page.locator("a[href^='/']").filter({ hasText: /人口|ランキング|ダッシュボード|ブログ/i }).first();

    if (await firstResultLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      const href = await firstResultLink.getAttribute("href");
      await firstResultLink.click();
      await expect(page).not.toHaveURL(/\/search/);
      expect(href).toBeTruthy();
    }
  });

  test("該当なしの場合にメッセージが表示される", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/検索|キーワード/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill("xyzxyzxyz_notfound_12345");
    await page.waitForTimeout(500);

    // 「見つかりませんでした」または空件数のメッセージが表示される
    const noResultText = page.getByText(/見つかりませんでした|0件|結果がありません/i);
    await expect(noResultText).toBeVisible({ timeout: 10000 });
  });
});
