import { expect, test } from "@playwright/test";

import { getJsonLdByType, getJsonLdScripts } from "../helpers/structured-data";

/**
 * 構造化データ（JSON-LD）とメタタグのE2Eテスト
 *
 * Google リッチリザルト向け JSON-LD・OG タグ・canonical を横断的に検証します。
 */
test.describe("構造化データ（JSON-LD）", () => {
  test("地域プロファイルに BreadcrumbList が含まれる", async ({ page }) => {
    await page.goto("/areas/08000", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 10000 });

    const breadcrumb = await getJsonLdByType(page, "BreadcrumbList");
    expect(breadcrumb).not.toBeNull();

    const items = (breadcrumb as Record<string, unknown>)["itemListElement"] as unknown[];
    expect(items).toHaveLength(3);

    // 各アイテムの name を確認
    const names = (items as Array<Record<string, unknown>>).map((item) => item["name"]);
    expect(names).toContain("ホーム");
    expect(names).toContain("都道府県一覧");
    expect(names[2]).toContain("茨城県");
  });

  test("地域プロファイルに AdministrativeArea が含まれる", async ({ page }) => {
    await page.goto("/areas/08000", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 10000 });

    const area = await getJsonLdByType(page, "AdministrativeArea");
    expect(area).not.toBeNull();

    expect(area!["name"]).toBe("茨城県");

    const containedIn = area!["containedInPlace"] as Record<string, unknown>;
    expect(containedIn["name"]).toBe("日本");
  });

  test("ランキング詳細に Dataset と BreadcrumbList が含まれる", async ({ page }) => {
    // 一覧から最初のリンクを取得して遷移
    await page.goto("/ranking", { waitUntil: "domcontentloaded" });
    const firstLink = page.locator("a[href^='/ranking/']").first();
    await expect(firstLink).toBeVisible({ timeout: 10000 });
    const href = await firstLink.getAttribute("href");
    if (href) {
      await page.goto(href, { waitUntil: "domcontentloaded" });
    }

    await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 10000 });

    const scripts = await getJsonLdScripts(page);
    expect(scripts.length).toBeGreaterThanOrEqual(2);

    const types = scripts.map((s) => s["@type"] as string);
    expect(types).toContain("BreadcrumbList");
    expect(types).toContain("Dataset");
  });
});

test.describe("メタタグ", () => {
  test("地域プロファイルの OG タグが正しい", async ({ page }) => {
    await page.goto("/areas/08000", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 10000 });

    // og:title に「茨城県」が含まれる
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toContain("茨城県");

    // og:description が空でない
    const ogDesc = await page
      .locator('meta[property="og:description"]')
      .getAttribute("content");
    expect(ogDesc).toBeTruthy();
    expect(ogDesc!.length).toBeGreaterThan(0);
  });

  test("canonical URL が設定されている", async ({ page }) => {
    await page.goto("/areas/08000", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 10000 });

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toContain("/areas/08000");
  });
});
