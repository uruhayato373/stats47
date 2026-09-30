/**
 * X の予約投稿を本文の先頭で照合して取り消す (publish-x と同じ専用プロファイルを使う)。
 *
 *   npx tsx .claude/skills/sns/publish-x/delete-x-scheduled.ts --match "<本文の先頭>" [--match ...]           # 照合結果の表示だけ
 *   npx tsx .claude/skills/sns/publish-x/delete-x-scheduled.ts --match "<本文の先頭>" [--match ...] --commit  # 取り消す
 *
 * X の予約一覧の一括削除は、画面に描画されている 7〜8 件しか 1 回で消えない (2026-09-23 実測)。
 * そのため「照合した行だけ選択 → 削除 → 一覧を読み直す」を対象が 0 件になるまで繰り返し、
 * 毎回、対象外の予約の件数が減っていないことを確かめる。「すべて選択」は使わない (残すべき予約まで消える)。
 */
import { chromium, type Page } from "playwright";
import * as path from "path";
import { fileURLToPath } from "url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const PROFILE_DIR = path.join(PROJECT_ROOT, ".local/playwright-x-profile");
const SCHEDULED_URL = "https://x.com/compose/post/unsent/scheduled";
const EXPECT_ACCOUNT = "stats47jp373";
const MAX_ROUNDS = 6;

function parseArgs(argv: string[]) {
  const matches: string[] = [];
  let commit = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--match") matches.push(argv[++i] ?? "");
    else if (argv[i] === "--commit") commit = true;
  }
  if (matches.length === 0 || matches.some((m) => m.trim().length < 8)) {
    throw new Error("--match に予約本文の先頭を 8 文字以上で 1 つ以上指定する");
  }
  return { matches: matches.map((m) => m.trim()), commit };
}

/** 予約カードの本文 (先頭の「〜に送信されます」行を除く) */
function bodyOf(cardText: string): string {
  return cardText.split("\n").slice(1).join("\n").trim();
}

async function openList(page: Page): Promise<string[]> {
  await page.goto(SCHEDULED_URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000);
  if (!page.url().startsWith(SCHEDULED_URL)) throw new Error(`予約一覧を開けない (ログイン切れの可能性): ${page.url()}`);
  const account = await page.locator(`[data-testid="UserAvatar-Container-${EXPECT_ACCOUNT}"]`).count();
  if (account === 0) throw new Error(`期待したアカウント @${EXPECT_ACCOUNT} ではない`);
  return page.locator('[data-testid="unsentTweet"]').allInnerTexts();
}

async function main() {
  const { matches, commit } = parseArgs(process.argv.slice(2));
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = context.pages()[0] || (await context.newPage());
  try {
    const isTarget = (text: string) => matches.some((m) => bodyOf(text).startsWith(m));
    let cards = await openList(page);
    const keepCount = cards.filter((t) => !isTarget(t)).length;
    console.log(`予約 ${cards.length} 件 / 取り消し対象 ${cards.length - keepCount} 件`);
    for (const t of cards.filter(isTarget)) console.log(`  - ${t.split("\n")[0]} | ${bodyOf(t).slice(0, 40)}`);
    const unmatched = matches.filter((m) => !cards.some((t) => bodyOf(t).startsWith(m)));
    if (unmatched.length > 0) console.warn(`⚠ 一覧に見つからない: ${unmatched.join(" / ")}`);
    if (!commit) {
      console.log("(照合だけ。取り消すには --commit)");
      return;
    }

    for (let round = 1; round <= MAX_ROUNDS; round++) {
      const targets = cards.filter(isTarget).length;
      if (targets === 0) break;
      await page.getByRole("button", { name: "編集" }).first().click();
      await page.waitForTimeout(1500);
      const items = page.locator('[data-testid="unsentTweet"]');
      let selected = 0;
      for (let i = 0; i < (await items.count()); i++) {
        if (!isTarget(await items.nth(i).innerText())) continue;
        await items.nth(i).click();
        selected++;
      }
      if (selected === 0) break;
      await page.getByRole("button", { name: "削除" }).first().click();
      await page.locator('[data-testid="confirmationSheetConfirm"]').click();
      await page.waitForTimeout(3000);
      cards = await openList(page);
      const kept = cards.filter((t) => !isTarget(t)).length;
      console.log(`round ${round}: ${selected} 件を削除 → 残りの対象 ${cards.filter(isTarget).length} 件 / 対象外 ${kept} 件`);
      if (kept !== keepCount) throw new Error(`対象外の予約が ${keepCount} → ${kept} 件に変わった。止める`);
    }
    const left = cards.filter(isTarget).length;
    if (left > 0) throw new Error(`${MAX_ROUNDS} 回で消しきれない (残り ${left} 件)`);
    console.log("✓ 取り消し完了 (読み直しで対象 0 件・対象外は不変)");
  } finally {
    await context.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
