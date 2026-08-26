import { expect, test } from "@playwright/test";

const ROUTES = [
  { id: "home", path: "/" },
  { id: "ranking", path: "/ranking/total-population" },
  { id: "theme", path: "/themes/population-dynamics" },
] as const;

const VIEWPORTS = [375, 768, 1024, 1280] as const;

test.describe("PR responsive smoke", () => {
  for (const width of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${route.id} ${width}px は横スクロールせず主要headingを保つ`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(route.path, {
          waitUntil: "domcontentloaded",
        });
        expect(response?.status()).toBe(200);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow).toBeLessThanOrEqual(1);
      });
    }
  }
});
