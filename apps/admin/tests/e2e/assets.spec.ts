import { expect, test } from "@playwright/test";

/** /assets は画像資産を検索・閲覧するだけで、検査や再生成を実行しない。 */
test.describe("/assets 画像資産", () => {
  test("タブから資産を読み込める", async ({ page }) => {
    await page.goto("/assets");
    await expect(page.getByRole("button", { name: "ブログ OGP", exact: true })).toBeVisible();
    await page.getByLabel("件数").fill("3");
    await page.getByRole("button", { name: "ブログ OGP", exact: true }).click();
    await page.getByRole("button", { name: "読込" }).click();
    await expect(page.locator("figure").first()).toBeVisible({ timeout: 10000 });
  });

  test("欠落検査・再生成ボタンが存在しない", async ({ page }) => {
    await page.goto("/assets");
    await expect(page.getByRole("button", { name: /欠落チェック|再生成/ })).toHaveCount(0);
  });
});
