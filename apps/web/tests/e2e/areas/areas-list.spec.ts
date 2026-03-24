import { expect, test } from "@playwright/test";

/**
 * 都道府県一覧ページのE2Eテスト
 *
 * /areas ページの表示とナビゲーションをテストします。
 */
test.describe("都道府県一覧ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/areas", { waitUntil: "domcontentloaded" });
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(page).toHaveURL(/\/areas$/);

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText("都道府県一覧");
  });

  test("47都道府県のリンクが表示される", async ({ page }) => {
    const links = page.locator("a[href^='/areas/']");
    await expect(links.first()).toBeVisible({ timeout: 10000 });

    const count = await links.count();
    expect(count).toBe(47);

    // 代表的な都道府県名を確認
    await expect(page.getByRole("link", { name: "北海道" })).toBeVisible();
    await expect(page.getByRole("link", { name: "東京都" })).toBeVisible();
    await expect(page.getByRole("link", { name: "沖縄県" })).toBeVisible();
  });

  test("都道府県をクリックして詳細ページに遷移できる", async ({ page }) => {
    const firstLink = page.locator("a[href^='/areas/']").first();
    await expect(firstLink).toBeVisible({ timeout: 10000 });

    await firstLink.click();

    await expect(page).toHaveURL(/\/areas\/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });
  });
});
