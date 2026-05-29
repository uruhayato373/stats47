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
// 投稿先アカウントの取り違え防止ガード。設定時、ログイン中の @handle がこれと一致するまで
// 投稿しない（一致するまで最大5分待機、タイムアウトで中止）。@ は付けても付けなくても可。
let EXPECT_ACCOUNT: string | null = null;

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
  /** メディアが動画(mp4)か。動画はアップロード処理に時間がかかる */
  isVideo: boolean;
  scheduledDate: Date | null; // null = 即時投稿
  /** DB (sns_posts) 更新をスキップ。任意動画 (rankingKey 紐付け無し) で使用 */
  skipDb?: boolean;
  /** 投稿種別。quote_rt は引用RT (sns_posts へ INSERT)、original は予約/即時投稿 (UPDATE) */
  postType: "original" | "quote_rt";
  /** 引用元ツイート URL。設定時は caption 末尾に付与し X が引用カードを自動生成する */
  quoteUrl?: string;
}

// ─── 引数パース ────────────────────────────────────
function parseArgs(): { posts: PostConfig[]; immediate: boolean } {
  const args = process.argv.slice(2);
  let domain = "ranking";
  let immediate = false;
  let customMedia: string | null = null;
  let customCaption: string | null = null;
  let skipDb = false;
  let quoteUrl: string | null = null;
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
    } else if (args[i] === "--media") {
      customMedia = args[++i];
    } else if (args[i] === "--caption") {
      customCaption = args[++i];
    } else if (args[i] === "--quote-url") {
      quoteUrl = args[++i];
    } else if (args[i] === "--expect-account") {
      EXPECT_ACCOUNT = args[++i].replace(/^@/, "");
    } else if (args[i] === "--skip-db") {
      skipDb = true;
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
      "使い方:\n" +
        "  rankingKey ベース: npx tsx publish-x.ts <rankingKey> <YYYY-MM-DDTHH:MM> [...] [--domain ranking]\n" +
        "  任意動画:         npx tsx publish-x.ts <content-key> <YYYY-MM-DDTHH:MM> --media <path> --caption <path> [--skip-db]\n" +
        "  引用RT:           npx tsx publish-x.ts <content-key> [<YYYY-MM-DDTHH:MM>] --quote-url <tweetUrl> --caption <path> [--media <path>] [--domain ranking|gis-cross]"
    );
    process.exit(1);
  }

  // 引用RTモード: --quote-url を起点に判定。--caption 必須・--media は opt-in (任意添付)
  if (quoteUrl !== null) {
    if (!customCaption) {
      console.error("--quote-url モードでは --caption <path> が必須です");
      process.exit(1);
    }
    if (pairs.length !== 1) {
      console.error("--quote-url モードでは <content-key> [<date>] を 1 件のみ指定してください");
      process.exit(1);
    }
    if (!fs.existsSync(customCaption)) {
      console.error(`キャプションファイルが見つかりません: ${customCaption}`);
      process.exit(1);
    }
    if (customMedia && !fs.existsSync(customMedia)) {
      console.error(`動画ファイルが見つかりません: ${customMedia}`);
      process.exit(1);
    }
    const { key, date } = pairs[0];
    const imagePaths = customMedia ? [customMedia] : [];
    const isVideo = customMedia ? customMedia.toLowerCase().endsWith(".mp4") : false;
    const post: PostConfig = {
      contentKey: key,
      domain,
      captionPath: customCaption,
      imagePaths,
      isVideo,
      scheduledDate: date ? new Date(date + "+09:00") : null,
      skipDb,
      postType: "quote_rt",
      quoteUrl,
    };
    return { posts: [post], immediate };
  }

  // 任意動画モード: --media と --caption を 1 つの投稿として扱う
  const isCustomMode = customMedia !== null || customCaption !== null;
  if (isCustomMode) {
    if (!customMedia || !customCaption) {
      console.error("--media と --caption は両方指定する必要があります");
      process.exit(1);
    }
    if (pairs.length !== 1) {
      console.error("--media / --caption モードでは <content-key> <date> を 1 件のみ指定してください");
      process.exit(1);
    }
    if (!fs.existsSync(customMedia)) {
      console.error(`動画ファイルが見つかりません: ${customMedia}`);
      process.exit(1);
    }
    if (!fs.existsSync(customCaption)) {
      console.error(`キャプションファイルが見つかりません: ${customCaption}`);
      process.exit(1);
    }
    const { key, date } = pairs[0];
    const isVideo = customMedia.toLowerCase().endsWith(".mp4");
    const post: PostConfig = {
      contentKey: key,
      domain: "custom",
      captionPath: customCaption,
      imagePaths: [customMedia],
      isVideo,
      scheduledDate: date ? new Date(date + "+09:00") : null,
      skipDb,
      postType: "original",
    };
    return { posts: [post], immediate };
  }

  const posts = pairs.map(({ key, date }) => {
    const baseDir = path.join(
      PROJECT_ROOT,
      `.local/r2/sns/${domain}/${key}`
    );
    const captionPath = path.join(baseDir, "x/caption.txt");
    const stillsDir = path.join(baseDir, "x/stills");
    const chartPath = path.join(stillsDir, "chart-x-1200x630.png");
    const mapPath = path.join(stillsDir, "choropleth-map-1200x630.png");

    // メディア解決: stills/ に .mp4 があれば動画を最優先（X は動画 or 画像の一方のみ）。
    // 動画がなければ従来どおりコロプレス地図 → チャートの順で画像 1 枚。
    const imagePaths: string[] = [];
    let isVideo = false;
    const videoFile = fs.existsSync(stillsDir)
      ? fs.readdirSync(stillsDir).find((f) => f.toLowerCase().endsWith(".mp4"))
      : undefined;
    if (videoFile) {
      imagePaths.push(path.join(stillsDir, videoFile));
      isVideo = true;
    } else if (fs.existsSync(mapPath)) {
      imagePaths.push(mapPath);
    } else if (fs.existsSync(chartPath)) {
      imagePaths.push(chartPath);
    }

    if (!fs.existsSync(captionPath)) {
      console.error(`caption.txt が見つかりません: ${captionPath}`);
      process.exit(1);
    }

    return {
      contentKey: key,
      domain,
      captionPath,
      imagePaths,
      isVideo,
      scheduledDate: date ? new Date(date + "+09:00") : null,
      postType: "original" as const,
    };
  });

  return { posts, immediate };
}

// ─── ログイン確認 ──────────────────────────────────
// ログアウト時の X は /login ではなく x.com/ (ランディング) にリダイレクトするため、
// URL 判定では誤検知する。ログイン中だけ現れる UI 要素の有無で判定する。
async function isLoggedIn(page: Page): Promise<boolean> {
  // ログイン操作中はページ遷移が頻発し evaluate の実行コンテキストが壊れることがある。
  // その場合は false を返してポーリングを継続させる（例外で中断させない）。
  return page
    .evaluate(
      () =>
        !!(
          document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]') ||
          document.querySelector('[data-testid="SideNav_NewTweet_Button"]') ||
          document.querySelector('[data-testid="AppTabBar_Home_Link"]')
        )
    )
    .catch(() => false);
}

// ログイン中の @handle を profile link href (/username) から取得（最も確実）。
async function currentHandle(page: Page): Promise<string> {
  return page
    .evaluate(() => {
      const el = document.querySelector('[data-testid="AppTabBar_Profile_Link"]');
      const href = el ? el.getAttribute("href") || "" : "";
      return href.replace(/^\//, "");
    })
    .catch(() => "");
}

// ログイン確認 + アカウント取り違え防止。
// EXPECT_ACCOUNT 設定時は、その @handle になるまで投稿しない（切替/再ログインを待つ）。
async function ensureLogin(page: Page): Promise<void> {
  console.log("X.com にアクセスしています...");
  await page.goto("https://x.com/home", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  if (EXPECT_ACCOUNT) {
    console.log(`🔒 期待アカウント: @${EXPECT_ACCOUNT}（一致するまで投稿しません）`);
  }

  const ok = async (): Promise<boolean> => {
    if (!(await isLoggedIn(page))) return false;
    const handle = await currentHandle(page);
    if (!EXPECT_ACCOUNT) {
      console.log(`✅ ログイン済み${handle ? ` (@${handle})` : ""}`);
      return true;
    }
    if (handle.toLowerCase() === EXPECT_ACCOUNT.toLowerCase()) {
      console.log(`✅ ログイン済み (@${handle}) — 期待アカウント一致`);
      return true;
    }
    return false;
  };

  if (await ok()) {
    await page.waitForTimeout(1000);
    return;
  }

  // 未ログイン or 別アカウント → 切替/ログインを待つ
  const start = Date.now();
  let lastMsg = "";
  while (Date.now() - start < 300_000) {
    const logged = await isLoggedIn(page);
    const handle = logged ? await currentHandle(page) : "";
    const msg = logged
      ? `⚠️  現在 @${handle || "?"} にログイン中。ブラウザで @${EXPECT_ACCOUNT} に切り替え（またはログインし直し）てください…`
      : `⚠️  X 未ログインです。ブラウザで @${EXPECT_ACCOUNT ?? "投稿先アカウント"} にログインしてください…`;
    if (msg !== lastMsg) {
      console.log(`\n${msg}（最大5分待機）\n`);
      lastMsg = msg;
    }
    await page.waitForTimeout(2500);
    if (await ok()) {
      await page.waitForTimeout(1500);
      return;
    }
  }
  throw new Error(
    `ログイン待ちタイムアウト（5分）。${EXPECT_ACCOUNT ? `@${EXPECT_ACCOUNT} にログインしてから` : "ログインしてから"}再実行してください。`
  );
}

// ─── 予約投稿 ──────────────────────────────────────
async function publishPost(
  page: Page,
  post: PostConfig,
  index: number,
  total: number
): Promise<boolean> {
  let caption = fs.readFileSync(post.captionPath, "utf-8").trim();
  if (post.quoteUrl) {
    // 引用元ツイート URL を末尾に付与 → X が引用カードを自動生成する。
    // メディア (--media) も併せて添付されている場合は、引用カード上部に動画が並ぶ。
    caption = `${caption}\n\n${post.quoteUrl}`;
  }

  console.log(`\n━━━ 投稿 ${index + 1}/${total}: ${post.contentKey}${post.postType === "quote_rt" ? " (引用RT)" : ""} ━━━`);
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

  // ── メディアアップロード（テキストより先に実行 — リンクカード展開前に添付）──
  if (post.imagePaths.length > 0) {
    // file input: testid 優先、見つからなければ素の input[type=file] にフォールバック
    // (X UI で testid が変わるケースの保険)
    const fileInput = page
      .locator('input[data-testid="fileInput"], input[type="file"]')
      .first();
    await fileInput.setInputFiles(post.imagePaths);
    console.log(
      `📷 ${post.isVideo ? "動画" : `画像 ${post.imagePaths.length} 枚`}をアップロード中...`,
    );
    // プレビューが表示されるまで待機（動画は処理が長いため長めに）
    try {
      await page.locator('[data-testid="attachments"]').waitFor({
        state: "visible",
        timeout: post.isVideo ? 30000 : 10000,
      });
      console.log("📷 プレビュー表示確認OK");
    } catch {
      console.log("⚠️  プレビューが検出できませんでした（投稿は継続）");
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

  // ── 動画エンコード完了待ち ──
  // 動画添付中は投稿ボタンが aria-disabled。完了前に投稿するとメディアなし
  // 投稿 or 投稿失敗になるため、ボタンが有効化されるまで待つ（最大 3 分）。
  if (post.isVideo) {
    console.log("⏳ 動画処理の完了を待機中（投稿ボタン有効化）...");
    const ready = await page
      .waitForFunction(
        () => {
          const btn = document.querySelector(
            '[data-testid="tweetButton"]',
          );
          return !!btn && btn.getAttribute("aria-disabled") !== "true";
        },
        { timeout: 180_000, polling: 1000 },
      )
      .then(() => true)
      .catch(() => false);
    if (!ready) {
      console.error(
        `🚨 投稿ボタンが有効化されません（動画処理未完）。投稿中止: ${post.contentKey}`,
      );
      await saveScreenshot(page, post.contentKey, "video-not-ready");
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(1000);
      await page.keyboard.press("Escape").catch(() => {});
      return false;
    }
    console.log("✅ 動画処理完了（投稿ボタン有効化を確認）");
  }

  // ── 予約設定 or 即時投稿 ──
  if (post.scheduledDate) {
    const d = post.scheduledDate;
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();
    const hour = d.getHours(); // 24時間制
    const minute = d.getMinutes();

    // 予約ボタンクリック
    // 堅牢化: modal dialog 内に scope。inline composer の scheduleOption を誤クリックしない
    // 画像添付時に pointer event が別要素に intercept されるため DOM レベル .click() を使う
    // （Playwright の click({force:true}) は silently 失敗して date picker が開かない）
    const dialogScheduleBtn = page.locator(
      '[role="dialog"] [data-testid="scheduleOption"]'
    );
    const fallbackScheduleBtn = page
      .locator('[data-testid="scheduleOption"]')
      .first();
    const scheduleBtn =
      (await dialogScheduleBtn.count()) > 0
        ? dialogScheduleBtn.first()
        : fallbackScheduleBtn;
    await scheduleBtn.waitFor({ state: "visible", timeout: 10000 });
    await scheduleBtn.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(2500);

    // 日時セレクト設定（2026-04 以降 X UI が刷新され、data-testid なし）
    // 堅牢化: select の options 内容から「月/日/年/時/分」のロールを判定する
    // （インデックス順序は X UI 変更で将来変わる可能性があるため）
    const dialogSelects = page.locator('[role="dialog"] select');
    const allSelects =
      (await dialogSelects.count()) > 0 ? dialogSelects : page.locator("select");
    const selectCount = await allSelects.count();
    if (selectCount < 5) {
      console.error(
        `🚨 日時セレクトが想定(5)未満: ${selectCount} — UI 変更の可能性 (${post.contentKey})`
      );
      await saveScreenshot(page, post.contentKey, "date-selects-missing");
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(1000);
      await page.keyboard.press("Escape").catch(() => {});
      return false;
    }

    // 各 select の options を抽出してロールを判定
    type SelectRole = "month" | "day" | "year" | "hour" | "minute";
    const selectMeta: { i: number; role: SelectRole | null }[] = [];
    for (let i = 0; i < selectCount; i++) {
      const opts = await allSelects.nth(i).evaluate((el: HTMLSelectElement) =>
        Array.from(el.options).map((o) => ({ value: o.value, text: o.text }))
      );
      const texts = opts.map((o) => o.text);
      const values = opts.map((o) => o.value).filter((v) => v !== "");
      const maxVal = Math.max(...values.map((v) => Number(v)).filter((n) => !isNaN(n)), 0);
      let role: SelectRole | null = null;
      // day select の max は選択中の月に依存（28-31 の範囲で変動）
      if (texts.some((t) => t.includes("月")) && maxVal === 12) role = "month";
      else if (texts.some((t) => /^20\d{2}$/.test(t))) role = "year";
      else if (maxVal >= 28 && maxVal <= 31) role = "day";
      else if (maxVal === 23) role = "hour";
      else if (maxVal === 59) role = "minute";
      selectMeta.push({ i, role });
    }

    const findByRole = (role: SelectRole): number => {
      const hit = selectMeta.find((m) => m.role === role);
      return hit ? hit.i : -1;
    };
    const idx = {
      month: findByRole("month"),
      day: findByRole("day"),
      year: findByRole("year"),
      hour: findByRole("hour"),
      minute: findByRole("minute"),
    };
    const missing = Object.entries(idx)
      .filter(([, v]) => v < 0)
      .map(([k]) => k);
    if (missing.length > 0) {
      console.error(
        `🚨 日時セレクトのロール判定失敗 (${missing.join(",")}): ${post.contentKey}`
      );
      console.error("   selectMeta:", JSON.stringify(selectMeta));
      await saveScreenshot(page, post.contentKey, "date-select-role-unknown");
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(1000);
      await page.keyboard.press("Escape").catch(() => {});
      return false;
    }

    await allSelects.nth(idx.month).selectOption({ value: String(month) });
    await page.waitForTimeout(200);
    await allSelects.nth(idx.day).selectOption({ value: String(day) });
    await page.waitForTimeout(200);
    await allSelects.nth(idx.year).selectOption({ value: String(year) });
    await page.waitForTimeout(200);
    await allSelects.nth(idx.hour).selectOption({ value: String(hour) });
    await page.waitForTimeout(200);
    await allSelects.nth(idx.minute).selectOption({ value: String(minute) });
    await page.waitForTimeout(300);

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
      const metrics = [
        page.locator('[data-testid="tweetButton"]:has-text("予約設定")'),
        page.locator('[data-testid="tweetButton"]:has-text("Schedule")'),
        page.locator('[data-testid="tweetButton"] span:text-is("予約設定")'),
        page.locator('[data-testid="tweetButton"] span:text-is("Schedule")'),
      ];
      for (const ind of metrics) {
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
    // メディア (動画) 添付時は pointer event が別要素に intercept され
    // Playwright の通常 click() が silently 失敗する (即時投稿パスと同じ問題)。
    // DOM レベル el.click() で予約ハンドラを直接発火する。
    const postBtn = page.getByTestId("tweetButton").first();
    if ((await postBtn.count()) === 0) {
      console.error(`🚨 予約投稿ボタンが見つかりません: ${post.contentKey}`);
      await saveScreenshot(page, post.contentKey, "schedule-btn-missing");
      return false;
    }
    await saveScreenshot(page, post.contentKey, "schedule-before-post");
    await postBtn.evaluate((el: HTMLElement) => el.click());

    // 検証: 予約成功時は compose ダイアログが閉じ URL が /compose/post から離れる
    const scheduled = await page
      .waitForFunction(
        () => !window.location.pathname.includes("/compose/post"),
        { timeout: 15_000, polling: 500 },
      )
      .then(() => true)
      .catch(() => false);
    await page.waitForTimeout(2000);
    await saveScreenshot(page, post.contentKey, "schedule-after-post");
    if (!scheduled) {
      console.error(
        `🚨 予約投稿後も compose 画面のまま。予約が反映されていない可能性: ${post.contentKey}`,
      );
      return false;
    }
    console.log(`✅ 予約投稿完了: ${post.contentKey}`);
    await page.waitForTimeout(2000);
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
  // modal dialog 内に scope（背景の inline composer の tweetButton 誤クリック回避）
  const postBtn = page
    .locator('[role="dialog"] [data-testid="tweetButton"]')
    .last();
  if ((await postBtn.count()) === 0) {
    console.log("⚠️  投稿ボタンが見つかりません");
    await saveScreenshot(page, post.contentKey, "post-btn-missing");
    return false;
  }

  await saveScreenshot(page, post.contentKey, "immediate-before-post");
  // メディア添付時は pointer event が別要素に intercept され Playwright click が
  // silently 失敗するため、DOM レベル el.click() で投稿ハンドラを直接発火する
  // （予約パスの scheduleOption と同じ対策）。
  await postBtn.evaluate((el: HTMLElement) => el.click());

  // 投稿成否を検証: 成功時は compose ダイアログが閉じ URL が /compose/post から離れる
  const posted = await page
    .waitForFunction(
      () => !window.location.pathname.includes("/compose/post"),
      { timeout: 20_000, polling: 500 },
    )
    .then(() => true)
    .catch(() => false);
  await page.waitForTimeout(2000);
  await saveScreenshot(page, post.contentKey, "immediate-after-post");

  if (!posted) {
    console.error(
      `🚨 投稿後も compose 画面のまま。投稿が反映されていない可能性: ${post.contentKey}`,
    );
    return false;
  }
  console.log(`✅ 即時投稿完了: ${post.contentKey}`);
  await page.waitForTimeout(2000);
  return true;
}

// ─── DB 更新 ───────────────────────────────────────
function updateDb(
  post: PostConfig,
  success: boolean
): void {
  if (!success || IS_DRY_RUN) return;
  if (post.skipDb) {
    console.log(`📝 DB 更新スキップ: ${post.contentKey} (--skip-db)`);
    return;
  }

  const status = post.scheduledDate ? "posted" : "posted";
  // JST カレンダー日付で保存（toISOString だと UTC になり 23:00 JST 以降は前日になる）
  const formatJstDate = (d: Date): string => {
    const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return jst.toISOString().split("T")[0];
  };
  const postedAt = post.scheduledDate
    ? formatJstDate(post.scheduledDate)
    : formatJstDate(new Date());

  const rawCaption = fs.readFileSync(post.captionPath, "utf-8").trim();
  const caption = rawCaption.replace(/'/g, "''");
  // 抜粋は raw を先に切ってから escape する (escape 済み文字列を substring すると '' が割れる)
  const captionExcerpt = rawCaption.substring(0, 100).replace(/'/g, "''");

  // better-sqlite3 は使わず sqlite3 CLI で実行（依存を増やさない）
  const { execSync } = require("child_process");

  // 引用RT: 事前行が無いため UPDATE ではなく INSERT で新規記録する
  const sql =
    post.postType === "quote_rt"
      ? `
    INSERT INTO sns_posts
      (platform, post_type, domain, content_key, caption, quote_url, media_path, has_link, status, posted_at)
    VALUES
      ('x', 'quote_rt', '${post.domain}', '${post.contentKey}',
       '${captionExcerpt}', '${(post.quoteUrl ?? "").replace(/'/g, "''")}',
       '${(post.imagePaths[0] ?? "").replace(/'/g, "''")}', 1, '${status}', '${postedAt}');
  `
      : `
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
    console.log(
      `📝 DB ${post.postType === "quote_rt" ? "INSERT" : "更新"}: ${post.contentKey} → ${status}`
    );
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
