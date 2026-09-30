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
  { path: "/product/status", heading: "販売状態" },
  { path: "/product/coconala", heading: "ココナラ" },
  { path: "/content/x", heading: "X運用" },
  { path: "/content/instagram", heading: "Instagram運用" },
  { path: "/content/note", heading: "note運用" },
  { path: "/content/kindle", heading: "Kindle運用" },
  { path: "/content/references", heading: "参考文献の活用・展開管理" },
  { path: "/sns", heading: "SNS 投稿ギャラリー" },
  { path: "/buzz-map", heading: null },
  { path: "/assets", heading: null },
  { path: "/svg", heading: null },
  { path: "/research", heading: "調査カタログ" },
  { path: "/revenue", heading: "収益" },
  { path: "/affiliate", heading: "アフィリエイト 成果" },
  { path: "/affiliate/placements", heading: "アフィリエイト 掲載先" },
  { path: "/affiliate/programs", heading: "アフィリエイト 提携・案件" },
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

/**
 * 左メニュー (shadcn 公式 Sidebar)。デスクトップは常時表示、md 未満は Sheet なので開いてから使う。
 * 画面を移ると Sheet は閉じる (CloseSidebarOnNavigate) ので、遷移のたびにこれを呼ぶ。
 */
async function sidebarOf(page: import("@playwright/test").Page) {
  const sidebar = page.locator('[data-slot="sidebar"]:visible').first();
  const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
  if (isMobile) {
    // hydration 前のクリックは効かないので、開くまで押し直す
    await expect(async () => {
      if ((await sidebar.count()) === 0) await page.locator('[data-sidebar="trigger"]').first().click({ timeout: 2000 });
      await expect(sidebar).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 20_000 });
  }
  await expect(sidebar).toBeVisible();
  return sidebar;
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

    // 左メニューは shadcn 公式の Sidebar。旧 aside/nav ではない (2026-09-30)

    await (await sidebarOf(page)).getByRole("link", { name: "コンテンツ横断・監査", exact: true }).click();
    await expect(page).toHaveURL(/\/content$/);

    await (await sidebarOf(page)).getByRole("link", { name: "販売状態", exact: true }).click();
    await expect(page).toHaveURL(/\/product\/status$/);

    // チャネルは「チャネル別」の枝 (折りたたみ) の中。現在地を含まない枝は閉じているので開いてから押す
    let sidebar = await sidebarOf(page);
    await sidebar.locator("summary", { hasText: "チャネル別" }).first().click();
    await sidebar.getByRole("link", { name: "Kindle", exact: true }).click();
    await expect(page).toHaveURL(/\/content\/kindle$/);
    // 現在地を含む枝は開いた状態で描かれる
    sidebar = await sidebarOf(page);
    await expect(sidebar.getByRole("link", { name: "Kindle", exact: true })).toHaveAttribute("aria-current", "page");

    await (await sidebarOf(page)).getByRole("link", { name: "投稿状況", exact: true }).click();
    await expect(page).toHaveURL(/\/sns$/);

    await (await sidebarOf(page)).getByRole("link", { name: "画像資産", exact: true }).click();
    await expect(page).toHaveURL(/\/assets$/);

    await (await sidebarOf(page)).getByRole("link", { name: "SVG カタログ", exact: true }).click();
    await expect(page).toHaveURL(/\/svg$/);

    await (await sidebarOf(page)).getByRole("link", { name: "調査カタログ", exact: true }).click();
    await expect(page).toHaveURL(/\/research$/);

    await (await sidebarOf(page)).getByRole("link", { name: "現況レビュー", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await (await sidebarOf(page)).getByRole("link", { name: "ホーム", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("計画グループ (旧 TODO) から各台帳へ遷移できる", async ({ page }) => {
    await page.goto("/");
    let sidebar = await sidebarOf(page);

    await expect(sidebar.getByRole("button", { name: "計画", exact: true })).toHaveCount(0);
    await expect(sidebar.getByText("計画", { exact: true })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "実行バックログ", exact: true })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "今月の計画", exact: true })).toBeVisible();

    await sidebar.getByRole("link", { name: "今週の計画", exact: true }).click();
    await expect(page).toHaveURL(/\/todo\?f=weekly$/);
    await expect(page.getByRole("heading", { name: /計画 — 今週/ })).toBeVisible();
    sidebar = await sidebarOf(page);
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
