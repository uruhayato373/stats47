import { expect, test } from "@playwright/test";

/**
 * 静的ページのE2Eテスト
 *
 * /privacy と /terms の最低限の表示確認をします。
 */
test.describe("静的ページ", () => {
  test("プライバシーポリシーが表示される", async ({ page }) => {
    await page.goto("/privacy", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/privacy/);

    // h1 見出しが表示される
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // ページ本文が空でない（段落が存在する）
    const paragraphs = page.locator("p, section, article");
    await expect(paragraphs.first()).toBeVisible({ timeout: 10000 });
  });

  test("利用規約が表示される", async ({ page }) => {
    await page.goto("/terms", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/terms/);

    // h1 見出しが表示される
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // ページ本文が空でない
    const paragraphs = page.locator("p, section, article");
    await expect(paragraphs.first()).toBeVisible({ timeout: 10000 });
  });
});
