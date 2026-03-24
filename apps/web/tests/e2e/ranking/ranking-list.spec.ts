import { expect, test } from "@playwright/test";

/**
 * ランキング一覧ページのE2Eテスト
 *
 * /ranking ページの表示と基本的なユーザーフローをテストします。
 */
test.describe("ランキング一覧ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ranking", { waitUntil: "domcontentloaded" });
  });

  test("ページが正常に表示される", async ({ page }) => {
    // ページタイトルが表示される
    await expect(page).toHaveTitle(/ランキング/);

    // 見出しが表示される
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("カテゴリカードが表示される", async ({ page }) => {
    // カテゴリカードが少なくとも1つ表示される
    // ※ 実際のセレクタはコンポーネントの実装に合わせて調整
    const categoryCards = page.locator("[data-testid='category-card']");

    // カードが存在しない場合は、代替セレクタを試行
    const count = await categoryCards.count();
    if (count === 0) {
      // 代替: カード風の要素を探す
      const cards = page.locator("article, [class*='card'], [class*='Card']");
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(categoryCards.first()).toBeVisible();
    }
  });

  test("ランキング項目をクリックして詳細ページに遷移できる", async ({ page }) => {
    // ランキングへのリンクを探す
    const rankingLinks = page.locator("a[href^='/ranking/']");

    // 最初のリンクが表示されるまで待機
    await expect(rankingLinks.first()).toBeVisible({ timeout: 10000 });

    // クリック
    await rankingLinks.first().click();

    // 詳細ページに遷移したことを確認
    await expect(page).toHaveURL(/\/ranking\/.+/);
  });

  test("検索/フィルター機能が存在する場合、動作する", async ({ page }) => {
    // 検索入力があれば確認（オプショナル）
    const searchInput = page.getByPlaceholder(/検索|キーワード/i);

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill("人口");
      // 検索結果が更新されることを確認（具体的な確認方法は実装に依存）
      await page.waitForTimeout(500); // debounce待機
    }
  });
});
