import { test, expect } from "@playwright/test";

/**
 * ヘッダーナビゲーションのE2Eテスト
 *
 * ヘッダーのナビゲーションリンク（ランキング、ダッシュボード、ブログ）の
 * 遷移動作をテストします。
 */
test.describe("ヘッダーナビゲーション", () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にホームページに移動
    await page.goto("/");
  });

  test("ランキングリンクをクリックして遷移する", async ({ page }) => {
    // ランキングリンクを取得
    const rankingLink = page.getByRole("link", { name: "ランキング", exact: true });

    await expect(rankingLink).toHaveAttribute("href", "/ranking");

    // リンクをクリック
    await rankingLink.click();

    await expect(page).toHaveURL(/\/ranking/);

    // ページの主要要素が表示されていることを確認
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("都道府県リンクをクリックして遷移する", async ({ page }) => {
    const areasLink = page.getByRole("link", { name: "都道府県", exact: true });
    await expect(areasLink).toHaveAttribute("href", "/areas");
    await areasLink.click();
    await expect(page).toHaveURL(/\/areas/);
  });

  test("統計ブログリンクをクリックして遷移する", async ({ page }) => {
    // 統計ブログリンクを取得
    const blogLink = page.getByRole("link", { name: /統計ブログ/i });
    
    // href属性が正しいことを確認
    await expect(blogLink).toHaveAttribute("href", "/blog");
    
    // リンクをクリック
    await blogLink.click();
    
    // URLが/blogに遷移したことを確認
    await expect(page).toHaveURL(/\/blog/);
  });

  test("ロゴリンクをクリックしてホームに戻る", async ({ page }) => {
    await page.goto("/ranking");

    // ロゴリンクを取得（「統計で見る都道府県」テキストを含むリンク）
    const logoLink = page.getByRole("link", { name: "stats47 ホーム" });
    
    // href属性が正しいことを確認
    await expect(logoLink).toHaveAttribute("href", "/");
    
    // リンクをクリック
    await logoLink.click();
    
    // URLが/に遷移したことを確認
    await expect(page).toHaveURL("/");
  });

  test("各URLで現在地の青線は1項目だけに表示する", async ({ page }) => {
    const cases = [
      ["/ranking", "ランキング"],
      ["/category/laborwage", "カテゴリ"],
      ["/areas", "都道府県"],
      ["/themes", "テーマ"],
      ["/blog", "統計ブログ"],
    ] as const;

    for (const [path, label] of cases) {
      await page.goto(path);
      const activeItems = page
        .getByRole("banner")
        .locator('[data-active="true"]');

      await expect(activeItems).toHaveCount(1);
      await expect(activeItems).toContainText(label);
    }
  });
});
