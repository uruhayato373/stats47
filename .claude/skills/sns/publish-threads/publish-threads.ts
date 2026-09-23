/**
 * Threads 予約投稿 (Playwright・Threads Web の「日時を指定」機能を使う)。
 *
 * posts.json の Threads 下書き (platform=threads, status=draft, scheduled_at 付き) を
 * scheduled_at の早い順に Threads Web の作成画面で予約し、status=scheduled に更新する。
 * 下書きは plan-from-x.cjs が X の予約から作る。
 *
 * 安全策 (publish-x と同じ考え方):
 *   - 期待アカウント (@stats47jp) のプロフィールリンクが無ければ何もしない
 *   - 日時を指定した後、作成画面に予約日時が表示され、送信ボタンが「予約」系の文言に
 *     変わったことを確認できなければ Escape で中止する (即時投稿を発火させない)
 *   - --dry-run は送信ボタンを押さずに画面を保存して閉じる
 *   - Threads の予約は同時 25 件まで。満杯の表示が出たら失敗扱いせず止める (残りは draft のまま、
 *     公開で枠が空いたら再実行して補充する)
 *
 * usage:
 *   npx tsx .claude/skills/sns/publish-threads/publish-threads.ts --from-queue [--limit N] [--offset N] [--dry-run]
 *   npx tsx .claude/skills/sns/publish-threads/publish-threads.ts --from-queue --fill --no-ledger   (launchd の補充)
 *   npx tsx .claude/skills/sns/publish-threads/publish-threads.ts --sync-ledger                     (記録ファイル → posts.json)
 *
 * --fill      : Threads の予約枠 (同時 25 件) の空きだけ入れる。空きは posts.json と記録ファイルの
 *               「未来の予約済み」から数えるので、上限の表示に当たる前に止まる
 * --no-ledger : posts.json を書かない。予約済みは .local/threads-scheduled.jsonl (git 管理外) だけに残す。
 *               無人の定期実行が git の作業ツリーを触らないため。台帳へは --sync-ledger でまとめて反映する
 *
 * 初回・画面変更後は --limit 1 --dry-run で予約モード到達を確認してから本番に回す。
 */
import { chromium, type BrowserContext, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../..");
const store = require(path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-posts-store.cjs"));

const PROFILE_DIR = path.join(PROJECT_ROOT, ".local/playwright-threads-profile");
const DEBUG_DIR = path.join(PROJECT_ROOT, ".local/playwright-threads-debug");
/** 予約済みの記録 (git 管理外)。posts.json が draft のままでも、ここにある下書きは二度と予約しない */
const SCHEDULED_LOG = path.join(PROJECT_ROOT, ".local/threads-scheduled.jsonl");
/** Threads が同時に持てる予約の上限 (2026-09-23 実測) */
const SCHEDULE_CAP = 25;
const EXPECT_ACCOUNT = "stats47jp";
const HOME = "https://www.threads.com/";
/** 予約後の送信ボタンの文言。「投稿」のままなら即時投稿になるので押さない (2026-09-23 実測は「日時を指定」) */
const SCHEDULE_BUTTON = /^(日時を指定|予約|予約する|Schedule)$/;

interface QueueItem {
  id: number;
  contentKey: string;
  caption: string;
  mediaPath: string | null;
  scheduledAt: Date;
}

function args() {
  const a = process.argv.slice(2);
  const limitIdx = a.indexOf("--limit");
  const offsetIdx = a.indexOf("--offset");
  return {
    fromQueue: a.includes("--from-queue"),
    dryRun: a.includes("--dry-run"),
    limit: limitIdx >= 0 ? Number(a[limitIdx + 1]) : Infinity,
    offset: offsetIdx >= 0 ? Number(a[offsetIdx + 1]) : 0,
    fill: a.includes("--fill"),
    noLedger: a.includes("--no-ledger"),
    syncLedger: a.includes("--sync-ledger"),
  };
}

interface LogEntry { id: number; content_key: string; scheduled_at: string; at: string }

function readLog(): LogEntry[] {
  if (!fs.existsSync(SCHEDULED_LOG)) return [];
  return fs.readFileSync(SCHEDULED_LOG, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

function appendLog(item: QueueItem) {
  fs.mkdirSync(path.dirname(SCHEDULED_LOG), { recursive: true });
  const e: LogEntry = { id: item.id, content_key: item.contentKey, scheduled_at: item.scheduledAt.toISOString(), at: new Date().toISOString() };
  fs.appendFileSync(SCHEDULED_LOG, JSON.stringify(e) + "\n");
}

/** 未来の予約済み件数 (posts.json の scheduled と記録ファイルの和集合) */
function futureScheduledCount(): number {
  const now = Date.now();
  const ids = new Set<number>();
  for (const p of store.loadAll()) {
    if (p.platform === "threads" && p.status === "scheduled" && Date.parse(p.scheduled_at) > now) ids.add(p.id);
  }
  for (const e of readLog()) if (Date.parse(e.scheduled_at) > now) ids.add(e.id);
  return ids.size;
}

function loadQueue(limit: number, offset = 0): QueueItem[] {
  const now = Date.now();
  const logged = new Set(readLog().map((e) => e.id));
  return store
    .loadAll()
    .filter((p: any) => p.platform === "threads" && p.status === "draft" && p.scheduled_at && !p.deleted_at)
    .filter((p: any) => !logged.has(p.id))
    .filter((p: any) => Date.parse(p.scheduled_at) > now + 15 * 60_000) // 15 分以内は予約できないので除外
    .sort((a: any, b: any) => String(a.scheduled_at).localeCompare(String(b.scheduled_at)))
    .slice(offset, offset + limit)
    .map((p: any) => ({
      id: p.id,
      contentKey: p.content_key,
      caption: p.caption,
      mediaPath: p.media_path ? (path.isAbsolute(p.media_path) ? p.media_path : path.join(PROJECT_ROOT, p.media_path)) : null,
      scheduledAt: new Date(p.scheduled_at),
    }));
}

function jstParts(d: Date) {
  const j = new Date(d.getTime() + 9 * 3600e3);
  return {
    year: j.getUTCFullYear(),
    month: j.getUTCMonth() + 1,
    day: j.getUTCDate(),
    hour: String(j.getUTCHours()).padStart(2, "0"),
    minute: String(j.getUTCMinutes()).padStart(2, "0"),
  };
}

async function shot(page: Page, name: string) {
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
  const file = path.join(DEBUG_DIR, `${new Date().toISOString().replace(/[:.]/g, "-")}_${name}.png`);
  await page.screenshot({ path: file }).catch(() => {});
  return file;
}

async function ensureLogin(page: Page) {
  await page.goto(HOME, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  const ok = await page.locator(`a[href="/@${EXPECT_ACCOUNT}"]`).count();
  if (!ok) {
    await shot(page, "login-missing");
    throw new Error(`@${EXPECT_ACCOUNT} でログインしていません。専用プロファイルでログインしてから再実行してください`);
  }
  console.log(`✅ ログイン済み (@${EXPECT_ACCOUNT})`);
}

/** 作成画面の送信ボタン (「投稿」または予約後の文言) を探す */
function submitButton(page: Page) {
  return page.locator('[role="dialog"] [role="button"]').filter({ hasText: /^(投稿|日時を指定|予約|予約する|Schedule|Post)$/ }).last();
}

async function openComposer(page: Page) {
  await page.goto(HOME, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.getByText("新しいスレッド", { exact: true }).first().click();
  await page.locator('[role="dialog"] [role="textbox"][contenteditable="true"]').first().waitFor({ timeout: 15_000 });
}

async function attachImage(page: Page, file: string) {
  const input = page.locator('[role="dialog"] input[type="file"]').first();
  await input.setInputFiles(file);
  await page.locator('[role="dialog"] img[src^="blob:"]').first().waitFor({ timeout: 30_000 });
  console.log("📷 画像プレビュー確認OK");
}

async function pasteText(page: Page, text: string) {
  const box = page.locator('[role="dialog"] [role="textbox"][contenteditable="true"]').first();
  await box.click();
  await page.evaluate(async (t: string) => {
    const item = new ClipboardItem({ "text/plain": new Blob([t], { type: "text/plain" }) });
    await navigator.clipboard.write([item]);
  }, text);
  await page.keyboard.press("Meta+v");
  await page.waitForTimeout(1500);
  const typed = (await box.innerText()).replace(/\s+/g, "");
  if (typed !== text.replace(/\s+/g, "")) {
    throw new Error(`本文の貼り付け結果が一致しません (${typed.length} / ${text.replace(/\s+/g, "").length} 文字)`);
  }
  console.log("📝 本文OK");
}

async function setSchedule(page: Page, when: Date) {
  const t = jstParts(when);
  await page.locator('[role="dialog"] [role="button"][aria-label="もっと見る"]').first().click();
  await page.getByText(/^日時を指定/).first().click();
  const header = page.locator('[role="status"]').filter({ hasText: /^\d{4}年\d{1,2}月$/ }).first();
  await header.waitFor({ timeout: 10_000 });
  const target = `${t.year}年${t.month}月`;
  for (let i = 0; i < 24 && (await header.innerText()).trim() !== target; i++) {
    await page.getByRole("button", { name: "翌月" }).click();
    await page.waitForTimeout(300);
  }
  if ((await header.innerText()).trim() !== target) throw new Error(`カレンダーを ${target} に合わせられません`);

  // 日付セルは「2026年9月24日木曜日」という読み上げ用ラベルを持つ。その親の日付数字を押す
  const label = page.getByText(new RegExp(`^${t.year}年${t.month}月${t.day}日.曜日$`)).first();
  await label.waitFor({ timeout: 5000 });
  await label.locator("xpath=..").click();

  const timeInputs = page.locator('input[type="text"]');
  const hourInput = timeInputs.nth((await timeInputs.count()) - 2);
  const minuteInput = timeInputs.nth((await timeInputs.count()) - 1);
  for (const [inp, v] of [[hourInput, t.hour], [minuteInput, t.minute]] as const) {
    await inp.click();
    await inp.press("Meta+a");
    await inp.type(v);
    await inp.press("Tab");
  }
  if ((await hourInput.inputValue()) !== t.hour || (await minuteInput.inputValue()) !== t.minute) {
    throw new Error(`時刻を ${t.hour}:${t.minute} にできません (${await hourInput.inputValue()}:${await minuteInput.inputValue()})`);
  }
  await page.getByRole("button", { name: "完了" }).or(page.locator('[role="button"]').filter({ hasText: /^完了$/ })).first().click();
  await page.waitForTimeout(1500);
}

/**
 * 予約モードに入ったか。作成画面の上部に「明日10:30 JSTに投稿予定」のような帯が出て、
 * 送信ボタンが「日時を指定」に変わる (2026-09-23 実測)。帯の時刻と日付 (今日/明日/M月D日) が
 * 予約したい日時と一致しなければ押さない。
 */
async function scheduleConfirmed(page: Page, when: Date) {
  const t = jstParts(when);
  const label = ((await submitButton(page).innerText().catch(() => "")) || "").trim();
  const dialogText = (await page.locator('[role="dialog"]').first().innerText().catch(() => "")) || "";
  const banner = dialogText.split("\n").find((l) => l.includes("投稿予定")) || "";
  const now = jstParts(new Date());
  const tomorrow = jstParts(new Date(Date.now() + 86400e3));
  const same = (a: ReturnType<typeof jstParts>) => a.year === t.year && a.month === t.month && a.day === t.day;
  // 帯の日付は 今日 / 明日 / 1 週間以内は曜日 / それより先は M月D日 (2026-09-23 実測)
  const daysAhead = Math.round((Date.UTC(t.year, t.month - 1, t.day) - Date.UTC(now.year, now.month - 1, now.day)) / 86400e3);
  const weekday = "日月火水木金土"[new Date(Date.UTC(t.year, t.month - 1, t.day)).getUTCDay()];
  const dayWord = same(now) ? "今日" : same(tomorrow) ? "明日" : daysAhead <= 6 ? `${weekday}曜日` : `${t.month}月${t.day}日`;
  const timeOk = banner.includes(`${t.hour}:${t.minute}`) || banner.includes(`${Number(t.hour)}:${t.minute}`);
  const dateShown = banner.includes(dayWord) && timeOk;
  return { ok: SCHEDULE_BUTTON.test(label) && dateShown, label, dateShown, banner };
}

async function publishOne(page: Page, item: QueueItem, dryRun: boolean, noLedger: boolean): Promise<boolean | "full"> {
  const t = jstParts(item.scheduledAt);
  console.log(`\n━━━ ${item.contentKey} → ${t.year}/${t.month}/${t.day} ${t.hour}:${t.minute} JST`);
  try {
    await openComposer(page);
    if (item.mediaPath) {
      if (!fs.existsSync(item.mediaPath)) throw new Error(`画像がありません: ${item.mediaPath}`);
      await attachImage(page, item.mediaPath);
    }
    await pasteText(page, item.caption);
    await setSchedule(page, item.scheduledAt);
    const c = await scheduleConfirmed(page, item.scheduledAt);
    if (!c.ok) {
      const f = await shot(page, `${item.contentKey}_schedule-not-confirmed`);
      console.error(`🚨 予約モード未確認 (ボタン「${c.label}」/ 帯「${c.banner}」)。投稿を中止: ${f}`);
      await page.keyboard.press("Escape");
      return false;
    }
    console.log(`📅 予約モード確認OK (帯「${c.banner}」/ ボタン「${c.label}」)`);
    if (dryRun) {
      console.log(`🧪 dry-run: 送信せず終了 ${await shot(page, `${item.contentKey}_dry-run`)}`);
      return true;
    }
    await submitButton(page).click();
    // Threads は予約を同時に 25 件までしか持てない (2026-09-23 実測:「スレッドは25件まで日時設定できます」)。
    // 満杯の表示が出たら予約されていないので、台帳は draft のまま残して止める。
    const closed = page.locator('[role="dialog"] [role="textbox"][contenteditable="true"]').first().waitFor({ state: "detached", timeout: 30_000 }).then(() => "closed" as const);
    const full = page.getByText("日時設定できません").first().waitFor({ timeout: 30_000 }).then(() => "full" as const);
    const outcome = await Promise.any([closed, full]).catch(() => "timeout" as const);
    if (outcome === "full") {
      console.log(`⏸  予約枠が満杯 (同時 25 件まで)。${item.contentKey} は予約していません ${await shot(page, `${item.contentKey}_limit-full`)}`);
      return "full";
    }
    if (outcome !== "closed") throw new Error("送信後に作成画面が閉じませんでした");
    await shot(page, `${item.contentKey}_scheduled`);
    appendLog(item);
    if (!noLedger) store.updateById(item.id, { status: "scheduled" });
    console.log("✅ 予約完了");
    return true;
  } catch (e) {
    console.error(`❌ ${item.contentKey}: ${(e as Error).message} ${await shot(page, `${item.contentKey}_error`)}`);
    return false;
  }
}

async function main() {
  const { fromQueue, dryRun, limit, offset, fill, noLedger, syncLedger } = args();
  if (syncLedger) {
    let n = 0;
    for (const e of readLog()) {
      const row = store.getById(e.id);
      if (row && row.platform === "threads" && row.status === "draft") {
        store.updateById(e.id, { status: "scheduled" });
        n++;
      }
    }
    console.log(`📝 記録ファイル → posts.json: ${n} 件を scheduled に更新`);
    return;
  }
  if (!fromQueue) {
    console.error("usage: --from-queue [--limit N] [--offset N] [--fill] [--no-ledger] [--dry-run] | --sync-ledger");
    process.exit(1);
  }
  let max = limit;
  if (fill) {
    const free = SCHEDULE_CAP - futureScheduledCount();
    console.log(`🧮 予約枠: 使用 ${SCHEDULE_CAP - free} / ${SCHEDULE_CAP}、空き ${Math.max(free, 0)}`);
    if (free <= 0) return;
    max = Math.min(limit, free);
  }
  const queue = loadQueue(max, offset);
  console.log(`🧵 Threads 予約${dryRun ? " (dry-run)" : ""}: ${queue.length} 件`);
  if (!queue.length) return;

  const context: BrowserContext = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    args: ["--disable-blink-features=AutomationControlled"],
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: HOME });
  const page = context.pages()[0] || (await context.newPage());
  let ok = 0;
  let full = false;
  try {
    await ensureLogin(page);
    for (const item of queue) {
      const r = await publishOne(page, item, dryRun, noLedger);
      if (r === "full") {
        full = true;
        break;
      }
      if (r) ok++;
      else if (!dryRun) {
        // 1 件でも予約を確認できなければ、画面の変化を疑って残りを止める
        console.error("⛔ 失敗したので残りを止めます");
        break;
      }
      await page.waitForTimeout(2000);
    }
  } finally {
    console.log(`\n合計: ${ok}/${queue.length} 件${full ? " (予約枠が満杯のため残りは次回。台帳は draft のまま)" : ""}`);
    await page.waitForTimeout(2000);
    await context.close();
  }
  // 満杯で止まったのは失敗ではない (次回の補充で続きを入れる)
  if (!full && ok !== queue.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
