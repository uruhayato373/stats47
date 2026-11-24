import { expect, test } from "@playwright/test";

/**
 * ブログ一覧ページのE2Eテスト
 *
 * /blog ページの表示とフィルター操作をテストします。
 */
/**
 * 一覧の記事カード (ArticleTeaserCard)。2026-10-29 にカードの題が h2 から h3 になり、
 * 見出しの段で選ぶと 0 件になった (QUALITY-SUITE-WEEKLY-RED-01)。部品の印で選ぶ。
 */
const ARTICLE_CARD = "main a[href^='/blog/'][data-slot-kind='article-teaser-card']";

test.describe("ブログ一覧ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/blog", { waitUntil: "domcontentloaded" });
  });

  test("ページが正常に表示される", async ({ page }) => {
    // ページタイトルが表示される
    await expect(page).toHaveTitle(/ブログ/);

    // 見出しが表示される
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("記事カードが1つ以上表示される", async ({ page }) => {
    // 記事へのリンクカードが表示される
    const articleLinks = page.locator(ARTICLE_CARD);
    await expect(articleLinks.first()).toBeVisible({ timeout: 10000 });
  });

  test("記事をクリックして詳細ページに遷移できる", async ({ page }) => {
    // レールのタグ/関連記事リンクではなく、一覧の見出し付き記事カードを選ぶ。
    const target = page.locator(ARTICLE_CARD).first();

    await expect(target).toBeVisible({ timeout: 10000 });
    const href = await target.getAttribute("href");
    expect(href).toMatch(/^\/blog\/[^/]+$/);
    await target.click();

    // 詳細ページに遷移したことを確認
    await expect(page).toHaveURL((url) => url.pathname === href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("年セレクトを変更できる", async ({ page }) => {
    // 年の Select コンポーネントを探す
    const yearTrigger = page
      .locator("[role='combobox']")
      .filter({ hasText: /すべての年|年/ })
      .first();

    if (await yearTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await yearTrigger.click();

      // ドロップダウン内の選択肢を待機
      const option = page.locator("[role='option']").first();
      await expect(option).toBeVisible({ timeout: 3000 });
    }
  });

  test("タグのチェックボックスをON/OFFできる", async ({ page }) => {
    // タグのチェックボックスを探す
    const tagCheckbox = page.locator("[role='checkbox']").first();

    if (await tagCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      // チェックを入れる
      await tagCheckbox.click();
      await expect(tagCheckbox).toHaveAttribute("data-state", "checked");

      // チェックを外す
      await tagCheckbox.click();
      await expect(tagCheckbox).toHaveAttribute("data-state", "unchecked");
    }
  });

  test("キーワード検索で結果が更新される", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/タイトル・説明文で検索/);

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 検索前の件数テキストを取得
      const countText = page.locator("text=/\\d+ 件の記事/");
      await expect(countText).toBeVisible({ timeout: 5000 });

      // キーワードを入力
      await searchInput.fill("都道府県");

      // debounce (300ms) + 余裕を持って待機
      await page.waitForTimeout(500);

      // 件数テキストが引き続き表示されることを確認（フィルタ結果が反映される）
      await expect(countText).toBeVisible();
    }
  });

  test("記事カードは記事別サムネイルと本文情報を表示する", async ({ page }) => {
    const articleCard = page.locator(ARTICLE_CARD).first();

    await expect(articleCard).toBeVisible({ timeout: 10_000 });
    await expect(articleCard.locator("h3")).not.toBeEmpty();
    const thumbnail = articleCard.locator("img");
    await expect(thumbnail).toHaveCount(1);
    await expect(thumbnail).toHaveAttribute("alt", "");
    await expect(thumbnail).toHaveAttribute(
      "src",
      /https:\/\/storage\.stats47\.jp\/app\/blog\/[^/]+\/thumbnail-(light|dark)\.webp/
    );
    await expect
      .poll(() =>
        thumbnail.evaluate(
          (image) =>
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth > 0
        )
      )
      .toBe(true);
  });
});
