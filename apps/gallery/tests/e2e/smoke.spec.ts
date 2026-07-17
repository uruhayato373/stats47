import { expect, test, type Page } from "@playwright/test";

/**
 * 5画面 (/ /sns /assets /svg /dashboard) の疎通確認。
 * - 200 表示 + 共通ナビで相互遷移できること
 * - console error / pageerror が 0 件であること (リソース 404 は対象外)
 * - 横スクロールが発生しないこと (desktop / mobile 両プロジェクトで実行)
 */

const PAGES = [
  { path: "/", heading: "統合メディアコンソール" },
  { path: "/sns", heading: "SNS 投稿ギャラリー" },
  { path: "/assets", heading: null },
  { path: "/svg", heading: null },
  { path: "/dashboard", heading: "プロジェクト現況" },
] as const;

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
}

test.describe("smoke: 5画面の疎通", () => {
  for (const { path } of PAGES) {
    test(`${path} は 200 で表示され console error が無い`, async ({ page }) => {
      const errors = collectPageErrors(page);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("body")).toBeVisible();
      // クライアントの初回データ取得 (apiGet) が解決するまで待つ
      await page.waitForLoadState("networkidle");
      expect(errors, `console/page errors on ${path}: ${errors.join("; ")}`).toEqual([]);
    });
  }

  test("横スクロールが発生しない (viewport 内に収まる)", async ({ page }) => {
    for (const { path } of PAGES) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        scrollWidth,
        `${path}: scrollWidth=${scrollWidth} clientWidth=${clientWidth}`,
      ).toBeLessThanOrEqual(clientWidth + 1);
    }
  });

  test("共通ナビで相互遷移できる", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "統合メディアコンソール" })).toBeVisible();

    const nav = page.locator("header nav");

    await nav.getByRole("link", { name: "SNS", exact: true }).click();
    await expect(page).toHaveURL(/\/sns$/);

    await nav.getByRole("link", { name: "画像資産", exact: true }).click();
    await expect(page).toHaveURL(/\/assets$/);

    await nav.getByRole("link", { name: "SVG", exact: true }).click();
    await expect(page).toHaveURL(/\/svg$/);

    await nav.getByRole("link", { name: "現況", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await nav.getByRole("link", { name: "ホーム", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
