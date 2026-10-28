import { test, expect, type Page } from "@playwright/test";

/**
 * サイト全体のナビ (サイドバー) の E2E テスト
 *
 * PC 幅 (1280px) ではサイドバーが常設で、lg (1024px) 未満では
 * ヘッダーの開閉ボタンで Sheet として開く。フッターにも同じ主要ナビがあるので、
 * リンクはサイドバー ([data-slot="sidebar"]) の中に絞って取る。
 */
const sidebar = (page: Page) => page.locator('[data-slot="sidebar"]');

test.describe("サイドバーナビゲーション", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // 各テスト前にホームページに移動
    await page.goto("/");
  });

  test("ランキングリンクをクリックして遷移する", async ({ page }) => {
    // ランキングリンクを取得
    const rankingLink = sidebar(page).getByRole("link", { name: "ランキング", exact: true });

    await expect(rankingLink).toHaveAttribute("href", "/ranking");

    // リンクをクリック
    await rankingLink.click();

    await expect(page).toHaveURL(/\/ranking/);

    // ページの主要要素が表示されていることを確認
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("都道府県リンクをクリックして遷移する", async ({ page }) => {
    const areasLink = sidebar(page).getByRole("link", { name: "都道府県", exact: true });
    await expect(areasLink).toHaveAttribute("href", "/areas");
    await areasLink.click();
    await expect(page).toHaveURL(/\/areas/);
  });

  test("サイドバーのテーマ一覧リンクから遷移する", async ({ page }) => {
    const allThemesLink = sidebar(page).getByRole("link", { name: "すべてのテーマ", exact: true });
    await expect(allThemesLink).toHaveAttribute("href", "/themes");
    await allThemesLink.scrollIntoViewIfNeeded();
    await expect(allThemesLink).toBeInViewport();
    await allThemesLink.click();

    await expect(page).toHaveURL(/\/themes/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("390px では開閉ボタンで Sheet が開き、リンクを押すと閉じる", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "メニューを開閉する" }).click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await sheet.getByRole("link", { name: "統計ブログ", exact: true }).click();

    await expect(page).toHaveURL(/\/blog/);
    await expect(sheet).toBeHidden();
  });

  test("統計ブログリンクをクリックして遷移する", async ({ page }) => {
    // 統計ブログリンクを取得
    const blogLink = sidebar(page).getByRole("link", { name: "統計ブログ", exact: true });
    
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
    const logoLink = sidebar(page).getByRole("link", { name: "stats47 ホーム" });
    
    // href属性が正しいことを確認
    await expect(logoLink).toHaveAttribute("href", "/");
    
    // リンクをクリック
    await logoLink.click();
    
    // URLが/に遷移したことを確認
    await expect(page).toHaveURL("/");
  });

  test("各URLでサイドバーの現在地は1項目だけに表示する", async ({ page }) => {
    const cases = [
      ["/ranking", "ランキング"],
      ["/category/laborwage", "労働・賃金"],
      ["/areas", "都道府県"],
      ["/themes", "すべてのテーマ"],
      ["/blog", "統計ブログ"],
    ] as const;

    for (const [path, label] of cases) {
      await page.goto(path);
      const activeItems = sidebar(page).locator('[data-active="true"]');

      await expect(activeItems).toHaveCount(1);
      await expect(activeItems).toContainText(label);
    }
  });
});
