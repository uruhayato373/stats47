import { expect, test } from "@playwright/test";

/**
 * 地域プロファイル詳細ページのE2Eテスト
 *
 * /areas/[areaCode] ページの表示・パンくず・強み弱みセクション・比較ボタンをテストします。
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

    // エリアコードバッジが表示される
    await expect(page.getByText(testAreaCode)).toBeVisible();
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

  test("強み・弱みセクションが表示される", async ({ page }) => {
    // 強みセクション
    const strengthsHeading = page.getByRole("heading", { name: "地域のストロングポイント" });
    await expect(strengthsHeading).toBeVisible({ timeout: 10000 });

    // 弱みセクション
    const weaknessesHeading = page.getByRole("heading", { name: "今後の課題・伸びしろ" });
    await expect(weaknessesHeading).toBeVisible();

    // 各セクションに少なくとも1件の項目が表示される（強みが存在する場合）
    const strengthItems = page.locator("section").filter({ hasText: "地域のストロングポイント" }).locator("li, [class*='card'], [class*='Card']");
    const strengthCount = await strengthItems.count();
    if (strengthCount > 0) {
      await expect(strengthItems.first()).toBeVisible();
    }
  });

  test("比較ボタンが正しく動作する", async ({ page }) => {
    const compareLink = page.getByRole("link", { name: /他の地域と比較する/ });
    await expect(compareLink).toBeVisible({ timeout: 10000 });

    // href に自身のエリアコードが含まれる
    const href = await compareLink.getAttribute("href");
    expect(href).toContain(testAreaCode);

    // クリックで /compare ページに遷移する
    await compareLink.click();
    await expect(page).toHaveURL(/\/compare/);
  });

  test("存在しないエリアコードで 404 が表示される", async ({ page }) => {
    const response = await page.goto("/areas/99999", { waitUntil: "domcontentloaded" });

    // HTTP ステータスが 404 または Next.js の notFound ページが表示される
    const is404Status = response?.status() === 404;
    const has404Text = await page.getByText(/404|見つかりません|not found/i)
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(is404Status || has404Text).toBe(true);
  });
});
