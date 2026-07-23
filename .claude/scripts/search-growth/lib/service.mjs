/**
 * service — CLI と MCP が共有する read-only pure service。
 *
 * 正典: docs/02_実装計画/39 §6.1 (CLI を正典実装とし MCP は同じ service を呼ぶ薄い adapter)。
 * すべて derived state (latest.json / candidates.json / health.json) の read のみ。
 * network も mutation もしない。output は small (limit/cursor)。secret を返さない。
 */
import { PATHS, readJson } from "./state.mjs";
import { redactObject } from "./redaction.mjs";
import { isAllowedUrl, toPathKey } from "./join-url.mjs";
import { ALL_SOURCES } from "./sources.mjs";

const MAX_LIMIT = 200; // oversized result を拒否する上限

function clampLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return 20;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

/** cursor (offset) 付き page 化。 */
function paginate(items, { limit, cursor } = {}) {
  const lim = clampLimit(limit);
  const start = Math.max(0, Number(cursor) || 0);
  const page = items.slice(start, start + lim);
  const nextCursor = start + lim < items.length ? start + lim : null;
  return { items: page, total: items.length, cursor: start, nextCursor, limit: lim };
}

function loadLatest() {
  return readJson(PATHS.latest) ?? { observations: [], sources: {}, generatedAt: null };
}
function loadCandidates() {
  return readJson(PATHS.candidates) ?? { candidates: [], byType: {}, count: 0, generatedAt: null, sourceHealth: {} };
}
function loadHealth() {
  return readJson(PATHS.health) ?? { sources: {}, totalObservations: 0, generatedAt: null };
}

function obsByPage(observations, source, metricSet) {
  return observations
    .filter((o) => o.source === source && (!metricSet || metricSet.has(o.metric)))
    .map((o) => ({ page: o.dimensions?.page ?? o.dimensions?.scope ?? null, device: o.dimensions?.device, metric: o.metric, value: o.value, freshness: o.freshness, observedAt: o.observedAt }));
}

// ── read-only tools (§6.2) ────────────────────────────────────────────

export function status() {
  const health = loadHealth();
  const cand = loadCandidates();
  return {
    generatedAt: health.generatedAt,
    totalObservations: health.totalObservations,
    sources: health.sources,
    candidateCount: cand.count,
    candidatesByType: cand.byType,
    stale: Object.entries(health.sources ?? {}).filter(([, v]) => v.freshness === "stale" || v.freshness === "missing").map(([k]) => k),
  };
}

export function candidates({ type, url, minScore, limit, cursor } = {}) {
  const { candidates: list } = loadCandidates();
  let filtered = list;
  if (type) filtered = filtered.filter((c) => c.type === type);
  if (url) {
    const key = toPathKey(url);
    filtered = filtered.filter((c) => c.url === key);
  }
  if (minScore != null) filtered = filtered.filter((c) => c.score >= Number(minScore));
  return paginate(filtered, { limit, cursor });
}

export function next({ limit } = {}) {
  const { candidates: list } = loadCandidates();
  const pending = list.filter((c) => c.status === "pending");
  return paginate(pending, { limit: limit ?? 20, cursor: 0 });
}

export function gscPerformance({ limit, cursor, page } = {}) {
  const { observations } = loadLatest();
  let rows = obsByPage(observations, "gsc", new Set(["clicks", "impressions", "ctr", "position"]));
  if (page) {
    const key = toPathKey(page);
    rows = rows.filter((r) => r.page === key);
  }
  return paginate(rows, { limit, cursor });
}

export function inspectUrls({ limit, cursor } = {}) {
  const { observations } = loadLatest();
  const rows = obsByPage(observations, "inspection");
  return paginate(rows, { limit, cursor });
}

export function sitemaps() {
  const health = loadHealth();
  return { source: "sitemap", ...(health.sources?.sitemap ?? { status: "missing", note: "GSC Sitemaps API (read-only) collector 未実行 — creds が要る" }) };
}

export function ga4OrganicQuality({ limit, cursor, page } = {}) {
  const { observations } = loadLatest();
  let rows = obsByPage(observations, "ga4");
  if (page) {
    const key = toPathKey(page);
    rows = rows.filter((r) => r.page === key);
  }
  return paginate(rows, { limit, cursor });
}

export function cruxWebVitals({ limit, cursor } = {}) {
  const { observations } = loadLatest();
  const rows = obsByPage(observations, "crux");
  const health = loadHealth();
  return { ...paginate(rows, { limit, cursor }), sourceStatus: health.sources?.crux ?? { status: "missing", note: "CrUX API collector 未実行 — CRUX_API_KEY が要る。PSI 埋込 field を長期 SSOT にしない" } };
}

export function psiDiagnostics({ limit, cursor } = {}) {
  const { observations } = loadLatest();
  const rows = obsByPage(observations, "psi");
  return paginate(rows, { limit, cursor });
}

export function cloudflareSearchHealth() {
  const { observations } = loadLatest();
  const rows = obsByPage(observations, "cloudflare");
  return { items: rows, note: "usage 集計。per-URL 5xx/status SEO 診断は httpRequestsAdaptiveGroups dataset (別 live collector) が要る" };
}

export function seoRouteContract() {
  const { observations } = loadLatest();
  const statuses = observations.filter((o) => o.source === "http" && o.metric === "status");
  const byStatus = {};
  for (const o of statuses) {
    const bucket = o.value >= 500 ? "5xx" : o.value >= 400 ? "4xx" : o.value >= 300 ? "3xx" : "2xx";
    byStatus[bucket] = (byStatus[bucket] ?? 0) + 1;
  }
  const conflicts = candidates({ type: "indexability-conflict", limit: 50 });
  return { httpStatusBuckets: byStatus, indexabilityConflicts: conflicts.items.length, sampleConflicts: conflicts.items.slice(0, 10) };
}

export function measure({ candidateId, now = new Date().toISOString() } = {}) {
  if (!candidateId) return { error: "candidateId required" };
  const { candidates: list } = loadCandidates();
  const c = list.find((x) => x.id === candidateId);
  if (!c) return { error: `candidate not found: ${candidateId}` };
  const base = c.baselinePeriod?.end ?? now.slice(0, 10);
  const plus = (days) => {
    const d = new Date(base + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  return {
    id: c.id, type: c.type, url: c.url, status: c.status, score: c.score,
    scoreBreakdown: c.scoreBreakdown, evidence: c.evidence, baselinePeriod: c.baselinePeriod,
    expectedMetric: c.expectedMetric, suggestedVerification: c.suggestedVerification,
    limitations: c.limitations, externalActionFlag: c.externalActionFlag,
    judgmentSchedule: { day14: plus(14), day28: plus(28), day56: plus(56) },
  };
}

/** MCP tool 定義 (read-only)。CLI と同じ service を呼ぶ。 */
export const TOOLS = {
  search_growth_status: { fn: () => status(), input: {}, desc: "source freshness + candidate 件数サマリ (read-only)" },
  search_growth_candidates: { fn: (a) => candidates(a), input: { type: "string?", url: "string?", minScore: "number?", limit: "number?", cursor: "number?" }, desc: "決定的 candidate を filter/limit/cursor 付きで返す (read-only)" },
  search_growth_measure: { fn: (a) => measure(a), input: { candidateId: "string" }, desc: "candidate の evidence + 14/28/56 日判定スケジュール (read-only)" },
  gsc_performance: { fn: (a) => gscPerformance(a), input: { page: "string?", limit: "number?", cursor: "number?" }, desc: "GSC page 別 clicks/impressions/ctr/position (read-only)" },
  gsc_inspect_urls: { fn: (a) => inspectUrls(a), input: { limit: "number?", cursor: "number?" }, desc: "URL Inspection coverageState/canonical (read-only)" },
  gsc_sitemaps: { fn: () => sitemaps(), input: {}, desc: "Sitemaps API summary (read-only・submit/delete は非公開)" },
  ga4_organic_quality: { fn: (a) => ga4OrganicQuality(a), input: { page: "string?", limit: "number?", cursor: "number?" }, desc: "GA4 landing 後の engagement (read-only)" },
  crux_web_vitals: { fn: (a) => cruxWebVitals(a), input: { limit: "number?", cursor: "number?" }, desc: "CrUX field CWV (read-only・origin fallback は明示)" },
  psi_diagnostics: { fn: (a) => psiDiagnostics(a), input: { limit: "number?", cursor: "number?" }, desc: "PSI lab diagnostics mobile/desktop (read-only)" },
  cloudflare_search_health: { fn: () => cloudflareSearchHealth(), input: {}, desc: "Cloudflare worker errors/requests (read-only)" },
  seo_route_contract: { fn: () => seoRouteContract(), input: {}, desc: "HTTP status 分布 + indexability conflict (read-only)" },
};

/** MCP callTool: allowlist で url を検証し、結果を redact して返す。 */
export function callTool(name, args = {}) {
  const tool = TOOLS[name];
  if (!tool) return { error: `unknown tool: ${name}` };
  if (args.url && !isAllowedUrl(args.url)) return { error: "url not allowed (stats47.jp のみ)" };
  if (args.page && !isAllowedUrl(args.page)) return { error: "page not allowed (stats47.jp のみ)" };
  const result = tool.fn(args);
  return redactObject(result);
}

export { ALL_SOURCES, MAX_LIMIT };
