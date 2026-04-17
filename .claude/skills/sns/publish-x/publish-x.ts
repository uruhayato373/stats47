/**
 * X (Twitter) 予約投稿スクリプト — Playwright 版
 *
 * 使い方:
 *   npx tsx .claude/skills/sns/publish-x/publish-x.ts \
 *     annual-income-per-household 2026-04-12T08:00 \
 *     divorces-per-total-population 2026-04-14T08:00
 *
 * 引数: <rankingKey> <scheduleDateTimeJST> のペアを繰り返し指定
 *   --domain ranking|compare|correlation|blog (デフォルト: ranking)
 *   --immediate  予約ではなく即時投稿（⚠️ 明示指定が必要、デフォルトは予約）
 *   --dry-run    実投稿せずセレクタ検出まで確認（初回必須）
 *
 * 事故履歴（2026-04-18）:
 *   Sprint 1 Day 2-5 を予約投稿したつもりが 4 件全て即時投稿された。
 *   原因: 予約モード検出に失敗しても「投稿は継続」のフォールバックで
 *         tweetButton を押下 → X UI 的には即時投稿ボタンが作動。
 *   対策: fail-safe 化（予約モード未確認なら Escape で投稿中止）+
 *         dry-run モード追加 + 失敗時 screenshot 保存。
 */
import { chromium, type BrowserContext, type Page } from "playwright";
import * as path from "path";
import * as fs from "fs";

// ─── 設定 ──────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, "../../../..");
const PROFILE_DIR = path.join(PROJECT_ROOT, ".local/playwright-x-profile");
const DEBUG_DIR = path.join(PROJECT_ROOT, ".local/playwright-x-debug");
const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);

let IS_DRY_RUN = false;

// 失敗時に screenshot を保存（後で人間が検証可能）
async function saveScreenshot(
  page: Page,
  contentKey: string,
  label: string
): Promise<void> {
  if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
  }
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const filepath = path.join(DEBUG_DIR, `${ts}_${contentKey}_${label}.png`);
  try {
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 screenshot: ${filepath}`);
  } catch (e) {
    console.error(`screenshot 失敗: ${e}`);
  }
}

interface PostConfig {
  contentKey: string;
  domain: string;
  captionPath: string;
  imagePaths: string[];
  scheduledDate: Date | null; // null = 即時投稿
}

// ─── 引数パース ────────────────────────────────────
function parseArgs(): { posts: PostConfig[]; immediate: boolean } {
  const args = process.argv.slice(2);
  let domain = "ranking";
  let immediate = false;
  const pairs: { key: string; date: string | null }[] = [];

  let i = 0;
  while (i < args.length) {
    if (args[i] === "--domain") {
      domain = args[++i];
    } else if (args[i] === "--immediate") {
      immediate = true;
    } else if (args[i] === "--dry-run") {
      IS_DRY_RUN = true;
      console.log("🧪 DRY RUN モード: 実投稿はせず、セレクタ検出まで確認");
    } else {
      const key = args[i];
      const dateStr = !immediate && i + 1 < args.length && !args[i + 1].startsWith("-")
        ? args[++i]
        : null;
      pairs.push({ key, date: dateStr });
    }
    i++;
  }

  if (pairs.length === 0) {
    console.error(
      "使い方: npx tsx publish-x.ts <rankingKey> <YYYY-MM-DDTHH:MM> [<rankingKey> <date> ...] [--domain ranking]"
    );
    process.exit(1);
  }

  const posts = pairs.map(({ key, date }) => {
    const baseDir = path.join(
      PROJECT_ROOT,
      `.local/r2/sns/${domain}/${key}`
    );
    const captionPath = path.join(baseDir, "x/caption.txt");
    const chartPath = path.join(baseDir, "x/stills/chart-x-1200x630.png");
    const mapPath = path.join(baseDir, "x/stills/choropleth-map-1200x630.png");

    // コロプレス地図1枚を優先（スクロール停止力が高く、テキストと情報が重複しない）
    const imagePaths: string[] = [];
    if (fs.existsSync(mapPath)) imagePaths.push(mapPath);
    else if (fs.existsSync(chartPath)) imagePaths.push(chartPath);

    if (!fs.existsSync(captionPath)) {
      console.error(`caption.txt が見つかりません: ${captionPath}`);
      process.exit(1);
    }

    return {
      contentKey: key,
      domain,
      captionPath,
      imagePaths,
      scheduledDate: date ? new Date(date + "+09:00") : null,
    };
  });

  return { posts, immediate };
}

// ─── ログイン確認 ──────────────────────────────────
async function ensureLogin(page: Page): Promise<void> {
  console.log("X.com にアクセスしています...");
  await page.goto("https://x.com/home", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  const url = page.url();
  if (url.includes("/login") || url.includes("/i/flow/login")) {
    console.log(
      "\n⚠️  X.com にログインが必要です。ブラウザでログインしてください。"
    );
    console.log("   ログイン完了後、自動的に続行します...\n");
    await page.waitForURL("**/home", { timeout: 300_000 });
    console.log("✅ ログイン完了！");
    await page.waitForTimeout(2000);
  } else {
    console.log("✅ ログイン済み");
  }
}

// ─── 予約投稿 ──────────────────────────────────────
async function publishPost(
  page: Page,
  post: PostConfig,
  index: number,
  total: number
): Promise<boolean> {
  const caption = fs.readFileSync(post.captionPath, "utf-8").trim();

  console.log(`\n━━━ 投稿 ${index + 1}/${total}: ${post.contentKey} ━━━`);
  if (post.scheduledDate) {
    console.log(
      `予約日時: ${post.scheduledDate.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`
    );
  } else {
    console.log("即時投稿");
  }
  console.log(`テキスト: ${caption.substring(0, 60)}...`);

  // compose 画面へ
  await page.goto("https://x.com/compose/post", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3000);

  // textbox が表示されるまで待機（compose ダイアログの準備完了を確認）
  const textbox = page.getByRole("textbox").first();
  await textbox.waitFor({ state: "visible", timeout: 15000 });

  // ── 画像アップロード（テキストより先に実行 — リンクカード展開前に添付）──
  if (post.imagePaths.length > 0) {
    // compose ダイアログは #layers 内。file input を正確に取得
    const fileInput = page.locator('input[data-testid="fileInput"]').first();
    await fileInput.setInputFiles(post.imagePaths);
    console.log(`📷 画像 ${post.imagePaths.length} 枚をアップロード中...`);
    // 画像プレビューが表示されるまで待機
    try {
      await page.locator('[data-testid="attachments"]').waitFor({ state: "visible", timeout: 10000 });
      console.log("📷 画像プレビュー表示確認OK");
    } catch {
      console.log("⚠️  画像プレビューが検出できませんでした（投稿は継続）");
    }
    await page.waitForTimeout(2000);
  }

  // ── テキスト入力（clipboard 経由で日本語対応）──
  await textbox.click();
  await page.waitForTimeout(500);

  await page.evaluate(async (text: string) => {
    const item = new ClipboardItem({
      "text/plain": new Blob([text], { type: "text/plain" }),
    });
    await navigator.clipboard.write([item]);
  }, caption);
  await page.keyboard.press("Meta+v");
  await page.waitForTimeout(2000);

  // ── 予約設定 or 即時投稿 ──
  if (post.scheduledDate) {
    const d = post.scheduledDate;
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours();
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    const minute = d.getMinutes();

    // 予約ボタンクリック（layers のオーバーレイを force で突破）
    const scheduleBtn = page
      .getByRole("button", { name: "ポストを予約" })
      .first();
    await scheduleBtn.waitFor({ state: "visible", timeout: 10000 });
    await scheduleBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // 日時セレクト設定
    const setSelect = async (testId: string, value: string) => {
      const el = page.locator(`[data-testid="${testId}"]`);
      if ((await el.count()) > 0) {
        await el.selectOption({ value });
        await page.waitForTimeout(300);
      }
    };
    await setSelect("scheduledDatePickerMonths", String(month));
    await setSelect("scheduledDatePickerDays", String(day));
    await setSelect("scheduledDatePickerHours", String(hour12));
    await setSelect(
      "scheduledDatePickerMinutes",
      String(minute).padStart(2, "0")
    );
    await setSelect("scheduledDatePickerMeridiem", ampm);

    // 確認ボタンをクリック → 予約モードに切り替わるのを待つ
    const confirmBtn = page.getByTestId(
      "scheduledConfirmationPrimaryAction"
    );
    if ((await confirmBtn.count()) === 0) {
      console.error(`🚨 予約確認ボタンが見つかりません: ${post.contentKey}`);
      await saveScreenshot(page, post.contentKey, "confirm-btn-missing");
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(1000);
      await page.keyboard.press("Escape").catch(() => {});
      return false;
    }
    await confirmBtn.click();
    await page.waitForTimeout(3000);

    // ★★★ FAIL-SAFE: 予約モード検出 ★★★
    // 2026-04-18 Sprint 1 事故（即時投稿）の再発防止。
    // 複数 indicator で予約モードへの切り替わりを確認、未確認なら投稿中止。
    const isScheduledMode = async (): Promise<boolean> => {
      const indicators = [
        page.locator('[data-testid="tweetButton"]:has-text("予約設定")'),
        page.locator('[data-testid="tweetButton"]:has-text("Schedule")'),
        page.locator('[data-testid="tweetButton"] span:text-is("予約設定")'),
        page.locator('[data-testid="tweetButton"] span:text-is("Schedule")'),
      ];
      for (const ind of indicators) {
        try {
          if ((await ind.count()) > 0) return true;
        } catch {
          // ignore
        }
      }
      return false;
    };

    let scheduledModeConfirmed = false;
    const confirmStart = Date.now();
    while (Date.now() - confirmStart < 8000) {
      if (await isScheduledMode()) {
        scheduledModeConfirmed = true;
        break;
      }
      await page.waitForTimeout(500);
    }

    if (!scheduledModeConfirmed) {
      console.error(
        `🚨 予約モード未確認、投稿中止（即時投稿を回避）: ${post.contentKey}`
      );
      console.error(
        `   X の UI が変更された可能性。screenshot を確認してセレクタを更新してください。`
      );
      await saveScreenshot(page, post.contentKey, "schedule-mode-not-confirmed");
      // コンポーザを閉じて次の投稿へ（即時投稿を絶対に発火させない）
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(1000);
      await page.keyboard.press("Escape").catch(() => {});
      return false;
    }

    console.log("📅 予約モード確認OK");

    // dry-run なら実投稿せず終了
    if (IS_DRY_RUN) {
      console.log(
        `🧪 dry-run: 予約モードまで到達、投稿はスキップ: ${post.contentKey}`
      );
      await saveScreenshot(page, post.contentKey, "dry-run-scheduled-mode");
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(1000);
      await page.keyboard.press("Escape").catch(() => {});
      return true;
    }

    // 予約投稿ボタンをクリック
    const postBtn = page.getByTestId("tweetButton").first();
    try {
      await postBtn.click({ timeout: 5000 });
    } catch {
      await postBtn.click({ force: true });
    }
    console.log(`✅ 予約投稿完了: ${post.contentKey}`);
    await page.waitForTimeout(3000);
    return true;
  }

  // ── 即時投稿 ──
  if (IS_DRY_RUN) {
    console.log(
      `🧪 dry-run: 即時投稿モード、投稿はスキップ: ${post.contentKey}`
    );
    await saveScreenshot(page, post.contentKey, "dry-run-immediate-mode");
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(1000);
    return true;
  }
  const postBtn = page.getByTestId("tweetButton").first();
  if ((await postBtn.count()) > 0) {
    await postBtn.click({ force: true });
    console.log(`✅ 即時投稿完了: ${post.contentKey}`);
    await page.waitForTimeout(3000);
    return true;
  }

  console.log("⚠️  投稿ボタンが見つかりません");
  await saveScreenshot(page, post.contentKey, "post-btn-missing");
  return false;
}

// ─── DB 更新 ───────────────────────────────────────
function updateDb(
  post: PostConfig,
  success: boolean
): void {
  if (!success || IS_DRY_RUN) return;

  const status = post.scheduledDate ? "posted" : "posted";
  const postedAt = post.scheduledDate
    ? post.scheduledDate.toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const caption = fs
    .readFileSync(post.captionPath, "utf-8")
    .trim()
    .replace(/'/g, "''");

  // better-sqlite3 は使わず sqlite3 CLI で実行（依存を増やさない）
  const { execSync } = require("child_process");
  const sql = `
    UPDATE sns_posts
    SET status = '${status}', posted_at = '${postedAt}'
    WHERE platform = 'x'
      AND content_key = '${post.contentKey}'
      AND domain = '${post.domain}'
      AND post_type = 'original'
      AND status IN ('draft', 'scheduled');

    UPDATE sns_posts
    SET caption = '${caption}'
    WHERE platform = 'x'
      AND content_key = '${post.contentKey}'
      AND domain = '${post.domain}'
      AND post_type = 'original'
      AND (caption IS NULL OR caption = '');
  `;
  try {
    execSync(`sqlite3 "${DB_PATH}" "${sql.replace(/"/g, '\\"')}"`, {
      cwd: PROJECT_ROOT,
    });
    console.log(`📝 DB 更新: ${post.contentKey} → ${status}`);
  } catch (e) {
    console.error(`DB 更新失敗: ${post.contentKey}`, e);
  }
}

// ─── メイン ────────────────────────────────────────
async function main() {
  const { posts, immediate } = parseArgs();

  console.log(`🚀 X ${immediate ? "即時" : "予約"}投稿スクリプトを開始します`);
  console.log(`   対象: ${posts.length} 件\n`);

  if (!fs.existsSync(PROFILE_DIR)) {
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
  }

  const context: BrowserContext = await chromium.launchPersistentContext(
    PROFILE_DIR,
    {
      headless: false,
      viewport: { width: 1280, height: 900 },
      locale: "ja-JP",
      timezoneId: "Asia/Tokyo",
      args: ["--disable-blink-features=AutomationControlled"],
    }
  );

  const page = context.pages()[0] || (await context.newPage());

  try {
    await ensureLogin(page);

    const results: { key: string; success: boolean }[] = [];
    for (let i = 0; i < posts.length; i++) {
      const success = await publishPost(page, posts[i], i, posts.length);
      results.push({ key: posts[i].contentKey, success });
      if (success) updateDb(posts[i], true);
      if (i < posts.length - 1) await page.waitForTimeout(2000);
    }

    console.log("\n━━━ 結果サマリー ━━━");
    for (const r of results) {
      console.log(`${r.success ? "✅" : "❌"} ${r.key}`);
    }
    const ok = results.filter((r) => r.success).length;
    console.log(`\n合計: ${ok}/${results.length} 件完了`);
  } catch (error) {
    console.error("エラー:", error);
  } finally {
    await page.waitForTimeout(5000);
    await context.close();
  }
}

main().catch(console.error);
