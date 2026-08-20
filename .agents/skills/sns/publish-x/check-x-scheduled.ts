/**
 * X の予約投稿一覧を確認するスクリプト
 */
import { chromium } from "playwright";
import * as path from "path";

const PROJECT_ROOT = "/Users/minamidaisuke/stats47";
const PROFILE_DIR = path.join(PROJECT_ROOT, ".local/playwright-x-profile");

async function main() {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = context.pages()[0] || (await context.newPage());

  try {
    console.log("📋 X の予約投稿一覧を確認...");
    await page.goto("https://x.com/home", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    // compose → Unsent Tweets → Scheduled
    await page.goto("https://x.com/compose/post/unsent/scheduled", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(5000);

    // 予約投稿カードを列挙
    const items = await page
      .locator('article[role="article"], [data-testid="tweet"]')
      .all();
    console.log(`予約投稿: ${items.length} 件`);

    // ページ全体のテキストから予約日時を抽出
    // 2026-04 以降 X UI が 24時間制に刷新されたため「午前/午後」は表示されない
    // 予約日時は "2026/4/21 08:00" 形式や「X曜日」などで表示される
    const bodyText = await page.evaluate(() => document.body.innerText);
    const scheduled = bodyText
      .split("\n")
      .filter(
        (l) =>
          l.includes("予約") ||
          /2026|2027/.test(l) ||
          /\d{1,2}:\d{2}/.test(l)
      );
    console.log("予約日時行候補:");
    scheduled.slice(0, 20).forEach((l) => console.log("  " + l));

    // プロフィール最新投稿も確認（即時投稿されていれば表示される）
    console.log("\n📊 最新投稿（profile timeline）:");
    await page.goto("https://x.com/stats47jp373", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(5000);

    const timelineArticles = await page
      .locator('article[data-testid="tweet"]')
      .all();
    console.log(`表示中の投稿: ${timelineArticles.length} 件（上位 5 件）`);

    for (let i = 0; i < Math.min(5, timelineArticles.length); i++) {
      const text = await timelineArticles[i].innerText().catch(() => "");
      const lines = text.split("\n").slice(0, 5);
      console.log(`--- ${i + 1} ---`);
      lines.forEach((l) => console.log("  " + l));
    }

    // 10 秒待機してブラウザ閉じる（目視確認用）
    console.log("\n⏱️  10 秒待機後にブラウザを閉じます（目視確認してください）");
    await page.waitForTimeout(10000);
  } finally {
    await context.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
