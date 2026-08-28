import { expect, test, type Page } from "@playwright/test";

/**
 * 管理コンソール全画面の疎通確認。
 * - 200 表示 + 共通ナビで相互遷移できること
 * - console error / pageerror が 0 件であること (リソース 404 は対象外)
 * - 横スクロールが発生しないこと (desktop / mobile 両プロジェクトで実行)
 */

const PAGES = [
  { path: "/", heading: "管理コンソール" },
  { path: "/content", heading: "コンテンツ運用" },
  { path: "/content/x", heading: "X運用" },
  { path: "/content/instagram", heading: "Instagram運用" },
  { path: "/content/note", heading: "note運用" },
  { path: "/content/kindle", heading: "Kindle運用" },
  { path: "/sns", heading: "SNS 投稿ギャラリー" },
  { path: "/buzz-map", heading: null },
  { path: "/assets", heading: null },
  { path: "/svg", heading: null },
  { path: "/research", heading: "調査カタログ" },
  { path: "/revenue", heading: "収益 (AdSense)" },
  { path: "/ads", heading: "アフィリエイト運用" },
  { path: "/dashboard", heading: "プロジェクト現況" },
  { path: "/quality", heading: "品質" },
  { path: "/ops", heading: "CI・台帳" },
  { path: "/todo", heading: "TODO" },
] as const;

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
}

test.describe("smoke: 管理画面の疎通", () => {
  for (const { path } of PAGES) {
    test(`${path} は 200 で表示され console error が無い`, async ({ page }) => {
      const errors = collectPageErrors(page);
      const response = await page.goto(path, { waitUntil: "load" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("body")).toBeVisible();
      // networkidle は定期取得を持つ運用画面で完了しないため、描画完了を契約にする。
      await expect(page.locator("main")).toBeVisible();
      expect(errors, `console/page errors on ${path}: ${errors.join("; ")}`).toEqual([]);
    });
  }

  for (const { path } of PAGES) {
    test(`${path} は横スクロールが発生しない`, async ({ page }) => {
      await page.goto(path, { waitUntil: "load" });
      await expect(page.locator("main")).toBeVisible();
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        scrollWidth,
        `${path}: scrollWidth=${scrollWidth} clientWidth=${clientWidth}`,
      ).toBeLessThanOrEqual(clientWidth + 1);
    });
  }

  test("共通ナビで相互遷移できる", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "管理コンソール" })).toBeVisible();

    const nav = page.getByRole("complementary").getByRole("navigation");

    await nav.getByRole("link", { name: "コンテンツ運用", exact: true }).click();
    await expect(page).toHaveURL(/\/content$/);

    await nav.getByRole("link", { name: "Kindle", exact: true }).click();
    await expect(page).toHaveURL(/\/content\/kindle$/);

    await nav.getByRole("link", { name: "SNS", exact: true }).click();
    await expect(page).toHaveURL(/\/sns$/);

    await nav.getByRole("link", { name: "画像資産", exact: true }).click();
    await expect(page).toHaveURL(/\/assets$/);

    await nav.getByRole("link", { name: "SVG カタログ", exact: true }).click();
    await expect(page).toHaveURL(/\/svg$/);

    await nav.getByRole("link", { name: "調査カタログ", exact: true }).click();
    await expect(page).toHaveURL(/\/research$/);

    await nav.getByRole("link", { name: "プロジェクト現況", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await nav.getByRole("link", { name: "ホーム", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("TODO は独立グループとして各台帳へ遷移できる", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByRole("complementary");

    await expect(sidebar.getByRole("button", { name: "TODO", exact: true })).toHaveCount(0);
    await expect(sidebar.getByText("TODO", { exact: true })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "実行バックログ", exact: true })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "今月の計画", exact: true })).toBeVisible();

    await sidebar.getByRole("link", { name: "今週の計画", exact: true }).click();
    await expect(page).toHaveURL(/\/todo\?f=weekly$/);
    await expect(page.getByRole("heading", { name: /計画 — 今週/ })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "今週の計画", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await sidebar.getByRole("link", { name: "効果測定・改善", exact: true }).click();
    await expect(page).toHaveURL(/\/todo\?f=improvements$/);
    await expect(page.getByRole("heading", { name: /効果測定・改善/ })).toBeVisible();
  });

  test("TODO は内部の実行分類を表示せず旧 URL を正規化する", async ({ page }) => {
    await page.goto("/todo?e=sweep");

    await expect(page).toHaveURL(/\/todo$/);
    await expect(page.getByRole("heading", { name: "実行", exact: true })).toHaveCount(0);
    await expect(page.getByText(/^実行:/)).toHaveCount(0);
    await expect(page.getByText("確認が必要", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("外部作業あり", { exact: true }).first()).toBeVisible();
  });
});
