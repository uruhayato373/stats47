import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  { name: "home", path: "/" },
  { name: "ranking-list", path: "/ranking" },
  { name: "area-list", path: "/areas" },
  { name: "blog-list", path: "/blog" },
  { name: "static-content", path: "/privacy" },
] as const;

test.describe("代表routeのアクセシビリティ", () => {
  test.setTimeout(90_000);

  for (const route of routes) {
    test(`${route.name} に重大なaxe違反がない`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const serious = results.violations.filter(
        (violation) => violation.impact === "critical" || violation.impact === "serious",
      );
      expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
    });
  }

  test("キーボード操作で本文へ到達できる", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
    await expect(focused).toHaveAttribute("href", /#(?:main|content)/);
  });
});
