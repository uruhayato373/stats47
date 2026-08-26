import { expect, test, type Page } from "@playwright/test";

import { PUBLIC_ROUTE_MATRIX, THEME_ROUTE_MATRIX } from "./public-route-matrix";

async function assertCanonical(page: Page, canonicalPath: string) {
  const href = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(href, "canonical link が無い").not.toBeNull();
  expect(new URL(href!, page.url()).pathname).toBe(canonicalPath);
}

async function assertRouteShell(
  page: Page,
  contract: (typeof PUBLIC_ROUTE_MATRIX)[number] | (typeof THEME_ROUTE_MATRIX)[number]
) {
  const response = await page.goto(contract.path, {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status(), `${contract.id} は公開契約どおり200を返す`).toBe(200);
  await assertCanonical(page, contract.canonicalPath);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(contract.heading);
  await expect(page.locator(contract.dataSelector).first()).toBeAttached({
    timeout: 15_000,
  });
}

test.describe("公開route matrix", () => {
  for (const contract of PUBLIC_ROUTE_MATRIX) {
    test(`${contract.id}: status/canonical/heading/data`, async ({ page }) => {
      await assertRouteShell(page, contract);
    });
  }
});

test.describe("ThemeCatalog 9 component types", () => {
  for (const contract of THEME_ROUTE_MATRIX) {
    test(`${contract.id}: chart count/state/unit/year/series`, async ({ page }) => {
      await assertRouteShell(page, contract);

      const charts = page.locator('[data-theme-chart="true"]');
      await expect(charts).toHaveCount(contract.expectedChartCount, {
        timeout: 60_000,
      });
      await expect(page.locator('[data-theme-chart="true"][data-data-state="loading"]')).toHaveCount(0, {
        timeout: 60_000,
      });

      for (let index = 0; index < contract.expectedChartCount; index += 1) {
        const chart = charts.nth(index);
        await expect(chart).toHaveAttribute("data-data-state", "ready");
        await expect(chart).toHaveAttribute("data-unit", /\S/);
        await expect(chart).toHaveAttribute("data-year", /\S/);
        const seriesCount = Number(await chart.getAttribute("data-series-count"));
        expect(seriesCount, `${contract.id} chart[${index}] の系列が空`).toBeGreaterThan(0);
      }

      for (const componentType of contract.representativeTypes) {
        const component = page.locator(`[data-theme-component-type="${componentType}"]`).first();
        await expect(component, `${componentType} がrouteに無い`).toBeAttached();
        await expect(component).toHaveAttribute("data-data-state", "ready");
      }
    });
  }
});
