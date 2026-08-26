import { expect, test } from "@playwright/test";

/**
 * /dashboard ページの E2E。
 * - 実データで表示される
 * - 効果測定の状態サマリと詳細台帳への導線が表示される
 * - セクション欠損耐性: /api/dashboard/summary を mock し 1 セクションだけ {error} にしても
 *   他セクションが表示されること
 */

test.describe("/dashboard プロジェクト現況", () => {
  test("実データで表示される", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "プロジェクト現況" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "メトリクス (週次)" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "効果測定・改善" })).toBeVisible();
  });

  test("効果測定の状態サマリから詳細台帳へ遷移できる", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const improvementSection = page.locator("section#todo");
    await expect(improvementSection.getByText("全施策", { exact: true })).toBeVisible();
    await expect(improvementSection.getByText("実行中", { exact: true })).toBeVisible();
    await expect(improvementSection.getByText("効果判定待ち", { exact: true })).toBeVisible();
    await expect(improvementSection.getByText("期限超過", { exact: true })).toBeVisible();

    const detailLink = improvementSection.getByRole("link", { name: "詳細をTODOで見る →" });
    await expect(detailLink).toHaveAttribute("href", "/todo?f=improvements");
    await detailLink.click();
    await expect(page).toHaveURL(/\/todo\?f=improvements$/);
    await expect(page.getByRole("heading", { name: /効果測定・改善/ })).toBeVisible();
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
    await expect(page.locator("section#todo").getByText("全施策", { exact: true })).toBeVisible();
  });
});
