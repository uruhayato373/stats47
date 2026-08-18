import { expect, test } from "@playwright/test";

/**
 * /svg ページの E2E。
 * 初期は自動ロードなし (旧 UI 踏襲) → 読込ボタン押下で GET /api/svg/catalog を叩く。
 * ネットワーク実データではなく小さな mock fixture (catalogs 2種 + items 3件、no-dark 1件含む) を使う。
 */

const FIXTURE = {
  catalogs: [
    { key: "bar", label: "ランキング棒グラフ", desc: "*-ranking.json", count: 2 },
    { key: "scatter", label: "散布図", desc: "*-scatter.json", count: 1 },
    { key: "line", label: "折れ線", desc: "*-timeseries.json", count: 0 },
  ],
  items: [
    {
      slug: "sample-article-a",
      file: "sample-ranking.svg",
      cat: "bar",
      url: "https://storage.stats47.jp/app/blog/sample-article-a/data/sample-ranking.svg",
      viewBox: "0 0 960 404",
      hasTheme: true,
      hasViewBox: true,
    },
    {
      slug: "sample-article-b",
      file: "sample-ranking-2.svg",
      cat: "bar",
      url: "https://storage.stats47.jp/app/blog/sample-article-b/data/sample-ranking-2.svg",
      viewBox: "0 0 960 404",
      // no dark mode 対応 (svgThemeStyle 無し) のケース
      hasTheme: false,
      hasViewBox: true,
    },
    {
      slug: "sample-article-c",
      file: "sample-scatter.svg",
      cat: "scatter",
      url: "https://storage.stats47.jp/app/blog/sample-article-c/data/sample-scatter.svg",
      viewBox: "0 0 960 624",
      hasTheme: true,
      hasViewBox: true,
    },
  ],
  articleCount: 3,
};

test.describe("/svg カタログ", () => {
  test("初期は自動ロードなし → 読込ボタンで mock catalog が表示される", async ({ page }) => {
    await page.goto("/svg");

    // 自動ロードされていないこと (EmptyState の案内文が出る)
    await expect(page.getByText("「読込」を押すと")).toBeVisible();

    await page.route("**/api/svg/catalog**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FIXTURE),
      });
    });

    await page.getByRole("button", { name: "読込" }).click();
    await page.waitForLoadState("networkidle");

    // count > 0 のカタログタブのみ表示 (line は 0 件なので出ない)
    await expect(page.getByRole("button", { name: /ランキング棒グラフ/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /散布図/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /折れ線/ })).toHaveCount(0);

    // 全 3 枚 / 3 記事のサマリ表示
    await expect(page.getByText("全 3 枚 / 3 記事")).toBeVisible();

    // 既定タブ (先頭の count>0) = bar が active で 2 枚表示
    const figures = page.locator("figure");
    await expect(figures).toHaveCount(2);
  });

  test("タブ切替・検索・no dark バッジが表示される", async ({ page }) => {
    await page.goto("/svg");
    await page.route("**/api/svg/catalog**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FIXTURE),
      });
    });
    await page.getByRole("button", { name: "読込" }).click();
    await page.waitForLoadState("networkidle");

    // no dark バッジ (sample-article-b は hasTheme:false)
    await expect(page.getByText("no dark")).toBeVisible();

    // 検索で bar タブ内を絞り込み
    await page.getByPlaceholder("slug / file 検索").fill("sample-article-a");
    await expect(page.locator("figure")).toHaveCount(1);

    // 検索クリアしてタブを切替 (scatter)
    await page.getByPlaceholder("slug / file 検索").fill("");
    await page.getByRole("button", { name: /散布図/ }).click();
    await expect(page.locator("figure")).toHaveCount(1);
    await expect(page.getByText("sample-article-c/sample-scatter.svg")).toBeVisible();
  });
});
