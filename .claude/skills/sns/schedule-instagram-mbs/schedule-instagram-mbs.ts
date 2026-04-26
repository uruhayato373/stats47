/**
 * Instagram 予約投稿スクリプト — Meta Business Suite UI 経由
 *
 * IG Graph API は `scheduled_publish_time` 非対応のため、MBS の Web UI を
 * Playwright で自動操作して予約投稿を作成する。
 *
 * 使い方:
 *   npx tsx .claude/skills/sns/schedule-instagram-mbs/schedule-instagram-mbs.ts \
 *     fiscal-strength-index-prefecture 2026-04-28T09:00 \
 *     local-tax-ratio-pref-finance 2026-04-30T09:00 \
 *     --domain bar-chart-race --type reels
 *
 * 引数: <rankingKey> <YYYY-MM-DDTHH:MM> [...] [--domain] [--type] [--dry-run]
 *
 * 設計:
 *   - 永続プロファイル (.local/playwright-meta-profile/) で FB ログインセッションを保持
 *   - 各 post で composer 開く → IG 選択 → upload → caption → schedule datetime → submit
 *   - schedule mode 未確認なら Escape で abort（即時投稿事故防止）
 */
import { chromium, type BrowserContext, type Page } from "playwright";
import * as path from "path";
import * as fs from "fs";
import Database from "better-sqlite3";

const PROJECT_ROOT = path.resolve(__dirname, "../../../..");
const PROFILE_DIR = path.join(PROJECT_ROOT, ".local/playwright-meta-profile");
const DEBUG_DIR = path.join(PROJECT_ROOT, ".local/playwright-meta-debug");
const LOCAL_R2_ROOT = path.join(PROJECT_ROOT, ".local/r2");
const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);

const MBS_HOME = "https://business.facebook.com/latest/home";
const MBS_COMPOSER = "https://business.facebook.com/latest/composer";

type PostType = "image" | "reels";
type Domain = "ranking" | "bar-chart-race";

interface PostSpec {
  contentKey: string;
  scheduledAt: string; // ISO 8601 JST
  domain: Domain;
  type: PostType;
  mediaPath: string;
  caption: string;
}

interface RunResult {
  contentKey: string;
  success: boolean;
  reason?: string;
}

// ----------------------------------------------------------------------------
// Args parsing
// ----------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  posts: { contentKey: string; scheduledAt: string }[];
  domain: Domain;
  type: PostType | undefined;
  dryRun: boolean;
} {
  const args = argv.slice(2);
  let domain: Domain = "ranking";
  let type: PostType | undefined;
  let dryRun = false;
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--domain") domain = args[++i] as Domain;
    else if (a === "--type") type = args[++i] as PostType;
    else if (a === "--dry-run") dryRun = true;
    else positional.push(a);
  }

  if (positional.length === 0 || positional.length % 2 !== 0) {
    console.error(
      "使い方: schedule-instagram-mbs.ts <key> <date> [<key> <date> ...] [--domain] [--type] [--dry-run]",
    );
    process.exit(1);
  }

  const posts: { contentKey: string; scheduledAt: string }[] = [];
  for (let i = 0; i < positional.length; i += 2) {
    posts.push({ contentKey: positional[i], scheduledAt: positional[i + 1] });
  }

  return { posts, domain, type, dryRun };
}

// ----------------------------------------------------------------------------
// PostSpec builder
// ----------------------------------------------------------------------------

function buildSpec(
  contentKey: string,
  scheduledAt: string,
  domain: Domain,
  forceType?: PostType,
): PostSpec {
  const baseDir = path.join(LOCAL_R2_ROOT, "sns", domain, contentKey, "instagram");
  if (!fs.existsSync(baseDir)) {
    throw new Error(`baseDir not found: ${baseDir}`);
  }

  const captionPath = path.join(baseDir, "caption.txt");
  if (!fs.existsSync(captionPath)) {
    throw new Error(`caption.txt not found: ${captionPath}`);
  }
  const caption = fs.readFileSync(captionPath, "utf-8").trim();

  const reelPath = path.join(baseDir, "reel.mp4");
  const stillsDir = path.join(baseDir, "stills");

  let type: PostType;
  let mediaPath: string;

  if (forceType === "reels" || (forceType === undefined && fs.existsSync(reelPath))) {
    if (!fs.existsSync(reelPath)) throw new Error(`reel.mp4 not found: ${reelPath}`);
    type = "reels";
    mediaPath = reelPath;
  } else {
    if (!fs.existsSync(stillsDir)) throw new Error(`stills dir not found: ${stillsDir}`);
    const pngs = fs.readdirSync(stillsDir).filter((f) => f.endsWith(".png"));
    if (pngs.length === 0) throw new Error(`no png in stills: ${stillsDir}`);
    type = "image";
    mediaPath = path.join(stillsDir, pngs[0]);
  }

  return { contentKey, scheduledAt, domain, type, mediaPath, caption };
}

// ----------------------------------------------------------------------------
// Debug screenshot
// ----------------------------------------------------------------------------

async function screenshot(page: Page, label: string): Promise<void> {
  if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const filepath = path.join(DEBUG_DIR, `${ts}_${label}.png`);
  try {
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 ${filepath}`);
  } catch (err) {
    console.log(`(screenshot failed: ${err})`);
  }
}

// ----------------------------------------------------------------------------
// Login check
// ----------------------------------------------------------------------------

async function ensureLogin(page: Page): Promise<void> {
  console.log("🔐 ログイン確認中...");
  await page.goto(MBS_HOME, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(3000);

  const url = page.url();
  if (url.includes("login") || url.includes("checkpoint") || !url.includes("business.facebook.com")) {
    console.log("⚠ ログインが必要です。ブラウザでログインしてください（最大 5 分待機）...");
    await page.waitForURL("**/business.facebook.com/**", { timeout: 300_000 });
    await page.waitForTimeout(2000);
  }
  console.log("✅ ログイン済");
}

// ----------------------------------------------------------------------------
// Schedule one post
// ----------------------------------------------------------------------------

async function schedulePost(
  page: Page,
  spec: PostSpec,
  index: number,
  total: number,
  dryRun: boolean,
): Promise<RunResult> {
  console.log(`\n━━━ 投稿 ${index + 1}/${total}: ${spec.contentKey} (${spec.type}) ━━━`);
  console.log(`予約日時: ${spec.scheduledAt}`);
  console.log(`メディア: ${spec.mediaPath}`);
  console.log(`Caption (先頭 80): ${spec.caption.slice(0, 80)}...`);

  try {
    // --- Step 1: composer 開く ---
    console.log("📝 composer を開く...");
    await page.goto(MBS_COMPOSER, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(5000);
    await screenshot(page, `${spec.contentKey}_01_composer_loaded`);

    // --- Step 2: Instagram account 選択（必要なら） ---
    // composer の左サイドにアカウント選択 checkbox があるパターン
    // stats47jp のラベルを含む checkbox を探す
    console.log("📷 Instagram account 選択...");
    const igCheckbox = page.locator('label:has-text("stats47jp"), [aria-label*="stats47jp"]').first();
    const igVisible = await igCheckbox.isVisible({ timeout: 5000 }).catch(() => false);
    if (igVisible) {
      const checked = await igCheckbox.evaluate((el: HTMLElement) => {
        const input = el.querySelector("input") || (el as HTMLInputElement);
        return (input as HTMLInputElement)?.checked ?? false;
      }).catch(() => false);
      if (!checked) {
        await igCheckbox.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(1000);
      }
      console.log("  IG account 選択 OK");
    } else {
      console.log("  ⚠ IG account checkbox 未検出（既に選択済 or UI 変更）");
    }

    // --- Step 3: メディア upload ---
    console.log(`📁 メディア upload: ${path.basename(spec.mediaPath)}`);
    const fileInput = page.locator('input[type="file"]').first();
    const fileInputVisible = await fileInput.isVisible({ timeout: 5000 }).catch(() => true); // hidden file inputs are common
    if (!await fileInput.count()) {
      await screenshot(page, `${spec.contentKey}_02_no_file_input`);
      throw new Error("file input が見つからない");
    }
    await fileInput.setInputFiles(spec.mediaPath);
    await page.waitForTimeout(spec.type === "reels" ? 30_000 : 8_000); // reels は処理に時間
    await screenshot(page, `${spec.contentKey}_03_media_uploaded`);

    // --- Step 4: Caption 入力（ClipboardEvent paste で確実に） ---
    console.log("✏️ Caption 入力...");
    const captionBox = page.locator('[contenteditable="true"], textarea').first();
    const captionVisible = await captionBox.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!captionVisible) {
      await screenshot(page, `${spec.contentKey}_04_no_caption_box`);
      throw new Error("caption 入力欄が見つからない");
    }
    await captionBox.click();
    await page.waitForTimeout(500);
    await page.evaluate(async (text: string) => {
      await navigator.clipboard.writeText(text);
    }, spec.caption);
    await page.keyboard.press("Meta+v");
    await page.waitForTimeout(2000);
    await screenshot(page, `${spec.contentKey}_05_caption_entered`);

    // --- Step 5: Schedule option を開く ---
    console.log("📅 Schedule option を開く...");
    const scheduleToggle = page.locator(
      'button:has-text("Schedule"), button:has-text("予約"), [aria-label*="Schedule"], [aria-label*="予約"]',
    ).first();
    const toggleVisible = await scheduleToggle.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!toggleVisible) {
      await screenshot(page, `${spec.contentKey}_06_no_schedule_toggle`);
      throw new Error("schedule toggle が見つからない");
    }
    await scheduleToggle.click();
    await page.waitForTimeout(2000);
    await screenshot(page, `${spec.contentKey}_07_schedule_dialog`);

    // --- Step 6: 日時入力 ---
    // MBS の日時入力は date input + time input or 単一 datetime-local input
    console.log("🕐 日時設定...");
    const [datePart, timePart] = spec.scheduledAt.split("T");
    // 試行 1: date + time 別フィールド
    const dateInput = page.locator('input[type="date"], input[aria-label*="Date"], input[aria-label*="日付"]').first();
    const timeInput = page.locator('input[type="time"], input[aria-label*="Time"], input[aria-label*="時刻"]').first();
    const dateVisible = await dateInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (dateVisible) {
      await dateInput.fill(datePart);
      await page.waitForTimeout(500);
      const timeVisible = await timeInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (timeVisible) {
        await timeInput.fill(timePart);
        await page.waitForTimeout(500);
      }
    } else {
      // 試行 2: datetime-local
      const dtInput = page.locator('input[type="datetime-local"]').first();
      if (await dtInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dtInput.fill(spec.scheduledAt);
        await page.waitForTimeout(500);
      } else {
        await screenshot(page, `${spec.contentKey}_08_no_datetime_input`);
        throw new Error("date/time 入力欄が見つからない (UI 変更の可能性)");
      }
    }
    await screenshot(page, `${spec.contentKey}_09_datetime_set`);

    // --- Step 7: schedule mode 確認 ---
    console.log("🔍 schedule mode 確認...");
    const submitBtn = page.locator(
      'button:has-text("Schedule"), button:has-text("予約投稿"), button:has-text("予約")',
    ).last();
    const submitText = await submitBtn.textContent({ timeout: 5000 }).catch(() => "");
    if (!submitText || (!submitText.includes("Schedule") && !submitText.includes("予約"))) {
      console.log(`  🚨 submit button text: "${submitText}" — schedule mode 未確認`);
      await screenshot(page, `${spec.contentKey}_10_schedule_mode_unconfirmed`);
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(1000);
      await page.keyboard.press("Escape").catch(() => {});
      throw new Error("schedule mode 未確認、即時投稿事故防止のため abort");
    }
    console.log(`  ✅ submit button: "${submitText}"`);

    if (dryRun) {
      console.log("🧪 dry-run: ここで abort（実投稿せず）");
      await screenshot(page, `${spec.contentKey}_11_dryrun_complete`);
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(1000);
      await page.keyboard.press("Escape").catch(() => {});
      return { contentKey: spec.contentKey, success: true, reason: "dry-run OK" };
    }

    // --- Step 8: 本番 Submit ---
    console.log("🚀 Submit...");
    await submitBtn.click();
    await page.waitForTimeout(8000);
    await screenshot(page, `${spec.contentKey}_12_submitted`);

    return { contentKey: spec.contentKey, success: true };
  } catch (err) {
    console.error(`❌ エラー: ${err}`);
    return {
      contentKey: spec.contentKey,
      success: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

// ----------------------------------------------------------------------------
// DB update
// ----------------------------------------------------------------------------

function updateDb(spec: PostSpec): void {
  if (!fs.existsSync(DB_PATH)) {
    console.log(`⚠ DB not found: ${DB_PATH}`);
    return;
  }
  const db = new Database(DB_PATH);
  try {
    db.prepare(
      `UPDATE sns_posts
       SET status = 'scheduled', scheduled_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE platform = 'instagram' AND content_key = ? AND domain = ? AND status = 'draft'`,
    ).run(spec.scheduledAt, spec.contentKey, spec.domain);
    console.log(`📝 DB 更新: ${spec.contentKey} → scheduled`);
  } finally {
    db.close();
  }
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function main(): Promise<void> {
  const { posts: rawPosts, domain, type, dryRun } = parseArgs(process.argv);

  // Build specs（ファイル存在チェック）
  const specs: PostSpec[] = [];
  for (const p of rawPosts) {
    try {
      specs.push(buildSpec(p.contentKey, p.scheduledAt, domain, type));
    } catch (err) {
      console.error(`❌ ${p.contentKey}: ${err}`);
      process.exit(1);
    }
  }

  console.log(`🚀 IG 予約投稿 (MBS UI 経由) 開始`);
  console.log(`   対象: ${specs.length} 件 (dry-run=${dryRun})`);

  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

  const context: BrowserContext = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    permissions: ["clipboard-read", "clipboard-write"],
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = context.pages()[0] || (await context.newPage());

  try {
    await ensureLogin(page);

    const results: RunResult[] = [];
    for (let i = 0; i < specs.length; i++) {
      const r = await schedulePost(page, specs[i], i, specs.length, dryRun);
      results.push(r);
      if (r.success && !dryRun) updateDb(specs[i]);
      if (i < specs.length - 1) await page.waitForTimeout(3000);
    }

    console.log("\n━━━ 結果サマリー ━━━");
    for (const r of results) {
      console.log(
        `${r.success ? "✅" : "❌"} ${r.contentKey}${r.reason ? ` — ${r.reason}` : ""}`,
      );
    }
    const ok = results.filter((r) => r.success).length;
    console.log(`\n合計: ${ok}/${results.length} 件完了`);
  } catch (err) {
    console.error(`致命的エラー: ${err}`);
  } finally {
    await page.waitForTimeout(5000);
    await context.close();
  }
}

main().catch((err) => {
  console.error("Unhandled:", err);
  process.exit(1);
});
