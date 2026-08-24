#!/usr/bin/env node
/**
 * build-coverage-queue.mjs — GSC「カバレッジ是正キュー」を構築/更新する単一の頭脳。
 *
 * GSC「ページ」インデックスエクスポート (ingest-gsc-export.py で正規化済の `*-drilldown.csv`) を入力に、
 * 各 URL の**現在の本番 HTTP ステータスを Googlebot UA で実測**して A/B に分類し、状態付きキューに upsert する。
 *
 * 分類 (verdict):
 *   - intentional        : 意図的カテゴリ (redirect/robots/noindex/alt-canonical/duplicate) → 放置 (resolved-by-design)
 *   - now-gone (410)      : 既に削除済 (発生源修正済・GSC 再クロール待ち) → 放置
 *   - now-redirect (3xx)  : 既に 301 化済 → 放置 (301→410 連鎖は note)
 *   - live-misflagged     : 404/5xx/crawled だが**現在 200** = 生きてるのに誤登録 → action: resubmit (Indexing API)
 *   - live-soft404        : soft404 だが**現在 200** = Google が薄いと判定 → action: content-check (薄さ/描画確認)
 *   - still-5xx           : **現在も 5xx** = 実バグ → action: fix-5xx (最優先)
 *   - still-404           : **現在も 404** = 公開漏れ(122 metric pipeline 等) or 真に死亡 → action: verify-intent
 *   - recheck             : timeout/0 → 再測定
 *
 * 真実源 (SSOT): .claude/state/gsc/coverage-remediation-queue.json (git tracked, 状態保持)
 * 副産物: LATEST.md (人間向け要約) / coverage-totals-history.csv (経過観測) /
 *          <週>/coverage-live-resubmit-urls.csv (auto-resubmit.mjs が拾う curated 入力)
 *
 * Usage:
 *   node .claude/scripts/gsc/build-coverage-queue.mjs                 # 最新週を取り込み・実測・upsert
 *   node .claude/scripts/gsc/build-coverage-queue.mjs --week 2026-W25
 *   node .claude/scripts/gsc/build-coverage-queue.mjs --no-probe      # 実測せずキャッシュ再利用 (高速)
 *   node .claude/scripts/gsc/build-coverage-queue.mjs --probe-limit 2000
 *   node .claude/scripts/gsc/build-coverage-queue.mjs --next 20       # 次にやる actionable を JSONL
 *   node .claude/scripts/gsc/build-coverage-queue.mjs --mark-in-progress <url>
 *   node .claude/scripts/gsc/build-coverage-queue.mjs --mark-done <url> [--wave-id 2026-06-16-coverage]
 *
 * 正典: .claude/skills/analytics/gsc-coverage-remediation/SKILL.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  isIntentionallyNonIndexableResource,
  readHtmlIndexSignals,
} from "./coverage-policy.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const getArg = (flag, fb) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fb;
};
const hasFlag = (f) => args.includes(f);

const todayInTokyo = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const DRILLDOWN_DIR = path.join(PROJECT_ROOT, ".claude/state/metrics/gsc/coverage-drilldown");
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/gsc");
const QUEUE_PATH = path.join(STATE_DIR, "coverage-remediation-queue.json");
const LATEST_PATH = path.join(STATE_DIR, "LATEST.md");
const TOTALS_HISTORY = path.join(STATE_DIR, "coverage-totals-history.csv");

const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const TODAY = getArg("--date", todayInTokyo());

// ── カテゴリ定義 ───────────────────────────────────────────────
// actionable = 実測して live/壊れを判別する。intentional = 設計上の挙動なので放置。
const ACTIONABLE = new Set([
  "not-found-404",
  "soft-404",
  "server-error-5xx",
  "crawled-not-indexed",
  "discovered-not-indexed",
]);
const INTENTIONAL = new Set([
  "redirect",
  "redirect-error",
  "robots-blocked",
  "robots-blocked-indexed",
  "noindex-excluded",
  "alt-canonical",
  "other-4xx",
  "duplicate-google-chose-other",
  "duplicate-no-user-canonical",
]);
// 優先度 (小さいほど先)。--next と LATEST の並び。
const ACTION_PRIORITY = {
  "fix-5xx": 1,
  "restore-gone-key": 1, // 410 なのに KNOWN∩isActive = 誤GONE (2026-07-03 の56件障害クラス)
  "observe-after-fix": 2, // 旧 "resubmit"。Indexing API 送信はせず修正後に URL Inspection で観測 (準拠是正 2026-07-23)
  deactivate: 3, // データ無しで200を返す空ページ → isActive:false/GONE
  noindex: 4, // 空テンプレ/検索/重複 → robots noindex
  "content-check": 5, // 未判定の soft404→200
  enrich: 6, // 県名のみ差の重複 → 県別データ補強
  "verify-intent": 7,
  recheck: 8,
  none: 99,
};
// content-check の人/agent 判定 (content_verdict) → action マッピング。
// 一度付けたら build の HTTP 再分類で上書きされず保持される。
const CONTENT_VERDICT_ACTION = {
  // 後方互換: 旧 content_verdict "resubmit" は observe-after-fix にマップする (準拠是正 2026-07-23)
  resubmit: "observe-after-fix",
  "observe-after-fix": "observe-after-fix",
  enrich: "enrich",
  noindex: "noindex",
  deactivate: "deactivate",
};

// ── キュー I/O ─────────────────────────────────────────────────
const loadQueue = () => {
  if (!fs.existsSync(QUEUE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
  } catch {
    return null;
  }
};
const saveQueue = (q) => {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(q, null, 2) + "\n");
};

// ── --mark-* モード ────────────────────────────────────────────
// SKILL の runbook は verify-intent の終着点を `resolved-by-design` と定めているが、
// 以前は done / in-progress しか表現できず「死亡が正」を done (=直した) と混同していた。
// --mark-by-design を足し、併せて @file で一括指定できるようにした (1 件ずつ 19 回叩かない)。
const markIP = getArg("--mark-in-progress", null);
const markDone = getArg("--mark-done", null);
const markDesign = getArg("--mark-by-design", null);
if (markIP || markDone || markDesign) {
  const q = loadQueue();
  if (!q) {
    console.error("[err] queue が無い。先に build を実行: node build-coverage-queue.mjs");
    process.exit(1);
  }
  const spec = markIP || markDone || markDesign;
  // "@path" なら 1 行 1 URL のファイルとして読む (URL にカンマが入りうるので分割はしない)
  const urls = spec.startsWith("@")
    ? fs.readFileSync(spec.slice(1), "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    : [spec];
  const note = getArg("--note", null);
  const waveId = getArg("--wave-id", null);
  const missing = [];
  let changed = 0;
  for (const url of urls) {
    const e = q.queue.find((x) => x.url === url);
    if (!e) {
      missing.push(url);
      continue;
    }
    if (markIP) {
      e.status = "in-progress";
    } else if (markDone) {
      e.status = "done";
      e.resolved_at = TODAY;
      if (waveId) e.wave_id = waveId;
    } else {
      e.status = "resolved-by-design";
      e.resolved_at = TODAY;
      if (waveId) e.wave_id = waveId;
    }
    if (note) e.note = note;
    changed += 1;
  }
  // 1 件でも queue に無ければ止める (存在しない URL を黙って無視すると「片付けた」と誤認する)
  if (missing.length) {
    console.error(`[err] queue に無い URL が ${missing.length} 件あります:`);
    missing.slice(0, 5).forEach((u) => console.error(`   ${u}`));
    process.exit(1);
  }
  saveQueue(q);
  const state = markIP ? "in-progress" : markDone ? "done" : "resolved-by-design";
  console.log(`[ok] ${changed} 件 → ${state}${waveId ? ` (wave ${waveId})` : ""}`);
  process.exit(0);
}

// ── 週の決定 ───────────────────────────────────────────────────
function latestWeekDir() {
  if (!fs.existsSync(DRILLDOWN_DIR)) return null;
  const weeks = fs
    .readdirSync(DRILLDOWN_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{4}-W\d{2}$/.test(d.name))
    .map((d) => d.name)
    .sort();
  return weeks.length ? weeks[weeks.length - 1] : null;
}
const week = getArg("--week", latestWeekDir());
if (!week) {
  console.error(`[err] coverage-drilldown に週ディレクトリが無い。先に取り込み: python3 .claude/scripts/gsc/ingest-gsc-export.py`);
  process.exit(1);
}
const weekDir = path.join(DRILLDOWN_DIR, week);

// ── drilldown CSV 読み込み (URL,前回のクロール) ────────────────
function readDrilldowns() {
  const files = fs
    .readdirSync(weekDir)
    .filter((f) => f.endsWith("-drilldown.csv"));
  const rows = [];
  for (const f of files) {
    const category = f.replace(/-drilldown\.csv$/, "");
    const text = fs.readFileSync(path.join(weekDir, f), "utf8");
    for (const [i, line] of text.split(/\r?\n/).entries()) {
      if (!line.trim()) continue;
      if (i === 0 && line.startsWith("URL")) continue;
      const cols = line.split(",");
      const url = cols[0]?.trim();
      if (!url || !url.startsWith("http")) continue;
      rows.push({ url, category, lastCrawl: cols[1]?.trim() ?? "" });
    }
  }
  return rows;
}

// ── 本番 HTTP 実測 (Googlebot UA, redirect manual, 並列) ─────────
// 社内プロキシ配下では Node の素の fetch が TLS 傍受で落ち、全 URL が status 0 (=recheck) になる。
// HTTPS_PROXY があれば明示 CONNECT する (前例: packages/ranking/src/scripts/audit-ranking-data-integrity.ts)。
// CI / 社外では dispatcher を作らず従来どおり。
// 2026-08-06 実測: これが無いと 2,456 件中 2,375 件が recheck に落ち分類が成立しなかった。
let cachedDispatcher;
async function getProxyDispatcher() {
  if (cachedDispatcher !== undefined) return cachedDispatcher;
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxyUrl) {
    cachedDispatcher = null;
    return null;
  }
  try {
    const { ProxyAgent } = await import("undici");
    cachedDispatcher = new ProxyAgent(proxyUrl);
  } catch {
    cachedDispatcher = null;
  }
  return cachedDispatcher;
}

async function probe(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const dispatcher = await getProxyDispatcher();
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": GOOGLEBOT_UA },
      redirect: "manual",
      signal: ctrl.signal,
      ...(dispatcher ? { dispatcher } : {}),
    });
    return res.status;
  } catch {
    return 0;
  } finally {
    clearTimeout(t);
  }
}

async function probeAll(urls, limit) {
  const results = new Map();
  let idx = 0;
  const CONC = 12;
  let done = 0;
  async function worker() {
    while (idx < urls.length) {
      const u = urls[idx++];
      results.set(u, await probe(u));
      done++;
      if (done % 100 === 0) process.stderr.write(`  probed ${done}/${urls.length}\r`);
    }
  }
  const target = limit ? urls.slice(0, limit) : urls;
  // limit は URL 配列に既に適用済みとして扱う (呼び出し側で slice)
  await Promise.all(Array.from({ length: CONC }, worker));
  process.stderr.write("\n");
  return results;
}

async function probeHtmlSignals(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const dispatcher = await getProxyDispatcher();
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": GOOGLEBOT_UA },
      redirect: "manual",
      signal: ctrl.signal,
      ...(dispatcher ? { dispatcher } : {}),
    });
    if (res.status !== 200) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;
    return readHtmlIndexSignals(
      await res.text(),
      res.headers.get("x-robots-tag") ?? "",
    );
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function probeHtmlSignalsAll(urls) {
  const results = new Map();
  let idx = 0;
  const CONC = 6;
  async function worker() {
    while (idx < urls.length) {
      const url = urls[idx++];
      results.set(url, await probeHtmlSignals(url));
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  return results;
}

// ── ranking キーの GONE 誤登録検出 (2026-07-03 の 56件 410 誤配信の再発防止) ──
// 「410 = 削除済 → 放置 (resolved-by-design)」と即断せず、KNOWN_RANKING_KEYS +
// metric config isActive:true と突合する。両方に該当する 410 は「誤って GONE 化された
// 生きているランキング」であり、GONE_RANKING_KEYS からの復帰が必要 (action: restore-gone-key)。
// 過去に COVERAGE-DEACT-01 (2026-06-16) がこの突合をせず births/marriages 等 56 件を
// 誤 deactivate → 本チェックで二度と resolved-by-design 扱いにしない。
const extractQuotedKeys = (filePath) => {
  try {
    const src = fs.readFileSync(filePath, "utf8");
    return new Set([...src.matchAll(/^\s*"([^"]+)",?\s*$/gm)].map((m) => m[1]));
  } catch {
    return new Set();
  }
};
const loadLiveRankingKeys = () => {
  const known = extractQuotedKeys(
    path.join(PROJECT_ROOT, "packages/ranking/src/config/known-ranking-keys.ts"),
  );
  // metric config の isActive:true キー (ファイル走査・~2200件で <1s)
  const metricsDir = path.join(PROJECT_ROOT, "packages/data-configs/src/metrics");
  const active = new Set();
  try {
    for (const f of fs.readdirSync(metricsDir)) {
      if (!f.endsWith(".ts")) continue;
      const src = fs.readFileSync(path.join(metricsDir, f), "utf8");
      const key = src.match(/"key":\s*"([^"]+)"/) ?? src.match(/key:\s*['"]([^'"]+)['"]/);
      if (key && /["']?isActive["']?\s*:\s*true/.test(src)) active.add(key[1]);
    }
  } catch {
    /* metrics dir 不在時は KNOWN のみで判定 */
  }
  return { known, active };
};
const LIVE_RANKING = loadLiveRankingKeys();
const rankingKeyFromUrl = (url) => {
  const m = url.match(/\/ranking\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : null;
};
const isMisgoneRankingUrl = (url) => {
  const key = rankingKeyFromUrl(url);
  if (!key) return false;
  if (!LIVE_RANKING.known.has(key)) return false;
  // active 集合が取れている場合は isActive も要求、取れない場合は KNOWN のみで警告
  return LIVE_RANKING.active.size === 0 || LIVE_RANKING.active.has(key);
};

// ── 分類 ───────────────────────────────────────────────────────
function classify(category, http) {
  if (INTENTIONAL.has(category)) {
    return { verdict: "intentional", action: "none", design: true };
  }
  // actionable
  if (http === 200) {
    if (category === "soft-404")
      return { verdict: "live-soft404", action: "content-check", design: false };
    return { verdict: "live-misflagged", action: "observe-after-fix", design: false };
  }
  if (http === 410) return { verdict: "now-gone", action: "none", design: true };
  if (http >= 300 && http < 400)
    return { verdict: "now-redirect", action: "none", design: true };
  if (http >= 500 && http < 600)
    return { verdict: "still-5xx", action: "fix-5xx", design: false };
  if (http === 404) return { verdict: "still-404", action: "verify-intent", design: false };
  if (http === 0) return { verdict: "recheck", action: "recheck", design: false };
  return { verdict: `http-${http}`, action: "verify-intent", design: false };
}

// ── --next モード ──────────────────────────────────────────────
const nextN = getArg("--next", null);
if (nextN) {
  const q = loadQueue();
  if (!q) {
    console.error("[err] queue が無い。先に build を実行");
    process.exit(1);
  }
  const actionable = q.queue
    .filter((e) => e.status === "pending" && e.action !== "none")
    .sort((a, b) => (ACTION_PRIORITY[a.action] ?? 50) - (ACTION_PRIORITY[b.action] ?? 50));
  for (const e of actionable.slice(0, parseInt(nextN, 10))) {
    console.log(JSON.stringify(e));
  }
  process.exit(0);
}

// ── build 本体 ─────────────────────────────────────────────────
async function build() {
  const drilldowns = readDrilldowns();
  if (!drilldowns.length) {
    console.error(`[err] ${week} に *-drilldown.csv が無い。先に ingest-gsc-export.py を実行`);
    process.exit(1);
  }

  const prev = loadQueue();
  const prevByUrl = new Map((prev?.queue ?? []).map((e) => [e.url, e]));

  // 実測対象 = actionable カテゴリの URL (intentional は実測不要)
  const probeLimit = parseInt(getArg("--probe-limit", "2500"), 10);
  const noProbe = hasFlag("--no-probe");
  const actionableUrls = drilldowns
    .filter(
      (r) =>
        ACTIONABLE.has(r.category) &&
        !isIntentionallyNonIndexableResource(r.url),
    )
    .map((r) => r.url);
  const uniqActionable = [...new Set(actionableUrls)].slice(0, probeLimit);

  let httpByUrl = new Map();
  let htmlSignalsByUrl = new Map();
  if (noProbe) {
    for (const u of uniqActionable) {
      const p = prevByUrl.get(u);
      httpByUrl.set(u, p?.current_http ?? null);
      if (
        p?.current_http === 200 &&
        typeof p?.robots_noindex === "boolean" &&
        typeof p?.soft_not_found === "boolean"
      ) {
        htmlSignalsByUrl.set(u, {
          robotsNoindex: Boolean(p.robots_noindex),
          softNotFound: Boolean(p.soft_not_found),
        });
      }
    }
    console.error(`[probe] --no-probe: ${uniqActionable.length} URL はキャッシュ値を使用`);
  } else {
    console.error(`[probe] ${uniqActionable.length} actionable URL を Googlebot UA で実測中...`);
    httpByUrl = await probeAll(uniqActionable, null);
    const htmlSignalUrls = drilldowns
      .filter(
        (r) =>
          ACTIONABLE.has(r.category) &&
          httpByUrl.get(r.url) === 200 &&
          !isIntentionallyNonIndexableResource(r.url),
      )
      .map((r) => r.url);
    console.error(
      `[probe] HTTP 200 ${htmlSignalUrls.length} URL の HTML index signal を確認中...`,
    );
    htmlSignalsByUrl = await probeHtmlSignalsAll([...new Set(htmlSignalUrls)]);
  }

  // upsert
  const seen = new Set();
  const queue = [];
  for (const r of drilldowns) {
    if (seen.has(r.url)) continue; // 同 URL は最初のカテゴリで代表
    seen.add(r.url);
    const old = prevByUrl.get(r.url);
    const nonIndexableResource = isIntentionallyNonIndexableResource(r.url);
    const http = ACTIONABLE.has(r.category) && !nonIndexableResource
      ? httpByUrl.has(r.url)
        ? httpByUrl.get(r.url)
        : null
      : nonIndexableResource
        ? old?.current_http ?? null
        : null; // intentional は未実測 (null)
    const htmlSignals = htmlSignalsByUrl.get(r.url) ?? null;
    const healthyNoindex =
      http === 200 &&
      htmlSignals?.robotsNoindex === true &&
      htmlSignals.softNotFound === false;
    const liveSoftNotFound = http === 200 && htmlSignals?.softNotFound === true;
    const cls = nonIndexableResource
      ? {
          verdict: "non-indexable-resource",
          action: "none",
          design: true,
        }
      : healthyNoindex
        ? {
            verdict: "intentional-noindex",
          action: "none",
          design: true,
        }
      : liveSoftNotFound
        ? {
            verdict: "live-soft404",
            action: "deactivate",
            design: false,
          }
      : classify(r.category, http ?? -1);

    // 410 の ranking URL が KNOWN∩isActive なら「誤GONE」— 放置 (now-gone) にせず復帰対象へ
    if (http === 410 && isMisgoneRankingUrl(r.url)) {
      cls.verdict = "gone-conflict";
      cls.action = "restore-gone-key";
      cls.design = false;
    }

    // content-check の確定判定 (content_verdict) があれば action を上書きして保持
    const contentVerdict = old?.content_verdict ?? null;
    if (
      !cls.design &&
      !liveSoftNotFound &&
      contentVerdict &&
      CONTENT_VERDICT_ACTION[contentVerdict]
    ) {
      cls.action = CONTENT_VERDICT_ACTION[contentVerdict];
      cls.verdict = `cc:${contentVerdict}`;
      cls.design = false;
    }

    let status;
    if (cls.design) {
      status = "resolved-by-design";
    } else if (old && old.status === "in-progress") {
      status = "in-progress"; // 人/agent が作業中 → 触らない
    } else if (
      old &&
      old.status === "resolved-by-design" &&
      http === 404
    ) {
      // 人が「この 404 は意図どおり」と確定した URL は、同じ 404 の間は再オープンしない。
      // 200/5xx 等へ変化した場合は通常分類へ戻して再確認する。
      status = "resolved-by-design";
    } else if (old && old.status === "done") {
      // done だが再び壊れて検出された場合のみ pending に戻す
      status = cls.action === "none" ? "done" : "done"; // done は維持 (再計測で壊れたら下で上書き)
      // 直近実測が依然 actionable (resubmit/fix/content) でも、人が done にした判定を尊重しつつ
      // 5xx 再発のような重大はやり直し
      if (cls.action === "fix-5xx") status = "pending";
    } else {
      status = "pending";
    }

    queue.push({
      url: r.url,
      gsc_category: r.category,
      gsc_last_crawl: r.lastCrawl,
      current_http: http,
      ...(htmlSignals
        ? {
            robots_noindex: htmlSignals.robotsNoindex,
            soft_not_found: htmlSignals.softNotFound,
          }
        : {}),
      verdict: cls.verdict,
      action: cls.action,
      status,
      first_seen: old?.first_seen ?? TODAY,
      last_checked: noProbe ? old?.last_checked ?? TODAY : TODAY,
      resolved_at: status === "done" ? old?.resolved_at ?? null : null,
      wave_id: old?.wave_id ?? null,
      content_verdict: contentVerdict,
      content_signal: old?.content_signal ?? null,
      note: old?.note ?? "",
    });
  }

  // カテゴリ別総件数 (ingest が保存した aggregate)
  let gscTotals = null;
  const totalsPath = path.join(weekDir, "category-totals.json");
  if (fs.existsSync(totalsPath)) {
    gscTotals = JSON.parse(fs.readFileSync(totalsPath, "utf8"));
  }

  // サマリ集計
  const byAction = {};
  const byVerdict = {};
  const byCategory = {};
  for (const e of queue) {
    byAction[e.action] = (byAction[e.action] ?? 0) + 1;
    byVerdict[e.verdict] = (byVerdict[e.verdict] ?? 0) + 1;
    byCategory[e.gsc_category] = (byCategory[e.gsc_category] ?? 0) + 1;
  }
  const pendingActionable = queue.filter(
    (e) => e.status === "pending" && e.action !== "none"
  ).length;

  const out = {
    generated_at: TODAY,
    week,
    source: "GSC UI ページ export (ingest-gsc-export.py) + 本番 HTTP 実測",
    gsc_category_totals: gscTotals?.totals ?? null,
    summary: {
      tracked_urls: queue.length,
      pending_actionable: pendingActionable,
      by_action: byAction,
      by_verdict: byVerdict,
      by_category: byCategory,
    },
    queue,
  };
  saveQueue(out);

  // observe-after-fix CSV: live-misflagged (404/5xx/crawled だが現在 200) の観測対象 URL。
  // Indexing API 送信はしない (準拠是正 2026-07-23)。sitemap/内部リンク/canonical を整えた上で
  // URL Inspection (url-inspection-daily.cjs) で coverageState 遷移を観測する。
  const observe = queue.filter(
    (e) => e.action === "observe-after-fix" && (e.status === "pending" || e.status === "in-progress")
  );
  const observeCsv = path.join(weekDir, "coverage-live-observe-urls.csv");
  fs.writeFileSync(
    observeCsv,
    "URL,前回のクロール\n" +
      observe.map((e) => `${e.url},${e.gsc_last_crawl}`).join("\n") +
      (observe.length ? "\n" : "")
  );

  // 経過観測: カテゴリ別総件数の履歴に追記
  if (gscTotals?.totals) {
    const cols = [
      "not-found-404",
      "soft-404",
      "server-error-5xx",
      "redirect",
      "crawled-not-indexed",
      "discovered-not-indexed",
      "noindex-excluded",
      "robots-blocked",
      "alt-canonical",
      "indexed-submitted",
    ];
    const header = "week,date," + cols.join(",");
    const line =
      `${week},${gscTotals.date ?? TODAY},` +
      cols.map((c) => gscTotals.totals[c] ?? "").join(",");
    let rows = [];
    if (fs.existsSync(TOTALS_HISTORY)) {
      rows = fs
        .readFileSync(TOTALS_HISTORY, "utf8")
        .split("\n")
        .filter((l) => l.trim() && !l.startsWith("week,"));
    }
    // 同週行は置換 (upsert)
    rows = rows.filter((l) => !l.startsWith(`${week},`));
    rows.push(line);
    rows.sort();
    fs.writeFileSync(TOTALS_HISTORY, header + "\n" + rows.join("\n") + "\n");
  }

  // LATEST.md
  writeLatest(out, observe.length);

  // コンソール要約
  console.log(`\nカバレッジ是正キュー更新: ${path.relative(PROJECT_ROOT, QUEUE_PATH)} (week ${week})`);
  console.log(`  tracked=${queue.length}  pending(actionable)=${pendingActionable}`);
  console.log(`  by_action: ${JSON.stringify(byAction)}`);
  console.log(`  observe-after-fix CSV: ${path.relative(PROJECT_ROOT, observeCsv)} (${observe.length} URL)`);
  console.log(`\n次にやる (--next で JSONL):`);
  const order = queue
    .filter((e) => e.status === "pending" && e.action !== "none")
    .sort((a, b) => (ACTION_PRIORITY[a.action] ?? 50) - (ACTION_PRIORITY[b.action] ?? 50));
  for (const e of order.slice(0, 10)) {
    console.log(`  [${e.action}] ${e.current_http} ${e.url}`);
  }
}

function writeLatest(out, observeCount) {
  const s = out.summary;
  const t = out.gsc_category_totals;
  const L = [];
  L.push(`# GSC カバレッジ是正 — ${out.week} (${out.generated_at})`);
  L.push("");
  L.push("> SSOT: `.claude/state/gsc/coverage-remediation-queue.json` / 正典: `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md`");
  L.push("");
  if (t) {
    L.push("## GSC カテゴリ別総件数 (UI export)");
    L.push("");
    L.push("| カテゴリ | 件数 | 扱い |");
    L.push("|---|---:|---|");
    const label = {
      "not-found-404": ["見つからない(404)", "大半=意図的削除/旧URL。放置"],
      "crawled-not-indexed": ["クロール済-未登録", "Google判断。live は observe-after-fix"],
      "robots-blocked": ["robots ブロック", "意図的(OGP/CSV)。放置"],
      "noindex-excluded": ["noindex 除外", "意図的。放置"],
      "redirect": ["リダイレクト", "意図的301。放置"],
      "discovered-not-indexed": ["検出-未登録", "クロール待ち"],
      "soft-404": ["ソフト404", "live は content-check"],
      "server-error-5xx": ["サーバーエラー5xx", "実測で fix/解消判定"],
      "alt-canonical": ["代替canonical", "正常"],
      "indexed-submitted": ["登録済み", "—"],
    };
    for (const [k, v] of Object.entries(t).sort((a, b) => b[1] - a[1])) {
      const meta = label[k] ?? [k, ""];
      L.push(`| ${meta[0]} | ${v} | ${meta[1]} |`);
    }
    L.push("");
  }
  L.push("## 是正キュー (本番 HTTP 実測ベース)");
  L.push("");
  L.push(`- 追跡 URL: **${s.tracked_urls}** / 要対応 pending: **${s.pending_actionable}**`);
  L.push("");
  L.push("| action | 件数 | 意味 |");
  L.push("|---|---:|---|");
  const am = {
    "fix-5xx": "現在も5xx=実バグ(最優先)",
    "observe-after-fix": "404/5xx→現在200=生きてる→sitemap/内部リンク整備後 URL Inspection で観測",
    deactivate: "config/データ無しの空200 ranking→KNOWN除去で404/410化",
    noindex: "空テンプレ/検索/未公開blog→noindex or 410",
    enrich: "全国テンプレ重複(area×cat)/未公開md→県別補強・公開",
    "content-check": "soft404→現在200=薄さ/描画 未判定",
    "verify-intent": "現在も404=公開漏れ or 死亡の判別",
    recheck: "timeout=再測定",
    none: "意図的/解消済=放置",
  };
  for (const [k, v] of Object.entries(s.by_action).sort(
    (a, b) => (ACTION_PRIORITY[a[0]] ?? 50) - (ACTION_PRIORITY[b[0]] ?? 50)
  )) {
    L.push(`| ${k} | ${v} | ${am[k] ?? ""} |`);
  }
  L.push("");
  L.push(`- observe-after-fix CSV: \`<週>/coverage-live-observe-urls.csv\` (**${observeCount} URL**) → 修正後に url-inspection-daily.cjs で観測`);
  L.push("");
  L.push("## 次サイクル");
  L.push("");
  L.push("1. live (`observe-after-fix`) → sitemap/内部リンク/canonical を整備 → `url-inspection-daily.cjs` で coverageState を観測 (Indexing API 送信はしない・準拠是正 2026-07-23)");
  L.push("2. `content-check` (soft404) → gsc-analyst で薄さ/描画確認 → 補強 or noindex → 良ければ observe-after-fix に格上げ");
  L.push("3. `fix-5xx` → 実バグ修正");
  L.push("4. 次週 GSC 再 export → `ingest` + `build` で件数の減少と done の indexed 化を経過観測");
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(LATEST_PATH, L.join("\n") + "\n");
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
