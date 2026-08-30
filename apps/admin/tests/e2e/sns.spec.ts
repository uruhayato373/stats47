import { expect, test } from "@playwright/test";

/** /sns は投稿台帳を検索・閲覧するだけで、実行または編集UIを持たない。 */
test.describe("/sns 投稿ギャラリー", () => {
  test("platform・status・検索で表示を絞り込める", async ({ page }) => {
    await page.goto("/sns");
    await page.waitForLoadState("networkidle");

    const countLabel = page.locator("text=/\\d+ 件/").first();
    await expect(countLabel).toBeVisible();
    const allCount = Number((await countLabel.textContent())?.match(/(\d+) 件/)?.[1] ?? "0");
    expect(allCount).toBeGreaterThan(0);

    await page.getByRole("button", { name: "X", exact: true }).click();
    await page.waitForTimeout(200);
    const xCount = Number((await countLabel.textContent())?.match(/(\d+) 件/)?.[1] ?? "0");
    expect(xCount).toBeGreaterThan(0);
    expect(xCount).toBeLessThanOrEqual(allCount);

    await page.getByRole("button", { name: "draft", exact: true }).click();
    await page.getByPlaceholder("content_key / caption 検索").fill("geo-001-x-");
    await page.waitForTimeout(200);
    await expect(page.getByText(/geo-001-x-/).first()).toBeVisible();
  });

  test("編集・予約・即時投稿・dry-run UIが存在しない", async ({ page }) => {
    await page.goto("/sns");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("textarea")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /caption 保存|予約投稿|即時投稿|dry-run/ })).toHaveCount(0);
  });
});
