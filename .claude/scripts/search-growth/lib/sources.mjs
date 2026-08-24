/**
 * sources — 各データ源の (a) 既存 snapshot からの normalize と (b) live collect adapter。
 *
 * 正典: .claude/skills/analytics/search-growth/reference/platform-contract.md
 * (既存 fetcher を再利用・複製しない)。
 * ローカルには live API credential が無いため、collect は既存 committed snapshot の presence /
 * freshness を probe し、live fetch は既存 fetcher を subprocess で呼ぶ設計だけ用意する
 * (creds が無い間は skipped=live 未検証)。normalize は committed snapshot (実データ) を
 * Observation へ変換する。missing を 0 と混同しない。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createObservation } from "./contracts.mjs";
import { freshnessForSource, FRESHNESS_STALE_DEFAULT_DAYS } from "./freshness.mjs";
import { toPathKey, SITE_ORIGIN } from "./join-url.mjs";
import { redactString } from "./redaction.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const LIVE_DIR = path.join(PROJECT_ROOT, ".claude/state/search-growth/live");

// ── CSV / week helpers ────────────────────────────────────────────────

function parseCsv(text) {
  const rows = [];
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (!lines.length) return { header: [], rows };
  const header = splitCsvLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const rec = {};
    header.forEach((h, j) => (rec[h] = cols[j] ?? ""));
    rows.push(rec);
  }
  return { header, rows };
}
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** ISO 週文字列 "2026-W29" の日曜 (週末) の ISO date を返す。データ鮮度の基準。 */
function isoWeekEndDate(week) {
  const m = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!m) return null;
  const year = Number(m[1]);
  const wk = Number(m[2]);
  // ISO: 第1週は最初の木曜を含む週。1/4 を含む週の月曜から算出。
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7; // 月=1..日=7
  const week1Mon = new Date(jan4);
  week1Mon.setUTCDate(jan4.getUTCDate() - (jan4Dow - 1));
  const sunday = new Date(week1Mon);
  sunday.setUTCDate(week1Mon.getUTCDate() + (wk - 1) * 7 + 6);
  return sunday.toISOString().slice(0, 10);
}

function latestWeekDir(dir) {
  if (!fs.existsSync(dir)) return null;
  const weeks = fs.readdirSync(dir).filter((d) => /^\d{4}-W\d{2}$/.test(d)).sort();
  return weeks.length ? weeks[weeks.length - 1] : null;
}
function newestFile(dir, re) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => re.test(f))
    .map((f) => ({ f, m: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  return files.length ? path.join(dir, files[0].f) : null;
}
const numOrNull = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const rel = (p) => (p ? path.relative(PROJECT_ROOT, p) : null);

// ── source definitions ───────────────────────────────────────────────
// 各 def: name / staleAfterDays / api(live) / secretName(live) /
//   normalize(root, now) → { observedAt, snapshotFile, observations[] } | { observedAt:null }

const GSC = {
  name: "gsc",
  staleAfterDays: FRESHNESS_STALE_DEFAULT_DAYS.gsc,
  api: "searchconsole.searchanalytics.query",
  secretName: "GOOGLE_SERVICE_ACCOUNT_KEY_JSON",
  liveScript: ".claude/scripts/metrics/fetch-gsc-snapshot.mjs",
  normalize(root, now) {
    const dir = path.join(root, ".claude/skills/analytics/gsc-improvement/reference/snapshots");
    const week = latestWeekDir(dir);
    if (!week) return { observedAt: null };
    const file = path.join(dir, week, "pages.csv");
    if (!fs.existsSync(file)) return { observedAt: null };
    const observedAt = (isoWeekEndDate(week) ?? now.slice(0, 10)) + "T00:00:00Z";
    const start = weekStart(observedAt);
    const status = "success";
    const freshness = freshnessForSource({ status, observedAt, now, staleAfterDays: this.staleAfterDays });
    const { rows } = parseCsv(fs.readFileSync(file, "utf8"));
    const obs = [];
    for (const r of rows) {
      const page = toPathKey(r.page);
      if (!page) continue;
      for (const [metric, key] of [["clicks", "clicks"], ["impressions", "impressions"], ["ctr", "ctr"], ["position", "position"]]) {
        const value = numOrNull(r[key]);
        if (value === null) continue;
        obs.push(createObservation({
          source: "gsc", metric, dimensions: { page }, value,
          periodStart: start, periodEnd: observedAt.slice(0, 10), observedAt, freshness,
          provenance: { file: rel(file), api: this.api, limitations: ["GSC は全行を保証しない (rowLimit/pagination)", "finalized data は約2日遅延"] },
        }));
      }
    }
    return { observedAt, snapshotFile: rel(file), observations: obs, week };
  },
};

const GA4 = {
  name: "ga4",
  staleAfterDays: FRESHNESS_STALE_DEFAULT_DAYS.ga4,
  api: "analyticsdata.runReport",
  secretName: "GA4_PROPERTY_ID",
  liveScript: ".claude/scripts/metrics/fetch-ga4-snapshot.mjs",
  normalize(root, now) {
    const dir = path.join(root, ".claude/skills/analytics/ga4-improvement/reference/snapshots");
    const week = latestWeekDir(dir);
    if (!week) return { observedAt: null };
    const file = path.join(dir, week, "pages.csv");
    if (!fs.existsSync(file)) return { observedAt: null };
    const observedAt = (isoWeekEndDate(week) ?? now.slice(0, 10)) + "T00:00:00Z";
    const freshness = freshnessForSource({ status: "success", observedAt, now, staleAfterDays: this.staleAfterDays });
    const { rows } = parseCsv(fs.readFileSync(file, "utf8"));
    const obs = [];
    for (const r of rows) {
      const page = toPathKey(r.pagePath);
      if (!page) continue;
      const map = [
        ["pageviews", "screenPageViews"], ["users", "activeUsers"],
        ["avgSessionDuration", "averageSessionDuration"], ["engagementRate", "engagementRate"],
      ];
      for (const [metric, key] of map) {
        const value = numOrNull(r[key]);
        if (value === null) continue;
        obs.push(createObservation({
          source: "ga4", metric, dimensions: { page }, value,
          periodStart: weekStart(observedAt), periodEnd: observedAt.slice(0, 10), observedAt, freshness,
          provenance: { file: rel(file), api: this.api, limitations: ["GA4 sessions と GSC clicks は同値でない (timezone/consent/ad blocker/attribution 差)"] },
        }));
      }
    }
    return { observedAt, snapshotFile: rel(file), observations: obs, week };
  },
};

const PSI = {
  name: "psi",
  staleAfterDays: FRESHNESS_STALE_DEFAULT_DAYS.psi,
  api: "pagespeedonline.runpagespeed",
  secretName: "PSI_API_KEY",
  liveScript: ".claude/scripts/psi/fetch-psi-audit.mjs",
  normalize(root, now) {
    const dir = path.join(root, ".claude/state/metrics/psi");
    const file = newestFile(dir, /^psi-batch-.*\.json$/);
    if (!file) return { observedAt: null };
    const j = JSON.parse(fs.readFileSync(file, "utf8"));
    const observedAt = j.generated_at ?? fs.statSync(file).mtime.toISOString();
    const freshness = freshnessForSource({ status: "success", observedAt, now, staleAfterDays: this.staleAfterDays });
    const obs = [];
    for (const r of j.results ?? []) {
      const page = toPathKey(r.url);
      if (!page) continue;
      const device = r.strategy === "desktop" ? "desktop" : "mobile";
      const dims = { page, device };
      const push = (metric, value, limitations = []) => {
        if (value === null || value === undefined) return;
        obs.push(createObservation({
          source: "psi", metric, dimensions: dims, value, periodEnd: observedAt.slice(0, 10), observedAt, freshness,
          provenance: { file: rel(file), api: this.api, limitations },
        }));
      };
      push("performance_score", numOrNull(r.scores?.performance));
      push("lcp_ms", numOrNull(r.lab_data?.LCP_ms));
      push("cls", numOrNull(r.lab_data?.CLS));
      push("tbt_ms", numOrNull(r.lab_data?.TBT_ms));
      push("ttfb_ms", numOrNull(r.lab_data?.TTFB_ms));
      // PSI 埋込 CrUX (field): field data の長期 SSOT にしない。category のみ暫定利用。
      if (r.field_data?.LCP?.category) {
        push("lcp_field_category", r.field_data.LCP.category, ["PSI 埋込 CrUX。field data の長期 SSOT にしない (CrUX API/History を使う)"]);
      }
    }
    return { observedAt, snapshotFile: rel(file), observations: obs };
  },
};

/** coverage queue (本番 HTTP 実測済) → http:status + static:coverageCategory を per-URL に。 */
const COVERAGE = {
  name: "coverage",
  emitsAs: ["http", "static"],
  staleAfterDays: 14,
  api: "repo:coverage-remediation-queue",
  normalize(root, now) {
    const file = path.join(root, ".claude/state/gsc/coverage-remediation-queue.json");
    if (!fs.existsSync(file)) return { observedAt: null };
    const j = JSON.parse(fs.readFileSync(file, "utf8"));
    const observedAt = j.generated_at ?? fs.statSync(file).mtime.toISOString();
    const freshness = freshnessForSource({ status: "success", observedAt, now, staleAfterDays: this.staleAfterDays });
    const obs = [];
    for (const e of j.queue ?? []) {
      const page = toPathKey(e.url);
      if (!page) continue;
      const httpStatus = numOrNull(e.current_http);
      if (httpStatus !== null) {
        obs.push(createObservation({
          source: "http", metric: "status", dimensions: { page }, value: httpStatus,
          observedAt: e.last_checked ?? observedAt, freshness,
          provenance: { file: rel(file), api: "coverage HTTP probe (Googlebot UA)", limitations: ["build-coverage-queue の本番 HTTP 実測値 (live probe ではない)"] },
        }));
      }
      if (e.gsc_category && shouldEmitCoverageCategory(e)) {
        obs.push(createObservation({
          source: "static", metric: "coverageCategory", dimensions: { page }, value: mapCoverageCategory(e.gsc_category),
          observedAt, freshness,
          provenance: { file: rel(file), api: "GSC UI export → coverage queue", limitations: [] },
        }));
      }
    }
    return { observedAt, snapshotFile: rel(file), observations: obs };
  },
};

/** URL Inspection の per-URL 日次 CSV (あれば) → coverageState / canonical。 */
const INSPECTION = {
  name: "inspection",
  staleAfterDays: FRESHNESS_STALE_DEFAULT_DAYS.inspection,
  api: "searchconsole.urlInspection.index.inspect",
  secretName: "GOOGLE_SERVICE_ACCOUNT_KEY_JSON",
  liveScript: ".claude/scripts/gsc/url-inspection-daily.cjs",
  normalize(root, now) {
    const dir = path.join(root, ".claude/state/metrics/gsc/url-inspection");
    const file = newestFile(dir, /^\d{4}-\d{2}-\d{2}\.csv$/);
    if (!file) return { observedAt: null };
    const { header, rows } = parseCsv(fs.readFileSync(file, "utf8"));
    const dateFromName = path.basename(file, ".csv");
    const observedAt = dateFromName + "T00:00:00Z";
    const freshness = freshnessForSource({ status: "success", observedAt, now, staleAfterDays: this.staleAfterDays });
    const col = (names) => header.find((h) => names.some((n) => h.toLowerCase() === n));
    const urlC = col(["url", "inspectionurl", "page"]);
    const covC = col(["coveragestate", "coverage_state", "coverage"]);
    const idxC = col(["indexingstate", "indexing_state"]);
    const robC = col(["robotstxtstate", "robots_txt_state", "robots"]);
    const gcC = col(["googlecanonical", "google_canonical"]);
    const ucC = col(["usercanonical", "user_canonical"]);
    const lcC = col(["lastcrawltime", "last_crawl_time", "lastcrawl"]);
    if (!urlC) return { observedAt, snapshotFile: rel(file), observations: [] };
    const obs = [];
    for (const r of rows) {
      const page = toPathKey(r[urlC]);
      if (!page) continue;
      const emit = (metric, value) => {
        if (value === undefined || value === null || value === "") return;
        obs.push(createObservation({
          source: "inspection", metric, dimensions: { page }, value, observedAt, freshness,
          provenance: { file: rel(file), api: this.api, limitations: ["指定 URL 集合の観測 (GSC UI 全体件数とは別)"] },
        }));
      };
      if (covC) emit("coverageState", r[covC]);
      if (idxC) emit("indexingState", r[idxC]);
      if (robC) emit("robotsTxtState", r[robC]);
      if (gcC) emit("googleCanonical", r[gcC]);
      if (ucC) emit("userCanonical", r[ucC]);
      if (lcC) emit("lastCrawlTime", r[lcC]);
    }
    return { observedAt, snapshotFile: rel(file), observations: obs };
  },
};

/** Cloudflare usage snapshot → site 集約 (worker errors / requests)。per-URL SEO 診断は別 live collector。 */
const CLOUDFLARE = {
  name: "cloudflare",
  staleAfterDays: FRESHNESS_STALE_DEFAULT_DAYS.cloudflare,
  api: "cloudflare.graphql (usage)",
  secretName: "CLOUDFLARE_API_TOKEN",
  liveScript: ".claude/scripts/cloudflare/fetch-usage.mjs",
  normalize(root, now) {
    const dir = path.join(root, ".claude/state/metrics/cloudflare/snapshots");
    const file = newestFile(dir, /^\d{4}-\d{2}-\d{2}\.json$/);
    if (!file) return { observedAt: null };
    const j = JSON.parse(fs.readFileSync(file, "utf8"));
    const observedAt = j.fetched_at ?? (j.date ? j.date + "T00:00:00Z" : fs.statSync(file).mtime.toISOString());
    const freshness = freshnessForSource({ status: "success", observedAt, now, staleAfterDays: this.staleAfterDays });
    const obs = [];
    const emit = (metric, value, limitations = []) => {
      if (value === null || value === undefined) return;
      obs.push(createObservation({
        source: "cloudflare", metric, dimensions: { scope: "site" }, value, observedAt, freshness,
        provenance: { file: rel(file), api: this.api, limitations },
      }));
    };
    emit("workerRequests", numOrNull(j.workers?.totalRequests));
    emit("workerErrors", numOrNull(j.workers?.totalErrors), ["usage 集計。per-URL 5xx SEO 診断は httpRequestsAdaptiveGroups dataset (別 live collector) が必要"]);
    return { observedAt, snapshotFile: rel(file), observations: obs };
  },
};

/** probe する URL を決める: blocker candidate + control。SITE_ORIGIN 付き絶対 URL。 */
function defaultProbeUrls(root, sampleSize) {
  const controls = ["/", "/ranking/taxable-income-per-capita", "/areas/13000", "/blog"];
  let picks = [];
  const candFile = path.join(root, ".claude/state/search-growth/candidates.json");
  if (fs.existsSync(candFile)) {
    try {
      const j = JSON.parse(fs.readFileSync(candFile, "utf8"));
      const blocker = new Set(["server-risk", "soft-404-risk", "indexability-conflict", "crawled-not-indexed"]);
      picks = (j.candidates ?? []).filter((c) => blocker.has(c.type)).slice(0, sampleSize).map((c) => c.url);
    } catch { /* ignore */ }
  }
  const keys = [...new Set([...controls, ...picks])].slice(0, sampleSize + controls.length);
  return keys.map((k) => SITE_ORIGIN + k);
}

/** sitemap.xml の内容 (掲載 URL) を read-only GET (credential 不要)。GSC Sitemaps API メタは別 (要 creds・live 未検証)。 */
const SITEMAP = {
  name: "sitemap", staleAfterDays: FRESHNESS_STALE_DEFAULT_DAYS.sitemap, liveOnly: true, liveNoSecret: true,
  api: "sitemap.xml content fetch (Sitemaps API メタは要 creds・live 未検証)", secretName: "GOOGLE_SERVICE_ACCOUNT_KEY_JSON",
  async liveCollect({ now = new Date().toISOString() } = {}) {
    const { fetchSitemapPathKeys } = await import("./live-sitemap.mjs");
    const r = await fetchSitemapPathKeys({});
    fs.mkdirSync(LIVE_DIR, { recursive: true });
    const file = path.join(LIVE_DIR, "sitemap.json");
    fs.writeFileSync(file, JSON.stringify({ observedAt: now, ok: r.ok, truncated: r.truncated, childCount: r.childCount, count: r.pathKeys.length, pathKeys: r.pathKeys, error: r.error ?? null }, null, 2) + "\n");
    return { source: "sitemap", status: r.ok ? (r.truncated ? "partial" : "success") : "failed", count: r.pathKeys.length, file: rel(file), error: r.error };
  },
  normalize(root, now) {
    const file = path.join(root, ".claude/state/search-growth/live/sitemap.json");
    if (!fs.existsSync(file)) return { observedAt: null };
    const j = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!j.ok) return { observedAt: j.observedAt, observations: [] };
    const observedAt = j.observedAt;
    const freshness = freshnessForSource({ status: j.truncated ? "partial" : "success", observedAt, now, staleAfterDays: this.staleAfterDays });
    const set = new Set(j.pathKeys);
    // inSitemap は probe 済み URL 分だけ emit して肥大を防ぐ (indexability-conflict に必要な範囲)。
    const httpFile = path.join(root, ".claude/state/search-growth/live/http.json");
    let probed = [];
    if (fs.existsSync(httpFile)) {
      try { probed = (JSON.parse(fs.readFileSync(httpFile, "utf8")).probes ?? []).map((p) => toPathKey(p.url)).filter(Boolean); } catch { /* */ }
    }
    const obs = [];
    for (const page of new Set(probed)) {
      obs.push(createObservation({
        source: "static", metric: "inSitemap", dimensions: { page }, value: set.has(page), observedAt, freshness,
        provenance: { file: rel(file), api: this.api, limitations: j.truncated ? ["sitemap 一部のみ取得 (truncated) — inSitemap=false は未確定"] : [] },
      }));
    }
    return { observedAt, snapshotFile: rel(file), observations: obs };
  },
};

const CRUX = { name: "crux", staleAfterDays: FRESHNESS_STALE_DEFAULT_DAYS.crux, api: "chromeuxreport.records.queryRecord", secretName: "CRUX_API_KEY", liveOnly: true, normalize() { return { observedAt: null }; } };

/** production HTTP probe (Googlebot/通常 UA)。credential 不要の read-only GET。 */
const HTTP_LIVE = {
  name: "http", staleAfterDays: FRESHNESS_STALE_DEFAULT_DAYS.http, liveOnly: true, liveNoSecret: true,
  api: "production HTTP probe (Googlebot/normal UA)",
  async liveCollect({ root = PROJECT_ROOT, now = new Date().toISOString(), urls, sampleSize = 20 } = {}) {
    const { probeUrls } = await import("./live-http.mjs");
    const list = urls ?? defaultProbeUrls(root, sampleSize);
    const probes = await probeUrls(list, { concurrency: 4 });
    fs.mkdirSync(LIVE_DIR, { recursive: true });
    const file = path.join(LIVE_DIR, "http.json");
    fs.writeFileSync(file, JSON.stringify({ observedAt: now, probes }, null, 2) + "\n");
    const failed = probes.filter((p) => !p.ok).length;
    return { source: "http", status: failed === probes.length ? "failed" : failed ? "partial" : "success", count: probes.length, file: rel(file) };
  },
  normalize(root, now) {
    const file = path.join(root, ".claude/state/search-growth/live/http.json");
    if (!fs.existsSync(file)) return { observedAt: null };
    const j = JSON.parse(fs.readFileSync(file, "utf8"));
    const observedAt = j.observedAt;
    const freshness = freshnessForSource({ status: "success", observedAt, now, staleAfterDays: this.staleAfterDays });
    const obs = [];
    for (const p of j.probes ?? []) {
      const page = toPathKey(p.url);
      if (!page || !p.ok) continue;
      const prov = { file: rel(file), api: this.api, limitations: ["production 実測 (Googlebot UA)"] };
      if (p.statusGooglebot != null) obs.push(createObservation({ source: "http", metric: "status", dimensions: { page }, value: p.statusGooglebot, observedAt, freshness, provenance: prov }));
      if (p.thinContent != null) obs.push(createObservation({ source: "http", metric: "thinContent", dimensions: { page }, value: !!p.thinContent, observedAt, freshness, provenance: prov }));
      if (p.emptyR2Body != null) obs.push(createObservation({ source: "http", metric: "emptyR2Body", dimensions: { page }, value: !!p.emptyR2Body, observedAt, freshness, provenance: prov }));
      if (p.noindex != null) obs.push(createObservation({ source: "static", metric: "noindex", dimensions: { page }, value: !!p.noindex, observedAt, freshness, provenance: { ...prov, api: "HTML meta robots (live)" } }));
    }
    return { observedAt, snapshotFile: rel(file), observations: obs };
  },
};

const LIGHTHOUSE = { name: "lighthouse", staleAfterDays: FRESHNESS_STALE_DEFAULT_DAYS.lighthouse, api: "local lighthouse", liveOnly: true, normalize() { return { observedAt: null }; } };

/** normalize を持つ (committed snapshot がある) source。 */
export const NORMALIZE_SOURCES = [GSC, GA4, PSI, COVERAGE, INSPECTION, CLOUDFLARE];
/** live のみ (新規 collector・committed snapshot 無し)。 */
export const LIVE_ONLY_SOURCES = [SITEMAP, CRUX, HTTP_LIVE, LIGHTHOUSE];
export const ALL_SOURCES = [...NORMALIZE_SOURCES, ...LIVE_ONLY_SOURCES];

/** GSC UI export の category を candidate engine 語彙にマップする。 */
export function mapCoverageCategory(gscCategory) {
  const c = String(gscCategory);
  if (/soft/i.test(c) || /ソフト/.test(c)) return "soft-404"; // GSC 日本語カテゴリ "ソフト404"
  if (/crawled/i.test(c) || /クロール済/.test(c)) return "crawled-not-indexed";
  if (/discovered/i.test(c) || /検出/.test(c)) return "discovered-not-indexed";
  if (/5xx|server|サーバー/i.test(c)) return "server-error-5xx";
  if (/404|not.?found|見つか/i.test(c)) return "not-found-404";
  return c;
}

/** 既存 remediation の作業中・解決済み・非対象 URL を新規候補へ重複登録しない。 */
export function shouldEmitCoverageCategory(entry) {
  const status = entry?.status ?? "pending";
  const action = entry?.action;
  return status === "pending" && action !== "none";
}

function weekStart(endIso) {
  const d = new Date(endIso);
  d.setUTCDate(d.getUTCDate() - 27); // GSC/GA4 は last 28d
  return d.toISOString().slice(0, 10);
}

/** live fetch 用: 既存 fetcher を subprocess で呼ぶコマンドを組み立てる (実行は collect.mjs)。 */
export function liveCommandFor(def, week) {
  if (!def.liveScript) return null;
  const args = [def.liveScript];
  if (week && (def.name === "gsc" || def.name === "ga4")) args.push("--week", week);
  return { cmd: "node", args, note: redactString(`node ${args.join(" ")}`) };
}

export { isoWeekEndDate, latestWeekDir, parseCsv, newestFile };
