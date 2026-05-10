import { expect, test } from "@playwright/test";

/**
 * 本番スモークテスト（Playwright版）
 *
 * 主要ページがブラウザで正常に表示されることを検証する。
 * E2E テストよりも軽量で、デプロイ後の動作確認に使う。
 *
 * @example
 * npx playwright test --config playwright.smoke.config.ts
 */

test.describe("本番スモークテスト", () => {
  test("トップページが表示される", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/統計で見る都道府県/i);
  });

  test("都道府県一覧が表示される", async ({ page }) => {
    await page.goto("/areas", { waitUntil: "domcontentloaded" });
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("都道府県詳細（北海道）が表示される", async ({ page }) => {
    await page.goto("/areas/01000", { waitUntil: "domcontentloaded" });
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10_000 });
    await expect(heading).toContainText("北海道");
  });

  test("都道府県ダッシュボード（人口）が500エラーにならない", async ({
    page,
  }) => {
    const response = await page.goto("/areas/01000/population", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("都道府県ダッシュボード（経済）が表示される", async ({ page }) => {
    const response = await page.goto("/areas/01000/economy", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("ランキング一覧が表示される", async ({ page }) => {
    await page.goto("/ranking", { waitUntil: "domcontentloaded" });
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("ランキング詳細（総人口）にテーブルが表示される", async ({ page }) => {
    await page.goto("/ranking/total-population", {
      waitUntil: "domcontentloaded",
    });
    const table = page.locator("table").first();
    await expect(table).toBeVisible({ timeout: 15_000 });
  });

  test("地域間比較ページが表示される", async ({ page }) => {
    await page.goto("/compare?areas=13000,27000", {
      waitUntil: "domcontentloaded",
    });
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10_000 });
    await expect(heading).toContainText("比較");
  });

  test("存在しないページで404が返る", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-at-all", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(404);
  });

  test("ブログ一覧ページが表示され、サムネイル画像が読み込まれる", async ({
    page,
  }) => {
    await page.goto("/blog", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10_000,
    });
    const img = page.locator("img[src*='blog']").first();
    if (await img.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // naturalWidth === 0 は画像読み込み失敗（404 / R2パス誤り）を示す
      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth
      );
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test("ブログ記事ページが500エラーにならない", async ({ page }) => {
    const response = await page.goto(
      "/blog/noodle-consumption-prefecture-character",
      { waitUntil: "domcontentloaded" }
    );
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10_000,
    });
  });
});
