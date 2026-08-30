import { expect, test } from "@playwright/test";

test.describe("/content/references 参考文献展開", () => {
  test("12チャネルと企画・補強の全量サマリを表示する", async ({ page }) => {
    await page.goto("/content/references", { waitUntil: "load" });

    await expect(page.getByRole("heading", { name: /全展開チャネル/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /テーマ 11 19 0 3 28/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /YouTube 0 1 15 0 45/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /企画・下書き/ })).toBeVisible();
    await expect(page.getByText("テーマ企画").first()).toBeVisible();
    await expect(page.getByText("ブログ下書き").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /既存コンテンツ補強プール/ })).toBeVisible();
  });

  test("チャネル・状態・検索条件で制作単位と根拠を絞り込める", async ({ page }) => {
    await page.goto(
      "/content/references?channel=youtube&stage=draft&q=students-requiring",
      { waitUntil: "load" },
    );

    const portfolio = page.locator("section").filter({
      has: page.getByRole("heading", { name: /制作ポートフォリオ/ }),
    });
    await expect(portfolio.getByText("日本語指導が必要な児童生徒数")).toBeVisible();
    await expect(portfolio.getByText("YouTube", { exact: true }).first()).toBeVisible();
    await expect(portfolio.getByText("制作中", { exact: true }).first()).toBeVisible();
    await expect(portfolio.getByText(/8分/)).toBeVisible();
  });

  test("context-only補強プールを全件ページ送りできる", async ({ page }) => {
    await page.goto("/content/references", { waitUntil: "load" });

    const context = page.locator("section").filter({
      has: page.getByRole("heading", { name: /既存コンテンツ補強プール/ }),
    });
    await expect(context.getByText("1 / 21ページ")).toBeVisible();
    await context.getByRole("link", { name: "次へ" }).click();
    await expect(page).toHaveURL(/contextPage=2/);
    await expect(context.getByText("2 / 21ページ")).toBeVisible();
  });
});
