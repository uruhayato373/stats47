/**
 * Instagram 投稿削除スクリプト (Playwright)
 *
 * Graph API は媒体削除をサポートしないため、UI 自動操作で削除する。
 * 永続プロファイル `.local/playwright-ig-profile/` を使用、初回は手動ログイン必要。
 *
 * 使い方:
 *   npx tsx .claude/scripts/sns/delete-instagram-posts.ts --domain migration-flow            # 実削除
 *   npx tsx .claude/scripts/sns/delete-instagram-posts.ts --domain migration-flow --dry-run  # URL 列挙のみ
 *
 * 対象: D1 sns_posts で domain=$DOMAIN AND platform='instagram' AND status='posted' の post_url
 */
import * as path from "path";
import Database from "better-sqlite3";
import { chromium, type Page } from "playwright";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const PROFILE_DIR = path.join(PROJECT_ROOT, ".local/playwright-ig-profile");
const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const domain = (() => {
  const i = args.indexOf("--domain");
  return i >= 0 ? args[i + 1] : "migration-flow";
})();

interface Target {
  id: number;
  contentKey: string;
  postUrl: string;
}

async function tryClick(page: Page, selectors: string[], desc: string): Promise<boolean> {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if ((await el.count()) > 0) {
        await el.click({ timeout: 3000 });
        return true;
      }
    } catch {
      // try next
    }
  }
  console.warn(`  ⚠️  ${desc} セレクタ未ヒット: ${selectors.join(" / ")}`);
  return false;
}

async function deletePost(page: Page, t: Target): Promise<boolean> {
  await page.goto(t.postUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(3000);

  // 投稿ページに到達したか確認 (本人投稿のみ削除可能)
  const pageNotFound = await page
    .locator("text=ページが見つかりません")
    .count()
    .catch(() => 0);
  if (pageNotFound > 0) {
    console.warn(`  ⚠️  ${t.contentKey} ページ消失 (既削除?)`);
    return false;
  }

  // ⋯ More options ボタン (本人投稿のヘッダー右側)
  const moreOk = await tryClick(
    page,
    [
      'svg[aria-label="More options"]',
      'svg[aria-label="その他のオプション"]',
      'button:has(svg[aria-label*="ption"])',
    ],
    "More options",
  );
  if (!moreOk) return false;
  await page.waitForTimeout(1000);

  // 「削除」menu item (赤テキスト)
  const deleteOk = await tryClick(
    page,
    [
      'div[role="button"]:has-text("削除")',
      'button:has-text("削除")',
      'div[role="dialog"] :text("削除")',
    ],
    "削除メニュー",
  );
  if (!deleteOk) return false;
  await page.waitForTimeout(1500);

  // 確認 dialog の「削除」
  const confirmOk = await tryClick(
    page,
    [
      'div[role="dialog"] button:has-text("削除")',
      'div[role="dialog"] :text-is("削除")',
    ],
    "削除確認",
  );
  if (!confirmOk) return false;
  await page.waitForTimeout(3000);

  return true;
}

async function main() {
  const db = new Database(DB_PATH);
  const targets: Target[] = db
    .prepare(
      `SELECT id, content_key as contentKey, post_url as postUrl
       FROM sns_posts
       WHERE domain=? AND platform='instagram' AND status='posted'
       ORDER BY posted_at`,
    )
    .all(domain) as Target[];
  console.log(`対象: ${targets.length} 件 (domain=${domain})`);
  if (targets.length === 0) {
    db.close();
    return;
  }
  if (DRY) {
    for (const t of targets) console.log(`  ${t.contentKey} ${t.postUrl}`);
    db.close();
    return;
  }

  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();

  await page.goto("https://www.instagram.com/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(2500);
  const loggedIn = (await page.locator('svg[aria-label="ホーム"], svg[aria-label="Home"]').count()) > 0;
  if (!loggedIn) {
    console.log("⚠️  未ログイン。手動ログインしてください (5 分以内)。");
    try {
      await page.waitForSelector('svg[aria-label="ホーム"], svg[aria-label="Home"]', {
        timeout: 5 * 60_000,
      });
    } catch {
      console.error("❌ ログイン未完了でタイムアウト");
      await ctx.close();
      process.exit(1);
    }
  }
  console.log("✅ ログイン済み");

  let deleted = 0;
  let failed = 0;
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    console.log(`\n━━━ ${i + 1}/${targets.length}: ${t.contentKey} ━━━`);
    try {
      const ok = await deletePost(page, t);
      if (ok) {
        db.prepare(`UPDATE sns_posts SET status='deleted' WHERE id=?`).run(t.id);
        console.log(`✅ 削除完了: ${t.contentKey}`);
        deleted += 1;
      } else {
        failed += 1;
      }
    } catch (err) {
      console.error(`❌ エラー: ${t.contentKey}: ${(err as Error).message}`);
      failed += 1;
    }
    await page.waitForTimeout(2000);
  }

  console.log(`\n=== 結果 ===`);
  console.log(`削除: ${deleted} / ${targets.length}`);
  console.log(`失敗: ${failed}`);
  await ctx.close();
  db.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
