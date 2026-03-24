import { expect, test } from "@playwright/test";

/**
 * ブログ記事詳細ページのE2Eテスト
 *
 * /blog/[slug] ページの表示と主要コンポーネントをテストします。
 */
test.describe("ブログ記事詳細ページ", () => {
  test.beforeEach(async ({ page }) => {
    // 一覧ページから最初の記事へ遷移
    await page.goto("/blog", { waitUntil: "domcontentloaded" });

    const firstArticle = page.locator("a[href^='/blog/']").first();
    await expect(firstArticle).toBeVisible({ timeout: 10000 });

    const href = await firstArticle.getAttribute("href");
    if (href) {
      await page.goto(href);
    }
  });

  test("記事タイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("記事本文エリアが存在する", async ({ page }) => {
    // ArticleRenderer が出力する article 要素またはメインコンテンツ領域
    const articleBody = page.locator(
      "article, [class*='prose'], [class*='article'], [class*='Article']"
    ).first();

    await expect(articleBody).toBeVisible({ timeout: 10000 });
  });

  test("パンくずナビが表示され、ブログ一覧に戻れる", async ({ page }) => {
    // パンくずナビ内の「ブログ」リンク
    const breadcrumbBlogLink = page
      .locator("nav[aria-label='breadcrumb'] a, ol a")
      .filter({ hasText: "ブログ" })
      .first();

    await expect(breadcrumbBlogLink).toBeVisible({ timeout: 5000 });

    // 「ブログ」リンクをクリック
    await breadcrumbBlogLink.click();

    // 一覧ページに戻ったことを確認
    await expect(page).toHaveURL(/\/blog$/);
  });
});
