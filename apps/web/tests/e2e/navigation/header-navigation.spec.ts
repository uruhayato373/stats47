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

  test("ランキングリンクをクリックして遷移する（/ranking 廃止後は /themes へ）", async ({ page }) => {
    // ランキングリンクを取得
    const rankingLink = page.getByRole("link", { name: /ランキング/i });

    // /ranking 一覧ページは 2026-05-28 に廃止。Header の「ランキング」ナビは /themes を指す。
    await expect(rankingLink).toHaveAttribute("href", "/themes");

    // リンクをクリック
    await rankingLink.click();

    // URL が /themes に遷移したことを確認
    await expect(page).toHaveURL(/\/themes/);

    // ページの主要要素が表示されていることを確認
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("ダッシュボードリンクをクリックして遷移する", async ({ page }) => {
    // ダッシュボードリンクを取得
    const dashboardLink = page.getByRole("link", { name: /ダッシュボード/i });
    
    // href属性が正しいことを確認
    await expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    
    // リンクをクリック
    await dashboardLink.click();
    
    // URLが/dashboardに遷移したことを確認
    await expect(page).toHaveURL(/\/dashboard/);
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
    // まずテーマページに移動 (旧 /ranking 一覧は 2026-05-28 に廃止)
    await page.goto("/themes");

    // ロゴリンクを取得（「統計で見る都道府県」テキストを含むリンク）
    const logoLink = page.getByRole("link", { name: /統計で見る都道府県/i });
    
    // href属性が正しいことを確認
    await expect(logoLink).toHaveAttribute("href", "/");
    
    // リンクをクリック
    await logoLink.click();
    
    // URLが/に遷移したことを確認
    await expect(page).toHaveURL("/");
  });
});
