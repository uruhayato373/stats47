import { expect, test } from "@playwright/test";

/**
 * /dashboard ページの E2E。
 * - 実データで表示される
 * - 改善バックログの Tier filter 変更で行数が変わる (実データ、Tier 1 / Tier 2 が混在)
 * - セクション欠損耐性: /api/dashboard/summary を mock し 1 セクションだけ {error} にしても
 *   他セクションが表示されること
 */

test.describe("/dashboard プロジェクト現況", () => {
  test("実データで表示される", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "プロジェクト現況" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "メトリクス (週次)" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "TODO — 改善バックログ" })).toBeVisible(); // .claude/todo/ ミラーの表題
  });

  test("改善バックログの Tier filter で行数が変わる", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const backlogSection = page.locator("section#todo");
    await expect(backlogSection.locator("tbody tr").first()).toBeVisible({ timeout: 10000 });

    const countText = backlogSection.getByText(/\d+ \/ \d+ 件/);
    await expect(countText).toBeVisible();
    const beforeText = await countText.textContent();
    const [beforeShown, total] = (beforeText?.match(/(\d+) \/ (\d+) 件/) ?? []).slice(1).map(Number);
    expect(total).toBeGreaterThan(0);

    const tierSelect = backlogSection.locator("select").first();
    await tierSelect.selectOption("Tier 1");
    await page.waitForTimeout(150);

    const afterText = await countText.textContent();
    const [afterShown] = (afterText?.match(/(\d+) \/ (\d+) 件/) ?? []).slice(1).map(Number);
    expect(afterShown).toBeGreaterThan(0);
    expect(afterShown).toBeLessThanOrEqual(beforeShown!);
  });

  test("セクション欠損耐性: 1 セクションが error でも他セクションが表示される", async ({
    page,
  }) => {
    await page.route("**/api/dashboard/summary", async (route) => {
      const res = await route.fetch();
      const json = await res.json();
      json.strategy = { error: "mock: strategy state 読込に失敗しました" };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(json),
      });
    });

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // strategy セクションはエラー表示
    const strategySection = page.locator("section#strategy");
    await expect(strategySection.getByText(/取得失敗/)).toBeVisible();

    // 他セクション (metrics / todo) は正常表示される
    await expect(page.locator("section#metrics")).toBeVisible();
    await expect(page.locator("section#todo").locator("tbody tr").first()).toBeVisible({
      timeout: 10000,
    });
  });
});
