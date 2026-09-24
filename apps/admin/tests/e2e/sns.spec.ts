import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const LEDGER_PATH = path.resolve(__dirname, "../../../..", ".claude/state/sns/posts.json");
/** 画面の status ボタンがある状態 (sns-view.tsx の STATUSES)。deleted は絞り込めない。 */
const FILTERABLE_STATUSES = ["draft", "scheduled", "posted"];

/**
 * 画面と同じ台帳から、X + status + キー検索で必ず残る投稿を選ぶ。
 * 以前は `geo-001-x-` の draft を固定で探しており、その 15 件が投稿済みになった時点で
 * 壊れていた (2026-09-20 の週次フル検査)。台帳は投稿が進むたびに変わる。
 */
function pickXPostFromLedger(): { key: string; status: string } {
  const { posts } = JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8")) as {
    posts: Array<{ platform?: string; status?: string; content_key?: string }>;
  };
  for (const status of FILTERABLE_STATUSES) {
    const post = posts.find((p) => p.platform === "x" && p.status === status && p.content_key);
    if (post) return { key: post.content_key!, status };
  }
  throw new Error(`${LEDGER_PATH} に絞り込める X の投稿が無い`);
}

/** /sns は投稿台帳を検索・閲覧するだけで、実行または編集UIを持たない。 */
test.describe("/sns 投稿ギャラリー", () => {
  test("platform・status・検索で表示を絞り込める", async ({ page }) => {
    await page.goto("/sns");
    await page.waitForLoadState("networkidle");

    const countLabel = page.locator("text=/\\d+ 件/").first();
    // 件数は /api/inventory の応答前から「0 件」で描画される。networkidle は fetch 開始前に
    // 解けることがある (dev では常に) ので、台帳が読み込まれるまで待ってから読む。
    await expect(countLabel).toHaveText(/^[1-9]\d* 件$/, { timeout: 30_000 });
    const allCount = Number((await countLabel.textContent())?.match(/(\d+) 件/)?.[1] ?? "0");
    expect(allCount).toBeGreaterThan(0);

    await page.getByRole("button", { name: "X", exact: true }).click();
    await page.waitForTimeout(200);
    const xCount = Number((await countLabel.textContent())?.match(/(\d+) 件/)?.[1] ?? "0");
    expect(xCount).toBeGreaterThan(0);
    expect(xCount).toBeLessThanOrEqual(allCount);

    const target = pickXPostFromLedger();
    await page.getByRole("button", { name: target.status, exact: true }).click();
    await page.getByPlaceholder("content_key / caption 検索").fill(target.key);
    await page.waitForTimeout(200);
    await expect(page.getByText(target.key, { exact: false }).first()).toBeVisible();
    const filteredCount = Number((await countLabel.textContent())?.match(/(\d+) 件/)?.[1] ?? "0");
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(xCount);
  });

  test("編集・予約・即時投稿・dry-run UIが存在しない", async ({ page }) => {
    await page.goto("/sns");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("textarea")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /caption 保存|予約投稿|即時投稿|dry-run/ })).toHaveCount(0);
  });
});
