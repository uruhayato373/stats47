import { expect, test } from "@playwright/test";

/**
 * 地域プロファイル詳細ページのE2Eテスト
 *
 * /areas/[areaCode] ページの表示・パンくず・主要導線をテストします。
 * 茨城県（08000）を固定のテスト対象とする。
 */
test.describe("地域プロファイル詳細ページ", () => {
  const testAreaCode = "08000"; // 茨城県

  test.beforeEach(async ({ page }) => {
    await page.goto(`/areas/${testAreaCode}`, { waitUntil: "domcontentloaded" });
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(page).toHaveURL(`/areas/${testAreaCode}`);

    // h1 に都道府県名が含まれる
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toContainText("茨城県");

    await expect(page).toHaveTitle(/茨城県/);
  });

  test("パンくずナビゲーションが正しく表示される", async ({ page }) => {
    const breadcrumb = page.locator("nav[aria-label='breadcrumb']");
    await expect(breadcrumb).toBeVisible({ timeout: 10000 });

    // 「ホーム」リンク
    const homeLink = breadcrumb.getByRole("link", { name: "ホーム" });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute("href", "/");

    // 「都道府県一覧」リンク
    const areasLink = breadcrumb.getByRole("link", { name: "都道府県一覧" });
    await expect(areasLink).toBeVisible();
    await expect(areasLink).toHaveAttribute("href", "/areas");

    // 現在ページ名（リンクではなくテキスト）
    await expect(breadcrumb.getByText("茨城県")).toBeVisible();
  });

  test("ランキングへの導線が表示される", async ({ page }) => {
    const rankingLinks = page.locator("main a[href^='/ranking/']");
    await expect(rankingLinks.first()).toBeVisible({ timeout: 15_000 });
  });

  test("他県との比較ページへ遷移できる", async ({ page }) => {
    const compareLink = page.getByRole("link", { name: "他県と比較" });
    await expect(compareLink).toHaveAttribute(
      "href",
      `/category/population/compare?areas=${testAreaCode}`
    );
    await compareLink.click();
    await expect(page).toHaveURL(/\/category\/population\/compare/, {
      timeout: 30_000,
    });
  });

  test("存在しないエリアコードで 404 が表示される", async ({ page }) => {
    const response = await page.goto("/areas/99999", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(410);
  });
});
