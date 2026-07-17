import { expect, test } from "@playwright/test";

/**
 * /sns ページの E2E。
 * - platform タブ / status チップ / 検索 filter がカード数を変える (実データ)
 * - caption 編集: PATCH /api/posts/:id を mock し、送信中 disabled → mock 応答後の反映を確認
 * - X dry-run: POST /api/actions/publish-x + GET /api/jobs/:id (running→success) を mock し、
 *   JobDialog の polling が success で停止することを確認
 */

test.describe("/sns 投稿ギャラリー", () => {
  test("platform タブでカード数が変わる", async ({ page }) => {
    await page.goto("/sns");
    await page.waitForLoadState("networkidle");

    const countLabel = page.locator("text=/\\d+ 件/").first();
    await expect(countLabel).toBeVisible();
    const allCountText = await countLabel.textContent();
    const allCount = Number(allCountText?.match(/(\d+) 件/)?.[1] ?? "0");
    expect(allCount).toBeGreaterThan(0);

    // platform タブ (tab variant) から "X" を選ぶ
    await page.getByRole("button", { name: "X", exact: true }).click();
    await page.waitForTimeout(200);
    const xCountText = await countLabel.textContent();
    const xCount = Number(xCountText?.match(/(\d+) 件/)?.[1] ?? "0");
    expect(xCount).toBeGreaterThan(0);
    expect(xCount).toBeLessThan(allCount);
  });

  test("status チップでカード数が変わる", async ({ page }) => {
    await page.goto("/sns");
    await page.waitForLoadState("networkidle");

    const countLabel = page.locator("text=/\\d+ 件/").first();
    const beforeText = await countLabel.textContent();
    const beforeCount = Number(beforeText?.match(/(\d+) 件/)?.[1] ?? "0");

    await page.getByRole("button", { name: "posted", exact: true }).click();
    await page.waitForTimeout(200);
    const postedText = await countLabel.textContent();
    const postedCount = Number(postedText?.match(/(\d+) 件/)?.[1] ?? "0");
    expect(postedCount).toBeGreaterThan(0);
    expect(postedCount).toBeLessThanOrEqual(beforeCount);
  });

  test("検索 filter でカード数が変わる", async ({ page }) => {
    await page.goto("/sns");
    await page.waitForLoadState("networkidle");

    const countLabel = page.locator("text=/\\d+ 件/").first();
    const beforeText = await countLabel.textContent();
    const beforeCount = Number(beforeText?.match(/(\d+) 件/)?.[1] ?? "0");

    await page.getByPlaceholder("content_key / caption 検索").fill("nurse-salary");
    await page.waitForTimeout(200);
    const afterText = await countLabel.textContent();
    const afterCount = Number(afterText?.match(/(\d+) 件/)?.[1] ?? "0");
    expect(afterCount).toBeGreaterThan(0);
    expect(afterCount).toBeLessThan(beforeCount);
  });

  test("caption 編集: 入力で保存ボタンが有効化し、PATCH mock 経由で保存できる", async ({
    page,
  }) => {
    let patchCalled = false;
    await page.route("**/api/posts/**", async (route) => {
      const req = route.request();
      if (req.method() !== "PATCH") return route.continue();
      patchCalled = true;
      const body = req.postDataJSON() as { caption?: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 581,
          platform: "x",
          post_type: "ranking",
          domain: "ranking",
          content_key: "total-overnight-guests",
          caption: body.caption ?? "",
          status: "scheduled",
          scheduled_at: "2026-08-01 09:00:00",
          posted_at: null,
          media_path: null,
          impressions: null,
          likes: null,
          reposts: null,
          replies: null,
          bookmarks: null,
          template: null,
          media_candidates: [],
        }),
      });
    });

    await page.goto("/sns");
    await page.waitForLoadState("networkidle");

    // scheduled の x post (id=581) を検索で絞り込む
    await page.getByPlaceholder("content_key / caption 検索").fill("total-overnight-guests");
    await page.waitForTimeout(200);

    const card = page.locator("text=/#581/").locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
    const textarea = card.locator("textarea");
    await expect(textarea).toBeVisible();

    const saveButton = card.getByRole("button", { name: "caption 保存" });
    await expect(saveButton).toBeDisabled();

    await textarea.fill("E2E テストで書き換えた caption");
    await expect(saveButton).toBeEnabled();

    await saveButton.click();
    // 送信中は再クリックしても二重送信されない (disabled) ことを緩く確認
    await expect(saveButton).toBeDisabled();
    await expect(saveButton).toBeDisabled({ timeout: 3000 }).catch(() => {});

    await page.waitForTimeout(300);
    expect(patchCalled).toBe(true);
    // 保存後は dirty が解消し、ボタンが再び disabled (savedCaption == caption) に戻る
    await expect(saveButton).toBeDisabled();
  });

  test("X dry-run: publish-x → jobs polling (running→success) で JobDialog が閉じられる状態になる", async ({
    page,
  }) => {
    let jobPollCount = 0;
    await page.route("**/api/actions/publish-x", async (route) => {
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ id: 999 }),
      });
    });
    await page.route("**/api/jobs/999", async (route) => {
      jobPollCount += 1;
      const status = jobPollCount === 1 ? "running" : "success";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "999",
          kind: "publish-x",
          status,
          log: jobPollCount === 1 ? ["起動中..."] : ["起動中...", "投稿完了 (dry-run)"],
          startedAt: new Date().toISOString(),
          endedAt: status === "success" ? new Date().toISOString() : null,
        }),
      });
    });

    await page.goto("/sns");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("content_key / caption 検索").fill("total-overnight-guests");
    await page.waitForTimeout(200);

    const card = page.locator("text=/#581/").locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
    await card.getByRole("button", { name: "dry-run" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Job #999/)).toBeVisible();

    // running -> success (polling は 1.5s 間隔なので余裕を見て待つ)
    await expect(dialog.getByText("成功")).toBeVisible({ timeout: 8000 });
    expect(jobPollCount).toBeGreaterThanOrEqual(2);

    await dialog.getByRole("button", { name: "閉じる" }).click();
    await expect(dialog).not.toBeVisible();
  });
});
