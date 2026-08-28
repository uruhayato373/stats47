import { expect, test } from "@playwright/test";

test("調査カタログをテーマで絞り込み、公式出典を確認できる", async ({
  page,
}) => {
  const catalogResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/research/dashboard-catalog") &&
      response.ok()
  );
  await page.goto("/research");
  await catalogResponse;

  await expect(
    page.getByRole("heading", { name: "調査カタログ" })
  ).toBeVisible();
  await expect(page.getByText("40/40", { exact: true })).toBeVisible();
  await expect(page.getByText("20/20", { exact: true })).toBeVisible();

  await page.getByRole("combobox", { name: "stats47テーマで絞り込み" }).click();
  await page.getByRole("option", { name: /人口動態/ }).click();

  await expect(page.getByText(/17 \/ 71 件/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /公式サイトで開く/ }).first()
  ).toHaveAttribute("href", /^https:\/\//);
});
