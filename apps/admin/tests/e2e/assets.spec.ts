import { expect, test } from "@playwright/test";

/**
 * /assets ページの E2E。
 * - タブ一覧が API から動的に出て、タブクリックでエントリ表示される (実データ)
 * - 欠落チェック: POST /api/assets/check を mock してバッジ表示を確認
 * - 再生成ボタンは REGEN_KIND に登録された対象タブのみに出る (blog-ogp にあり、video-master に無い)
 */

test.describe("/assets 画像資産", () => {
  test("タブ一覧が動的に出て、タブクリックでエントリが表示される", async ({ page }) => {
    await page.goto("/assets");

    // タブバーの読込を待つ (初回 GET /api/assets/tabs)
    const tabBar = page.locator("div.sticky").first();
    await expect(tabBar.getByRole("button", { name: "ブログ OGP", exact: true })).toBeVisible();

    // 件数を軽くするため limit を小さくしてから読込
    await page.getByLabel("件数").fill("3");
    await page.getByRole("button", { name: "ブログ OGP", exact: true }).click();
    await page.getByRole("button", { name: "読込" }).click();
    await page.waitForLoadState("networkidle");

    // エントリが表示される (figure カード)
    const cards = page.locator("figure");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(3);
  });

  test("欠落チェック: mock でバッジが表示される", async ({ page }) => {
    await page.goto("/assets");
    await expect(
      page.getByRole("button", { name: "ブログ OGP", exact: true }),
    ).toBeVisible();

    await page.getByLabel("件数").fill("2");
    await page.getByRole("button", { name: "ブログ OGP", exact: true }).click();
    await page.getByRole("button", { name: "読込" }).click();
    await page.waitForLoadState("networkidle");

    const cards = page.locator("figure");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    // 欠落チェック API を mock: 全 URL を欠落 (ok:false) として返す
    await page.route("**/api/assets/check", async (route) => {
      const req = route.request();
      const body = req.postDataJSON() as { tab: string };
      // 対象タブの画像 URL は固定できないため、任意の URL キーに ok:false を返す形にする。
      // AssetsView は checkResult[url] を参照するため、ワイルドカードは使えない。
      // ここでは実際に描画されている画像 URL を DOM から取得して合わせる。
      const urls = await page.locator("figure img, figure video").evaluateAll((els) =>
        els.map((el) => (el as HTMLImageElement | HTMLVideoElement).src).filter(Boolean),
      );
      const result: Record<string, { ok: boolean; status: number; ct: string }> = {};
      for (const u of urls) {
        result[u] = { ok: false, status: 404, ct: "image/png" };
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ checked: urls.length, result, tab: body.tab }),
      });
    });

    await page.getByRole("button", { name: "⚠ 欠落チェック" }).click();
    await expect(page.getByText(/欠落 \d+ 件/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("✗ 欠落").first()).toBeVisible();
  });

  test("再生成ボタンは対象タブのみに出る (blog-ogp にあり video-master に無い)", async ({
    page,
  }) => {
    await page.goto("/assets");
    await expect(
      page.getByRole("button", { name: "ブログ OGP", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "ブログ OGP", exact: true }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "♻ 再生成" })).toBeVisible();

    await page.getByRole("button", { name: "動画 master", exact: true }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "♻ 再生成" })).toHaveCount(0);
  });
});
