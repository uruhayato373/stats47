import { expect, test } from "@playwright/test";

/**
 * /dashboard (現況レビュー) の E2E。
 * - 実データで、今週の判断のリンクと週次メトリクスが表示される
 * - 施策の同時進行のカードから効果測定・改善の台帳 (/todo?f=improvements) へ移れる
 * - 欠損耐性: /api/dashboard/summary を mock し、メトリクスだけ {error} にしても PSI・カバレッジは表示される
 *
 * 2026-10-27: 旧「プロジェクト現況」(効果測定・戦略の区画) を前提にしたテストを、今の画面に合わせて書き直した
 * (旧区画は /todo と /strategy へ移っており、以前から落ちていた)。
 */

test.describe("/dashboard 現況レビュー", () => {
  test("今週の判断と週次メトリクスが表示される", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "現況レビュー", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "今週の判断" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "メトリクス (週次)" })).toBeVisible();
    await expect(page.locator("main").getByRole("link", { name: /pilot 判定/ })).toHaveAttribute("href", "/strategy/pilots");
  });

  test("施策の同時進行から効果測定・改善の台帳へ移れる", async ({ page }) => {
    await page.goto("/dashboard");
    const link = page.locator("main").getByRole("link", { name: /施策の同時進行/ });
    await expect(link).toHaveAttribute("href", "/todo?f=improvements");
    await link.click();
    await expect(page).toHaveURL(/\/todo\?f=improvements$/);
  });

  test("欠損耐性: メトリクスが取得失敗でも PSI・カバレッジは表示される", async ({ page }) => {
    await page.route("**/api/dashboard/summary", async (route) => {
      const res = await route.fetch();
      const json = await res.json();
      json.metrics = { error: "mock: メトリクスの読込に失敗しました" };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(json) });
    });

    await page.goto("/dashboard");
    const metrics = page.locator("section#metrics");
    await expect(metrics.getByText("メトリクス (取得失敗)")).toBeVisible();
    await expect(metrics.getByText("PSI 違反 error/warning")).toBeVisible();
  });
});
