/**
 * a8-browser.ts — A8.net 管理画面の Playwright 操作 (scout / apply / check-approval / harvest)。
 *
 * publish-x.ts の永続プロファイル方式を踏襲:
 *   - chromium.launchPersistentContext(.local/playwright-a8-profile)
 *   - PROFILE_ROOT はメインチェックアウト固定 (worktree 共有・再ログイン不要)
 *   - isLoggedIn UI 判定 / tryClick 複数セレクタ / saveScreenshot / finally close
 *   - 状態変更 (apply) の前に --dry-run ゲート。isLoggedIn 失敗はカタログに記録し正常終了。
 *
 * 判定はすべてコア (a8-scout-core.mjs) に委譲。ブラウザ層は「操作 + 生データ抽出」のみ。
 *
 * ★★ 初回セットアップ (必須) ★★
 *   1. node .claude/skills/ads/scout-asp/scripts/login.mjs  (人間が手動ログイン)
 *   2. npx tsx a8-browser.ts scout --dry-run
 *      → A8 の DOM を .local/playwright-a8-debug/ にダンプ (page 構造 + スクショ)。
 *        SELECTORS 定数を実機に合わせて調整する (A8 UI は本コードの推測値のまま動く保証はない)。
 *   3. セレクタ確定後に scout (実収集) → apply → check-approval → harvest。
 *
 * 使い方:
 *   npx tsx a8-browser.ts scout [--dry-run] [--limit N]
 *   npx tsx a8-browser.ts apply [--dry-run] [--max N]
 *   npx tsx a8-browser.ts check-approval [--dry-run]
 *   npx tsx a8-browser.ts harvest [--dry-run] [--limit N] [--include-registered] [--text-only]
 *     --include-registered: 既 registered からも text を取る (text 在庫の後追い取得)。
 *       registered は状態機械上 harvested へ戻せないため status は変えず pendingDrafts に積む。
 */
import { chromium, type BrowserContext, type Page } from "playwright";
import * as path from "path";
import * as fs from "fs";
import { createHash } from "crypto";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const core = require("../../../../scripts/ads/lib/a8-scout-core.mjs");
const codeCore = require("../../../../scripts/ads/lib/a8-code-core.mjs");
const applyBudget = require("../../../../scripts/ads/check-a8-apply-budget.cjs");
const appendCore = require("../../../../scripts/ads/lib/a8-append-core.mjs");
const { buildAdDraft } = appendCore;

// ─── 設定 ──────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, "../../../../..");
// ログインプロファイルはメインチェックアウト固定 (docs/01_技術設計/07_Playwright認証プロファイル.md)。
// ★ Mac パスを直書きすると Windows では別ドライブ配下に空プロファイルを掘ってしまい、
//   「ログイン済みなのに未ログイン扱い」になる。process.platform で分岐せず、
//   **実在するほうを採る**フォールバック 1 本で両対応する
//   (.claude/scripts/ads/lib/asp-browser-base.mjs と同じ規約)。
const MAIN_CHECKOUT = "/Users/minamidaisuke/stats47";
const PROFILE_ROOT = fs.existsSync(MAIN_CHECKOUT) ? MAIN_CHECKOUT : PROJECT_ROOT;
const PROFILE_DIR = path.join(PROFILE_ROOT, ".local/playwright-a8-profile");
// ★A8 の認証はセッション Cookie で永続プロファイルに残らない。login.mjs が storageState に
//   捕獲した Cookie を起動時に addCookies で再注入する (認証再利用の実体)。
const STATE_PATH = path.join(PROFILE_ROOT, ".local/playwright-a8-state.json");
// ★申請サイト assert: この A8 口座は複数サイト登録 (統計で見る都道府県=stats47 / doboku-note)。
//   申請 (apply) は detail の <select name="webSiteId">、広告コード取得 (harvest) は
//   <select name="websiteId"> (小文字 w・別名) を stats47 側に選んでから進む。
//   選べない場合は誤サイト提携・誤サイトコードを防ぐため中止する
//   (publish-x / coconala の account assert と同じ思想)。
//   ラベルは登録時の表記に依存するため候補を複数持ち、部分一致で吸収する。
//   どれにも当たらなければ実際の option 一覧を出して停止する (推測で押さない)。
const TARGET_SITE_LABELS = ["統計で見る都道府県", "stats47"];
const TARGET_SITE = TARGET_SITE_LABELS[0];
/** option ラベル群から stats47 のサイトを選ぶ。見つからなければ null (呼び出し側が中止)。 */
function pickTargetSiteOption(options: string[]): string | null {
  for (const label of TARGET_SITE_LABELS) {
    const hit = options.find((o) => o.includes(label));
    if (hit) return hit;
  }
  return null;
}
const DEBUG_DIR = path.join(PROJECT_ROOT, ".local/playwright-a8-debug");
const OFFER_INSPECT_DIR = path.join(PROJECT_ROOT, ".local/a8-offer-inspect");
const CATALOG_PATH = path.join(PROJECT_ROOT, ".claude/state/ads/a8-catalog.json");
const INVENTORY_PATH = path.join(PROJECT_ROOT, ".claude/state/ads/inventory-latest.json");
const ADS_DATA_PATH = path.join(PROJECT_ROOT, "apps/web/scripts/affiliate-ads-data.ts");

let IS_DRY_RUN = false;

/**
 * A8 新メディア管理画面 (media-console.a8.net) の URL / セレクタ。2026-07 の実機調査で確定。
 * 旧 pub.a8.net/a8v2/*.do は廃止。UI 刷新時は実機ダンプ (.local/playwright-a8-debug/) で再調整する。
 */
const BASE = "https://media-console.a8.net";
const A8 = {
  base: BASE,
  homeUrl: `${BASE}/home`,
  // ログイン再認証にリダイレクトされていない = ログイン済み。
  reAuthPattern: /re-authentication|\/login/i,
  categorySearchUrl: (code: string) => `${BASE}/program/search/category?primaryCategoryCode=${code}`,
  // キーワード検索。実機ダンプの <form action="/program/search/keyword"> + <input name="keywords"> から確定
  // (2026-07-28)。カテゴリ巡回は 1 ページ 20 件しか採れないため、意図を絞りたいときはこちらを使う。
  keywordSearchUrl: (kw: string) => `${BASE}/program/search/keyword?keywords=${encodeURIComponent(kw)}`,
  autoContractUrl: `${BASE}/program/search/auto-contract`, // 即時提携 (審査なし)
  partneredListUrl: `${BASE}/program/list/partnered`, // 参加中 (承認済み)
  // 参加中一覧のページ指定。既定ページサイズは 20 件なので 1 ページだけ読むと 21 件目以降を
  // 取りこぼす (2026-08-04 実測: 参加中 158 件)。pageSize=100 で往復を減らし、承認日の降順に
  // 並べて直近の承認を先頭ページに寄せる。
  partneredListPageUrl: (pageNo: number, pageSize = 100) =>
    `${BASE}/program/list/partnered?pageNo=${pageNo}&pageSize=${pageSize}&sortKey=APPROVED_DATE&sortOrder=DESC`,
  applyingListUrl: `${BASE}/program/list/applying`, // 申込中 (審査待ち)
  detailNotPartneredUrl: (pid: string) => `${BASE}/program/detail-not-partnered?programId=${pid}`,
  detailPartneredUrl: (pid: string) => `${BASE}/program/detail-partnered?programId=${pid}`,
  createLinkUrl: (pid: string) => `${BASE}/program/create-link?programId=${pid}`,
  // 検索結果カード = div.pgInner。内部: h3.pgName / p.ecName / div.pgStatus / div.pgDetail の labelInfo+labelValue。
  card: "div.pgInner",
  applyButton: ["button:has-text('プログラムの提携申請をする')", "button.btnLink:has-text('提携申請')"],
  // 規約同意 → 申請確定 (次画面)。
  applyConfirm: [
    "button:has-text('同意して')",
    "button:has-text('提携申請する')",
    "button:has-text('申請する')",
    "button.btnPrimary",
  ],
  showAdLinkButton: ["button:has-text('広告リンクを表示')", "button.btnPrimary:has-text('広告リンク')"],
  adCodeTextarea: ["textarea"],
};

// ─── ヘルパー ──────────────────────────────────────

async function saveScreenshot(page: Page, label: string): Promise<void> {
  if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const fp = path.join(DEBUG_DIR, `${ts}_${label}.png`);
  try {
    await page.screenshot({ path: fp, fullPage: true });
    console.log(`📸 screenshot: ${fp}`);
  } catch (e) {
    console.error(`screenshot 失敗: ${e}`);
  }
}

/** 初回チューニング用: page の HTML と accessibility 情報を debug に落とす。 */
async function dumpPage(page: Page, label: string): Promise<void> {
  if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  try {
    const html = await page.content();
    fs.writeFileSync(path.join(DEBUG_DIR, `${ts}_${label}.html`), html, "utf8");
    console.log(`📝 page dump: ${label}.html (セレクタ調整用)`);
  } catch (e) {
    console.error(`page dump 失敗: ${e}`);
  }
  await saveScreenshot(page, label);
}

/** 複数セレクタを順に試し最初にヒットした Locator を返す (無ければ null)。 */
async function tryFind(page: Page, selectors: string[]) {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if ((await loc.count()) > 0) return loc;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/** 複数セレクタで DOM クリック (pointer intercept 回避)。成功で true。 */
async function tryClick(page: Page, selectors: string[]): Promise<boolean> {
  const loc = await tryFind(page, selectors);
  if (!loc) return false;
  try {
    await loc.evaluate((el: HTMLElement) => el.click());
    return true;
  } catch {
    return false;
  }
}

// ─── セッション再注入 ──────────────────────────────
// login.mjs が保存した storageState の Cookie を context に addCookies で戻す。
// A8 の認証セッション Cookie は永続プロファイルに残らないため、これが認証の実体。
async function restoreSession(context: BrowserContext): Promise<boolean> {
  if (!fs.existsSync(STATE_PATH)) {
    console.error(`⚠️  セッション未保存 (${STATE_PATH})。login.mjs でログインしてください。`);
    return false;
  }
  try {
    const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    if (Array.isArray(state.cookies) && state.cookies.length > 0) {
      await context.addCookies(state.cookies);
    }
    return true;
  } catch (e) {
    console.error(`セッション復元に失敗: ${String(e).slice(0, 120)}`);
    return false;
  }
}

// ─── ログイン確認 ──────────────────────────────────
// 現在の URL が re-authentication/login でなく media-console 上で、パスワード欄が無ければログイン済み。
async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  if (A8.reAuthPattern.test(url)) return false;
  if (!/media-console\.a8\.net/.test(url)) return false;
  const hasPw = await page
    .evaluate(() => document.querySelectorAll("input[type=password]").length > 0)
    .catch(() => true);
  return !hasPw;
}

// ─── カタログ IO ───────────────────────────────────
type Catalog = { entries: Record<string, any>; updatedAt?: string };

function loadCatalog(): Catalog {
  try {
    return JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  } catch {
    return { entries: {} };
  }
}

/**
 * catalog を保存する。**原子的書き込み + リトライ**。
 *
 * ★ Windows では他プロセス (Defender のスキャン等) が一時的にファイルを掴み、
 *   writeFileSync が `UNKNOWN (errno -4094)` で落ちることがある (2026-07-28 に harvest 中 2 回発生)。
 *   harvest は 1 件ごとに保存するため、ここで落ちると長い走行が途中で死ぬ。
 *   temp へ書いて rename する (同一ボリュームなら原子的 = 破損した JSON を残さない) + 数回リトライ。
 */
function saveCatalog(cat: Catalog): void {
  cat.updatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(CATALOG_PATH), { recursive: true });
  const body = JSON.stringify(cat, null, 2) + "\n";
  const tmp = `${CATALOG_PATH}.tmp-${process.pid}`;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      fs.writeFileSync(tmp, body, "utf8");
      fs.renameSync(tmp, CATALOG_PATH);
      return;
    } catch (e) {
      lastErr = e;
      try {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch {}
      // 同期的に短く待つ (このスクリプトは逐次実行なのでビジーウェイトで問題ない)
      const until = Date.now() + 150 * (attempt + 1);
      while (Date.now() < until) {
        /* backoff */
      }
    }
  }
  throw lastErr;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** 承認済み案件の成果条件をread-onlyで証拠化する。catalogや外部状態は変更しない。 */
async function cmdInspectOffer(page: Page, ids: string[] | null): Promise<void> {
  if (!ids || ids.length === 0) throw new Error("inspect-offer は --id <programId> が必須です");
  fs.mkdirSync(OFFER_INSPECT_DIR, { recursive: true });
  for (const programId of ids) {
    if (!/^s\d{14}$/.test(programId)) throw new Error(`programId 形式不正: ${programId}`);
    await page.goto(A8.detailPartneredUrl(programId), { waitUntil: "domcontentloaded" });
    if (!(await isLoggedIn(page))) throw new Error(`A8 session expired: ${programId}`);
    const bodyText = await page.locator("body").innerText();
    const title = await page.title();
    const observedAt = nowIso();
    const sha256 = createHash("sha256").update(bodyText, "utf8").digest("hex");
    const baseName = `${programId}-${observedAt.replace(/[:.]/g, "-")}`;
    const textPath = path.join(OFFER_INSPECT_DIR, `${baseName}.txt`);
    const metaPath = path.join(OFFER_INSPECT_DIR, `${baseName}.json`);
    fs.writeFileSync(textPath, bodyText, "utf8");
    fs.writeFileSync(metaPath, `${JSON.stringify({
      schemaVersion: 1,
      programId,
      observedAt,
      url: page.url(),
      title,
      scope: "account-program-terms",
      bodyTextSha256: sha256,
      textFile: path.basename(textPath),
    }, null, 2)}\n`, "utf8");
    const relevantLines = bodyText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => /成果|報酬|条件|否認|キャンセル|再訪問|申込|購入|登録|予約|資料請求|ダウンロード|インストール/.test(line));
    console.log(`🔎 ${programId}: ${title}`);
    console.log(`   evidence: ${metaPath}`);
    for (const line of relevantLines.slice(0, 40)) console.log(`   ${line.slice(0, 240)}`);
  }
}

/** セッション失効を記録して正常終了 (パイプラインを止めない)。 */
function recordSessionExpired(step: string): void {
  const cat = loadCatalog();
  cat.entries.__session ??= { programId: "__session", status: "candidate", history: [] };
  cat.entries.__session.lastError = { step, error: "session-expired", at: nowIso() };
  saveCatalog(cat);
  console.error(`⚠️  A8 セッション失効 (${step})。login.mjs で再ログインしてください。`);
}

function loadCoverage(): any {
  try {
    return JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf8")).coverage ?? {};
  } catch {
    return {};
  }
}

/** affiliate-ads-data.ts から既存 AffiliateAd の {title, htmlContent} を抽出 (dedup 用)。 */
function loadExistingAds(): Array<{ title: string; htmlContent: string }> {
  try {
    const src = fs.readFileSync(ADS_DATA_PATH, "utf8");
    const titles = [...src.matchAll(/"title":\s*"([^"]*)"/g)].map((m) => m[1]);
    const htmls = [...src.matchAll(/"htmlContent":\s*"([^"]*)"/g)].map((m) => m[1]);
    // 位置対応でなく全件を突き合わせるので、両方を混ぜた擬似配列を返す (isDuplicate は title/a8mat を独立に見る)。
    const n = Math.max(titles.length, htmls.length);
    const out = [];
    for (let i = 0; i < n; i++) out.push({ title: titles[i] ?? "", htmlContent: htmls[i] ?? "" });
    return out;
  } catch {
    return [];
  }
}

// ─── サブコマンド: scout ───────────────────────────
/** 現在の検索結果ページの div.pgInner カードから生プログラム配列を抽出。
 *  ★ $$eval コールバック内は名前付き関数を使わない (tsx/esbuild の __name ラップがブラウザ側で未定義になる)。
 *     すべてインライン式で書く。 */
async function scrapeCurrentPage(page: Page): Promise<any[]> {
  return page.$$eval("div.pgInner", (cards) =>
    cards.map((card) => {
      // pgDetail の labelInfo→labelValue を辞書化 (インライン・名前付き関数なし)。
      const detail: Record<string, string> = {};
      for (const d of Array.from(card.querySelectorAll(".pgDetail"))) {
        const label = (d.querySelector(".labelInfo")?.textContent || "").replace(/\s+/g, " ").trim();
        const value = (d.querySelector(".labelValue")?.textContent || "").replace(/\s+/g, " ").trim();
        if (label) detail[label] = value;
      }
      const idHref = card.querySelector("a[href*='programId=']")?.getAttribute("href") || "";
      const programId = (idHref.match(/programId=(s\d+)/) || [])[1] || detail["プログラムID"] || "";
      const cardText = (card.textContent || "").replace(/\s+/g, " ").trim();
      return {
        programId,
        name: (card.querySelector("h3.pgName")?.textContent || "").replace(/\s+/g, " ").trim(),
        company: (card.querySelector("p.ecName")?.textContent || "").replace(/\s+/g, " ").trim(),
        genre: detail["カテゴリ"] || "",
        // 報酬/確定率/EPC は右側 table.tableVertical にありカード全文に含まれる。値は normalizeProgram で正規表現抽出。
        cardText,
        partnered: /提携中/.test(cardText) || !!card.querySelector(".statusAffiliated"),
      };
    }),
  );
}

/** 報酬テキスト "40000円" / "売上の10%" → { rewardType, rewardYen, rewardRatePct }。 */
function parseReward(text: string): {
  rewardType: "fixed" | "rate" | null;
  rewardYen?: number;
  rewardRatePct?: number;
} {
  if (!text) return { rewardType: null };
  const pct = text.match(/([\d.]+)\s*[%％]/);
  if (pct) return { rewardType: "rate", rewardRatePct: Number(pct[1]) };
  const yen = text.match(/([\d,]+)\s*円/);
  if (yen) return { rewardType: "fixed", rewardYen: Number(yen[1].replace(/,/g, "")) };
  return { rewardType: null };
}

/** 生カード → scoreAndRank に渡す形へ正規化。報酬/確定率/EPC はカード全文から正規表現抽出。 */
function normalizeProgram(raw: any, verticalHint?: string): any {
  const t = raw.cardText || "";
  // 「成果報酬 … (円 or %)」を EPC/確定率/関連 の手前まで切り出す。
  const rewardText = (t.match(/成果報酬(.+?)(?:EPC|確定率|関連キーワード|$)/) || [])[1] || "";
  const confirmRatePct = Number((t.match(/確定率\s*([\d.]+)\s*[%％]/) || [])[1]) || 0;
  const epcYen = Number((t.match(/EPC\s*([\d,]+)/) || ["", "0"])[1].replace(/,/g, "")) || 0;
  // genre に A8 カテゴリ + カテゴリコード由来の vertical ヒント + 案件名を載せ resolveVertical の解像度を上げる。
  const genre = [raw.genre, verticalHint, raw.name].filter(Boolean).join(" ");
  return {
    programId: raw.programId,
    name: raw.name || raw.company,
    genre,
    company: raw.company,
    partnered: raw.partnered,
    confirmRatePct,
    epcYen,
    ...parseReward(rewardText),
  };
}

/**
 * @param opts.queries キーワード検索する語。指定時は**カテゴリ巡回をせず**この語だけを検索する。
 *   カテゴリ巡回は 1 ページ 20 件しか採れず意図の粒度も粗いので、「賃貸」「移住」のように
 *   検索意図が確定しているときはこちらを使う。
 * @param opts.vertical 検索モードで vertical のヒントを固定する (キーワードから軸が自明なとき)。
 */
async function cmdScout(
  page: Page,
  limit: number,
  opts: { queries?: string[]; vertical?: string; promote?: string[] } = {},
): Promise<void> {
  const curated = core.loadCurated();
  const codeMap: Record<string, string> = curated.categoryCodeToVertical || {};
  const codes = Object.keys(codeMap);

  // dry-run: 最初のカテゴリだけダンプしてセレクタ健全性を確認。
  if (IS_DRY_RUN) {
    const code = codes[0] || "07";
    await page.goto(A8.categorySearchUrl(code), { waitUntil: "networkidle", timeout: 40000 });
    await page.waitForTimeout(3500);
    if (!(await isLoggedIn(page))) return recordSessionExpired("scout");
    const n = await page.locator(A8.card).count();
    await dumpPage(page, "scout-dryrun");
    console.log(`🧪 dry-run: カテゴリ ${code} で ${n} カード検出。ダンプを確認。`);
    return;
  }

  // カードを収集 (partnered は除外 = 既提携)。
  // キーワード指定があれば検索モード、無ければ従来どおり全 vertical カテゴリを巡回。
  const raw: any[] = [];
  const units = opts.queries?.length
    ? opts.queries.map((q) => ({ label: `検索「${q}」`, url: A8.keywordSearchUrl(q), hint: opts.vertical }))
    : codes.map((code) => ({ label: `カテゴリ ${code} (${codeMap[code]})`, url: A8.categorySearchUrl(code), hint: codeMap[code] }));
  for (const u of units) {
    await page.goto(u.url, { waitUntil: "networkidle", timeout: 40000 });
    await page.waitForTimeout(3500);
    if (!(await isLoggedIn(page))) return recordSessionExpired("scout");
    const cards = await scrapeCurrentPage(page);
    for (const c of cards) {
      if (c.partnered || !c.programId) continue; // 既提携・ID 不明はスキップ
      raw.push(normalizeProgram(c, u.hint));
    }
    console.log(`  ${u.label}: ${cards.length} カード`);
    await page.waitForTimeout(1500 + (u.url.length % 5) * 300); // randomized wait
  }
  console.log(`🔍 A8 から ${raw.length} 未提携プログラムを収集`);
  if (raw.length === 0) {
    await dumpPage(page, "scout-empty");
    console.log("⚠️  0 件。セレクタ不一致の可能性 (ダンプを確認)。");
    return;
  }

  const coverage = loadCoverage();
  const existingAds = loadExistingAds();
  const { candidates, blocked, duplicates, belowThreshold } = core.scoreAndRank(raw, { coverage, existingAds, curated });
  // 閾値未満で落ちた案件を必ず表示する。score は単価と EPC で並べるだけなので、
  // 単価は低いが需要が大きい軸の案件がここに沈む。落ちたことが見えないと
  // 「在庫ゼロなのに候補も無い」状態の原因が追えない。
  if (belowThreshold?.length) {
    console.log(`  ⤵ minScore(${curated.minScore}) 未満で除外 ${belowThreshold.length} 件:`);
    for (const p of belowThreshold) {
      console.log(`     ${p.score.toFixed(2)} ${p.programId} ${p.vertical ?? "-"} ${p.name}`);
    }
  }
  const top = candidates.slice(0, Number.isFinite(limit) ? limit : candidates.length);
  // --promote: 閾値未満の特定案件を candidate に昇格する。
  // 在庫ゼロの軸を埋めるとき、score (単価×EPC) は低いが需要が大きい案件を通すための経路。
  // **この run で実際に A8 から収集できた案件しか昇格できない** (存在しない ID は中止)。
  if (opts.promote?.length) {
    // core は素 JS (.mjs) なので戻り値が any。ここで使う形だけを宣言する。
    // `new Map(any[].map(...))` は tuple に推論されず Map<unknown, unknown> になり、
    // p.score / p.name が型エラーになる (2026-08-13 に型検査を有効化して発覚)。
    type ScoredProgram = { programId: string; score: number; name: string; vertical?: string };
    const pool = new Map<string, ScoredProgram>(
      ((belowThreshold ?? []) as ScoredProgram[]).map((p) => [p.programId, p]),
    );
    const missing = opts.promote.filter((id) => !pool.has(id));
    if (missing.length) {
      console.error(`❌ --promote の ID が今回の収集結果 (閾値未満) に無い: ${missing.join(", ")}`);
      console.error("   スペル違い / 既に candidate 以上 / 検索語が違う のいずれか。中止する。");
      return;
    }
    for (const id of opts.promote) {
      const p = pool.get(id)!;
      console.log(`  ⤴ 昇格 ${p.score.toFixed(2)} ${id} ${p.name}`);
      top.push({ ...p, promotedBy: "gap-fill" });
    }
  }
  let cat = loadCatalog();
  cat = core.upsertCandidates(cat, top, { at: nowIso() });
  saveCatalog(cat);
  console.log(`✅ candidate ${top.length} 件 upsert (blocked ${blocked.length} / dup ${duplicates.length})`);
}

// ─── サブコマンド: import-partnered ────────────────
// A8 で既に提携中 (承認済み) のプログラムを全ページ巡回して catalog に approved で取り込む。
// 申請フローを経ずに harvest → register → 公開へ直行できる (既存資産の活用)。
async function cmdImportPartnered(page: Page): Promise<void> {
  const curated = core.loadCurated();
  const existingAds = loadExistingAds();
  const all: any[] = [];
  for (let pageNo = 1; pageNo <= 30; pageNo++) {
    await page.goto(`${A8.partneredListUrl}?pageNo=${pageNo}`, { waitUntil: "networkidle", timeout: 40000 });
    await page.waitForTimeout(3000);
    if (!(await isLoggedIn(page))) return recordSessionExpired("import-partnered");
    const cards = await scrapeCurrentPage(page);
    if (cards.length === 0) break;
    for (const c of cards) {
      if (!c.programId) continue;
      const p = normalizeProgram(c);
      p.vertical = core.resolveVertical(p, curated);
      p.alreadyRegistered = core.isDuplicate(p, existingAds); // 既に AFFILIATE_ADS に在れば register で skip 対象
      all.push(p);
    }
    console.log(`  page ${pageNo}: ${cards.length} 件`);
    if (cards.length < 20) break; // 最終ページ
    await page.waitForTimeout(1200);
  }
  if (all.length === 0) {
    console.log("既存提携が見つかりません (セレクタ or ページ構造を確認)。");
    return;
  }
  const resolved = all.filter((p) => p.vertical).length;
  const alreadyReg = all.filter((p) => p.alreadyRegistered).length;
  let cat = loadCatalog();
  cat = core.upsertApproved(cat, all, { at: nowIso(), note: "existing-partnership" });
  saveCatalog(cat);
  console.log(
    `✅ 既存提携 ${all.length} 件を approved で取り込み (vertical 解決 ${resolved} / 既登録 ${alreadyReg} / 未解決 ${all.length - resolved})`,
  );
}

// ─── サブコマンド: apply ───────────────────────────
async function cmdApply(page: Page, max: number, ids: string[] | null = null): Promise<void> {
  let cat = loadCatalog();
  let candidates = core.entriesByStatus(cat, "candidate");
  if (candidates.length === 0) {
    console.log("candidate なし。先に scout を実行してください。");
    return;
  }
  // ★ --id 指定時は**その programId だけ**に申請する。
  //   指定した ID が candidate に無ければ**中止する** (黙って別案件に申請しない)。
  //   申請は不可逆なので「意図した対象か」を送信前に確定させる。
  if (ids) {
    const byId = new Map(candidates.map((e: any) => [e.programId, e]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      console.error(`❌ candidate に無い programId: ${missing.join(", ")}`);
      console.error("   (既に applied/approved か、scout 未実施の可能性。中止します)");
      process.exitCode = 2;
      return;
    }
    candidates = ids.map((id) => byId.get(id));
    console.log(`🎯 --id 指定: ${candidates.length} 件に限定`);
    for (const e of candidates) console.log(`   - ${e.programId} ${String(e.name || "").slice(0, 46)}`);
  }
  // 週次申請上限を機械強制。
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  let budget = applyBudget.applyBudget(cat, today);
  console.log(`申請枠: 今週 ${budget.weekCount}/${budget.max} (残 ${budget.remaining})`);

  const wanted = Math.min(candidates.length, budget.remaining, Number.isFinite(max) ? max : Infinity);
  if (wanted <= 0) {
    console.log("🚫 今週の申請枠なし。skip。");
    return;
  }

  // sent = 実際に申請を送信した数 (= 週上限の対象)。skip (既申込/既提携) は送信していないので数えない。
  // ★ runaway 防止: 送信のたびに sent を増やし wanted で必ず break する (成功判定に依存しない)。
  let sent = 0;
  let skipped = 0;
  for (const entry of candidates) {
    if (sent >= wanted) break;
    budget = applyBudget.applyBudget(loadCatalog(), today);
    if (!budget.ok) {
      console.log("🚫 週上限に到達。残りは翌週。");
      break;
    }
    if (IS_DRY_RUN) {
      console.log(`🧪 dry-run apply: ${entry.name} (score ${entry.score?.toFixed(2)})`);
      sent++;
      continue;
    }
    const result = await applyToProgram(page, entry);
    cat = loadCatalog();
    if (result === "applied") {
      cat.entries[entry.programId] = core.transition(cat.entries[entry.programId], "applied", {
        at: nowIso(),
      });
      sent++;
      console.log(`📨 申請送信: ${entry.name}`);
    } else if (result === "skip") {
      // 申請ボタンが無い = 既に申込中/提携中 (今回送信なし)。applied 扱いにするが at 無し = 週上限に数えない。
      cat.entries[entry.programId] = core.transition(cat.entries[entry.programId], "applied", {
        note: "already-on-a8-no-send",
      });
      skipped++;
      console.log(`⏭  既申込/既提携 (送信なし): ${entry.name}`);
    } else {
      cat.entries[entry.programId] = core.transition(cat.entries[entry.programId], "error", {
        at: nowIso(),
        step: "apply",
        error: "apply-error",
      });
      console.log(`❌ 申請エラー: ${entry.name}`);
    }
    saveCatalog(cat);
    await page.waitForTimeout(2000 + Math.floor((page.viewportSize()?.width ?? 1280) % 1500)); // randomized wait
  }
  console.log(`✅ 送信 ${sent} 件 / 既存 skip ${skipped} 件`);
}

/**
 * 提携申請を送る。A8 新コンソールは「プログラムの提携申請をする」ボタンの
 * **1 クリックで申請が確定・送信される** (規約同意の別画面は無い。実機確認 2026-07-20)。
 * → ボタンを押せた時点で申請済み。成功文言 (提携を申請しました / 提携申請完了 / 提携完了) で追認する。
 * 戻り値: "applied"(送信成功) / "skip"(ボタン無し=既申込/既提携=送信なし) / "error"。
 */
async function applyToProgram(page: Page, entry: any): Promise<"applied" | "skip" | "error"> {
  await page.goto(A8.detailNotPartneredUrl(entry.programId), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  if (!(await isLoggedIn(page))) {
    recordSessionExpired("apply");
    return "error";
  }
  // ★ 申請サイト assert (誤サイト提携の防止)。detail に <select name="webSiteId"> が在れば
  //   stats47 側を選んでから申請する。選べないなら申請しない (error)。
  const siteSel = page.locator("select[name=webSiteId]");
  if ((await siteSel.count()) > 0) {
    const opts = (await siteSel.locator("option").allTextContents()).map((o) => o.trim());
    const target = pickTargetSiteOption(opts);
    if (!target) {
      console.error(
        `❌ webSiteId に "${TARGET_SITE}" が無い (${JSON.stringify(opts)})。誤サイト防止で申請中止: ${entry.name}`,
      );
      await saveScreenshot(page, `apply-site-missing-${entry.programId}`);
      return "error";
    }
    await siteSel.selectOption({ label: target });
    await page.waitForTimeout(500);
    const selected = await siteSel
      .evaluate((el: HTMLSelectElement) => el.options[el.selectedIndex]?.textContent?.trim() || "")
      .catch(() => "");
    if (selected !== target) {
      console.error(`❌ 申請サイトを "${target}" に確定できない (現: "${selected}")。申請中止: ${entry.name}`);
      await saveScreenshot(page, `apply-site-unset-${entry.programId}`);
      return "error";
    }
    console.log(`  🎯 申請サイト = ${selected}`);
  }
  const applyBtn = await tryFind(page, A8.applyButton);
  if (!applyBtn) {
    // 申請ボタンが無い = 既に申込中/提携中 or 対象外。**送信していない**ので skip (error にしない)。
    await saveScreenshot(page, `apply-btn-missing-${entry.programId}`);
    return "skip";
  }
  // ★このクリックで申請が送信される (webSiteId=stats47 選択済み)。以降は「送信済み」として扱う。
  await applyBtn.evaluate((el: HTMLElement) => el.click());
  await page.waitForTimeout(2500);
  const done = await page
    .evaluate(() =>
      /提携を申請しました|提携申請完了|提携完了|申込を受け付け/.test(document.body.innerText),
    )
    .catch(() => false);
  if (!done) {
    // 文言未確認でもボタンは押せている = 送信された可能性が高い。誤って未送信扱いにしない。
    // check-approval が申込中/参加中一覧で最終追認するため applied 扱いにする (スクショは残す)。
    await saveScreenshot(page, `apply-sent-unverified-${entry.programId}`);
  }
  return "applied";
}

// ─── サブコマンド: check-approval ──────────────────
/** 参加中一覧の巡回上限 (pageSize=100 なら 3,000 件相当)。無限ループの保険。 */
const MAX_PARTNERED_PAGES = 30;

/**
 * 参加中 (承認済み) プログラムの programId 集合を**全ページ巡回**で取得する。
 *
 * 1 ページしか読まないと A8 の既定ページサイズ (20 件) を超えた承認を取りこぼす。
 * 承認日の降順に並ぶので直近分は 1 ページ目に載るが、週次 cron が止まっている間に溜まった
 * 承認は永久に applied のまま残る (降格はしないので誤昇格ではなく取りこぼしが累積する)。
 *
 * 打ち切りは**新規 ID が 1 件も増えなかったページ**とする。件数で判定すると、最終ページが
 * ちょうど pageSize と同数だったときに 1 ページ余分に読むだけで済むが、逆に A8 が範囲外の
 * pageNo で最終ページを返し続けた場合に止まらない。ID 集合の増加を見れば両方に耐える。
 * (2026-08-04 実測: p1=100 件 / p2=+58 件 / p3=+0 で停止し計 158 件)
 *
 * @returns programId 集合。ログイン失効時は null (呼び元が session-expired を記録する)。
 */
async function collectPartneredProgramIds(
  page: Page,
  opts: { dumpFirstPage?: string } = {},
): Promise<Set<string> | null> {
  const ids = new Set<string>();
  for (let pageNo = 1; pageNo <= MAX_PARTNERED_PAGES; pageNo++) {
    await page.goto(A8.partneredListPageUrl(pageNo), { waitUntil: "domcontentloaded", timeout: 40000 });
    await page.waitForTimeout(2500);
    if (!(await isLoggedIn(page))) return null;
    if (opts.dumpFirstPage && pageNo === 1) await dumpPage(page, opts.dumpFirstPage);
    const before = ids.size;
    // programId は href から取る (表示名より確実)。参加中一覧の programId リンクは
    // detail-partnered / create-link のみで、一覧行以外から拾う超集合にはならない (2026-08-04 確認)。
    const found = await page.$$eval("a[href*='programId=']", (as) =>
      as.map((a) => (a.getAttribute("href")?.match(/programId=(s\d+)/) || [])[1]).filter(Boolean),
    );
    for (const id of found) ids.add(id as string);
    console.log(`  page ${pageNo}: リンク ${found.length} 件 / ID 累計 ${ids.size} 件`);
    if (ids.size === before) return ids; // 新規 0 = 最終ページを越えた (正常終了)
    await page.waitForTimeout(1200);
  }
  // ここに来た = 上限まで新規が出続けた = **まだ続きがある**。黙って打ち切ると
  // 「全部見た」と区別が付かず、取りこぼしが再び静かに累積する (今回直した不具合と同じ形)。
  console.warn(
    `⚠️ 参加中一覧が ${MAX_PARTNERED_PAGES} ページ上限に到達 (ID ${ids.size} 件)。` +
      ` 続きが残っている可能性があるため、承認の取りこぼしを疑うこと (MAX_PARTNERED_PAGES を見直す)。`,
  );
  return ids;
}

async function cmdCheckApproval(page: Page): Promise<void> {
  let cat = loadCatalog();
  const applied = core.entriesByStatus(cat, "applied");
  if (applied.length === 0) {
    console.log("applied なし。");
    return;
  }
  const partneredIds = await collectPartneredProgramIds(page, {
    dumpFirstPage: IS_DRY_RUN ? "check-approval-dryrun" : undefined,
  });
  if (!partneredIds) return recordSessionExpired("check-approval");

  if (IS_DRY_RUN) {
    const hits = applied.filter((e: any) => partneredIds.has(e.programId));
    console.log(
      `🧪 dry-run: 参加中 ${partneredIds.size} 件を収集。applied ${applied.length} 件中 ${hits.length} 件が承認済み (昇格はしない)。`,
    );
    for (const e of hits) console.log(`   - ${e.programId} ${String(e.name || "").slice(0, 46)}`);
    return;
  }

  let approved = 0;
  for (const entry of applied) {
    cat = loadCatalog();
    if (partneredIds.has(entry.programId)) {
      cat.entries[entry.programId] = core.transition(cat.entries[entry.programId], "approved", {
        at: nowIso(),
      });
      approved++;
      console.log(`✅ 承認: ${entry.name}`);
      saveCatalog(cat);
    }
    // 参加中一覧に無いものは applied のまま (翌週再走査)。rejected の自動判定は A8 の
    // 「却下」表示 UI を確認してから (誤って rejected にしない)。
  }
  console.log(`✅ ${approved}/${applied.length} 件が承認済みに昇格`);
}

// ─── サブコマンド: harvest ─────────────────────────
/**
 * @param opts.includeRegistered 既 registered からも取る (text 在庫の後追い取得用)。
 *   registered は状態機械上 harvested へ戻せない (registered → published|error のみ) ので
 *   **status は変えず** `pendingDrafts` に積む。append 側が status を問わず拾って追記する。
 * @param opts.textOnly text コードだけを採る (banner は既登録なので取り直さない)。
 */
async function cmdHarvest(
  page: Page,
  limit: number,
  opts: { includeRegistered?: boolean; textOnly?: boolean } = {},
): Promise<void> {
  let cat = loadCatalog();
  // selectedForRegister フラグ付き approved のみ harvest する (select-for-register.mjs で精選済み)。
  // 全 approved を無差別に harvest しない (A8 負荷)。既 harvested は除外。
  const approved = core.entriesByStatus(cat, "approved").filter((e: any) => e.selectedForRegister);
  // registered は banner 登録済み。text 在庫を作るために text だけ取り直す。
  const registered = opts.includeRegistered
    ? core.entriesByStatus(cat, "registered").filter((e: any) => !e.textHarvestedAt)
    : [];
  const targets = [...approved, ...registered].slice(0, Number.isFinite(limit) ? limit : undefined);
  if (targets.length === 0) {
    console.log(
      opts.includeRegistered
        ? "harvest 対象なし (approved の selectedForRegister も、text 未取得の registered も 0 件)。"
        : "harvest 対象 (selectedForRegister 付き approved) なし。先に select-for-register.mjs を実行。",
    );
    return;
  }
  console.log(`harvest 対象: ${targets.length} 件 (approved ${approved.length} / registered ${registered.length})`);
  // ログイン確認は fetchAdCode が createLink (media-console) 上で毎回行う (www.a8.net は非 media-console で誤判定するため事前チェックしない)。

  let harvested = 0;
  let textAdded = 0;
  for (const entry of targets) {
    const isRegistered = entry.status === "registered";
    if (IS_DRY_RUN) {
      console.log(`🧪 dry-run harvest: ${entry.name}${isRegistered ? " (registered → text のみ)" : ""}`);
      continue;
    }
    const codes = await fetchAdCode(page, entry);
    cat = loadCatalog();
    const cur = cat.entries[entry.programId];
    if (!codes || (!codes.banner && !codes.text)) {
      // registered は既に配信中なので error に落とさない (banner は生きている)。次回対象から外すだけ。
      if (isRegistered) {
        cur.textHarvestedAt = nowIso();
        cur.textHarvestResult = "no-code";
        saveCatalog(cat);
        console.log(`  ─ text 無し: ${entry.name}`);
        continue;
      }
      cat.entries[entry.programId] = core.transition(cur, "error", {
        at: nowIso(),
        step: "harvest",
        error: "no-ad-code",
      });
      saveCatalog(cat);
      continue;
    }

    /** コード → draft。parse 失敗なら null。 */
    const toDraft = (code: string | null) => {
      if (!code) return null;
      const p = codeCore.parseA8Code(code);
      return p.ok ? buildAdDraft(entry, p.fields) : null;
    };

    // registered からは text だけを採る (banner は既登録・取り直す意味がない)。
    if (isRegistered || opts.textOnly) {
      const textDraft = toDraft(codes.text);
      cur.textHarvestedAt = nowIso();
      cur.textHarvestResult = textDraft ? "ok" : "no-text";
      if (textDraft && entry.vertical) {
        // status は変えない (registered → harvested は不正遷移)。append が status 非依存で拾う。
        cur.pendingDrafts = [...(cur.pendingDrafts ?? []), textDraft];
        textAdded++;
        console.log(`📝 text 追加: ${entry.name}`);
      } else {
        console.log(`  ─ ${textDraft ? "vertical 未解決" : "text 無し"}: ${entry.name}`);
      }
      saveCatalog(cat);
      continue;
    }

    // approved: 従来どおり banner 優先で adDraft を作り、text も取れていれば pendingDrafts に積む。
    const bannerDraft = toDraft(codes.banner);
    const textDraft = toDraft(codes.text);
    const primary = bannerDraft ?? textDraft;
    if (!primary) {
      cat.entries[entry.programId] = core.transition(cur, "error", {
        at: nowIso(),
        step: "harvest",
        error: "parse-failed",
      });
      saveCatalog(cat);
      console.log(`⚠️  parse 失敗: ${entry.name}`);
      continue;
    }
    cur.adDraft = primary;
    if (bannerDraft && textDraft) {
      cur.pendingDrafts = [...(cur.pendingDrafts ?? []), textDraft];
      textAdded++;
    }
    const nextStatus = entry.vertical ? "harvested" : "pending-vertical";
    cat.entries[entry.programId] = core.transition(cur, nextStatus, { at: nowIso() });
    saveCatalog(cat);
    harvested++;
    console.log(`📥 harvest: ${entry.name} → ${nextStatus}${bannerDraft && textDraft ? " (+text)" : ""}`);
  }
  console.log(`✅ ${harvested} 件 harvest / text 追加 ${textAdded} 件`);
}

type AdCodes = { banner: string | null; text: string | null };

async function fetchAdCode(page: Page, entry: any): Promise<AdCodes | null> {
  // 広告リンク作成ページ → 「広告リンクを表示」→ 広告コード textarea を取得。
  await page.goto(A8.createLinkUrl(entry.programId), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  if (!(await isLoggedIn(page))) {
    recordSessionExpired("harvest");
    return null;
  }
  // ★ create-link のサイトも stats47 に選ぶ (select name=websiteId・小文字 w = apply の webSiteId とは別名)。
  //   ラベルは「統計で見る都道府県【アピールサイト】」等の表記ゆれがあるため部分一致で吸収する。
  //   選べなければ誤サイトの広告コードを取り込まないよう harvest を中止する。
  const clSite = page.locator("select[name=websiteId]");
  if ((await clSite.count()) > 0) {
    const opts = (await clSite.locator("option").allTextContents()).map((o) => o.trim());
    const target = pickTargetSiteOption(opts);
    if (!target) {
      console.error(
        `❌ create-link に "${TARGET_SITE}" が無い (${JSON.stringify(opts)})。誤サイトコード防止で harvest 中止: ${entry.name}`,
      );
      await saveScreenshot(page, `harvest-site-missing-${entry.programId}`);
      return null;
    }
    await clSite.selectOption({ label: target });
    await page.waitForTimeout(800);
  }
  // 広告コードは「広告リンクを表示」クリックで textarea に出現する。
  await tryClick(page, A8.showAdLinkButton);
  await page.waitForTimeout(2000);
  // 表示された全 textarea の A8 コードを収集し、canonical バナー優先・無ければ text を選ぶ。
  // 多くの A8 案件は canonical 300×250 を提供せず旧規格サイズ + text のみ (実測 2026-07-20)。
  // 非 canonical バナーで harvest を失敗させないため、parseA8Code が ok になるコードだけ採る。
  const codes: string[] = await page.$$eval("textarea", (tas) =>
    tas.map((t) => (t as HTMLTextAreaElement).value).filter((v) => /px\.a8\.net\/svt\/ejp/.test(v)),
  );
  if (codes.length === 0) {
    await saveScreenshot(page, `ad-code-missing-${entry.programId}`);
    return null;
  }
  let banner: string | null = null;
  let text: string | null = null;
  for (const c of codes) {
    const p = codeCore.parseA8Code(c);
    if (!p.ok) continue; // 非 canonical バナー等はスキップ
    if (p.fields.adType === "banner" && !banner) banner = c;
    else if (p.fields.adType === "text" && !text) text = c;
  }
  // ★ 両方返す (2026-07-28 変更)。以前は `banner ?? text` で **text を捨てていた**ため、
  //   banner が取れる案件からは text 在庫が一切作れなかった。どちらを採るかは呼び出し側が決める。
  //   同一プログラムでも banner と text は a8mat が別なので、両方 SSOT に登録できる。
  return { banner, text };
}

/** parsed fields → AffiliateAd draft (id 採番は register 段で衝突チェックするので仮 id)。 */
// buildAdDraft は判定 (locationCode の振り分け・slug 生成) を含む純関数なので
// コア (a8-append-core.mjs) に置き、ここからは呼ぶだけにする
// (本ファイル冒頭の方針「判定はコアに委譲・ブラウザ層は操作と生データ抽出のみ」に従う)。

// ─── メイン ────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  IS_DRY_RUN = args.includes("--dry-run");
  const numAfter = (flag: string, def: number) => {
    const i = args.indexOf(flag);
    return i >= 0 ? Number(args[i + 1]) : def;
  };
  const limit = numAfter("--limit", Infinity);
  const max = numAfter("--max", Infinity);
  // ★ apply の対象を programId で明示指定する。
  //   これが無いと candidate を出現順に申請するため「どれに申請したか」を選べず、
  //   ブランド不適な案件 (スコアは高い) に送信してしまう。申請は不可逆なので指定を既定にする。
  const idArg = args.indexOf("--id");
  const ids: string[] | null =
    idArg >= 0 ? String(args[idArg + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean) : null;

  if (!["scout", "apply", "check-approval", "harvest", "import-partnered", "inspect-offer"].includes(cmd)) {
    console.error(
      "使い方: npx tsx a8-browser.ts <scout|apply|check-approval|harvest|import-partnered|inspect-offer> [--dry-run] [--limit N] [--max N] [--id id1,id2]",
    );
    process.exit(1);
  }
  if (IS_DRY_RUN) console.log("🧪 DRY RUN モード");

  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  const context: BrowserContext = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: !args.includes("--headed"),
    viewport: { width: 1280, height: 900 },
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = context.pages()[0] || (await context.newPage());
  await restoreSession(context);

  try {
    if (cmd === "scout") {
      const qi = args.indexOf("--query");
      const vi = args.indexOf("--vertical");
      const pi = args.indexOf("--promote");
      await cmdScout(page, limit, {
        queries: qi >= 0 ? String(args[qi + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        vertical: vi >= 0 ? args[vi + 1] : undefined,
        promote: pi >= 0 ? String(args[pi + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      });
    }
    else if (cmd === "apply") await cmdApply(page, max, ids);
    else if (cmd === "check-approval") await cmdCheckApproval(page);
    else if (cmd === "harvest")
      await cmdHarvest(page, limit, {
        includeRegistered: args.includes("--include-registered"),
        textOnly: args.includes("--text-only"),
      });
    else if (cmd === "import-partnered") await cmdImportPartnered(page);
    else if (cmd === "inspect-offer") await cmdInspectOffer(page, ids);
  } catch (e) {
    console.error("エラー:", e);
    await saveScreenshot(page, `error-${cmd}`);
  } finally {
    await page.waitForTimeout(2000);
    await context.close();
  }
}

main().catch(console.error);
