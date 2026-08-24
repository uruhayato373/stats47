/**
 * scoring — 決定的 candidate engine (LLM を使わない)。
 *
 * 正典: .claude/skills/analytics/search-growth/reference/platform-contract.md。
 * - opportunityScore = impact × confidence × actionability × freshness × evidenceCoverage ÷ effort
 * - impressions が最低標本未満なら CTR 判定をしない
 * - missing を 0 に変換しない / 単一 API だけで高 confidence にしない
 * - 同一 URL・原因を dedupe / past effect none・adverse で confidence 抑制 / 決定的順序
 */
import { CANDIDATE_TYPES } from "./contracts.mjs";
import { toPathKey } from "./join-url.mjs";

/** 型付き閾値 (config)。数値は全てここに集約する。 */
export const DEFAULT_CONFIG = Object.freeze({
  minImpressionsForCtr: 100, // これ未満は CTR candidate を出さない (sample-size gate)
  strikingDistance: { minPos: 5, maxPos: 15, minImpressions: 30 },
  ctrOpportunity: { maxRatioOfExpected: 0.6 }, // 期待 CTR の 60% 未満で機会
  mobileGap: { minImpressions: 50, ctrGapRatio: 0.7, posGap: 2 },
  cwv: { poorOnly: false }, // needs-improvement も対象にするか
  labRegression: { minDropPct: 10 }, // performance score が 10pt 以上悪化
  effort: { low: 1, medium: 2, high: 3 },
  // past effect suppression: title 変更由来の effect/none・adverse を踏まえ CTR rewrite の confidence を抑える
  ctrRewriteConfidencePenalty: 0.7,
});

/** SERP 平均 CTR 曲線 (position → 期待 CTR)。決定的テーブル。 */
const CTR_CURVE = [
  [1, 0.28], [2, 0.15], [3, 0.1], [4, 0.07], [5, 0.05],
  [6, 0.04], [7, 0.032], [8, 0.026], [9, 0.022], [10, 0.019],
  [15, 0.011], [20, 0.007], [30, 0.004], [100, 0.002],
];

/** position の期待 CTR を返す (線形補間なしの階段近似・決定的)。 */
export function expectedCtrForPosition(pos) {
  if (pos == null || !Number.isFinite(pos)) return null;
  for (const [p, ctr] of CTR_CURVE) {
    if (pos <= p) return ctr;
  }
  return CTR_CURVE[CTR_CURVE.length - 1][1];
}

/** freshness → スコア係数 (missing/stale を割り引く)。 */
const FRESHNESS_FACTOR = { fresh: 1, partial: 0.7, stale: 0.5, missing: 0.2 };

/** opportunityScore を計算する。全係数 0..1 (impact は正規化済) / effort ≥ 1。 */
export function scoreCandidate({ impact, confidence, actionability, freshness, evidenceCoverage, effort }) {
  const f = FRESHNESS_FACTOR[freshness] ?? 0.5;
  const e = Math.max(1, effort ?? 1);
  const raw = (impact ?? 0) * (confidence ?? 0) * (actionability ?? 0) * f * (evidenceCoverage ?? 0);
  return round(raw / e, 4);
}

// ── grouping ──────────────────────────────────────────────────────────

/**
 * Observation 群を URL (pathKey) 単位に束ねる。
 * @param {import("./contracts.mjs").Observation[]} observations
 * @returns {Map<string, {url:string, observations:object[]}>}
 */
export function groupByUrl(observations) {
  const map = new Map();
  for (const o of observations) {
    const raw = o.dimensions?.page ?? o.dimensions?.url ?? null;
    const key = raw ? toPathKey(raw) : null;
    if (!key) continue;
    if (!map.has(key)) map.set(key, { url: key, observations: [] });
    map.get(key).observations.push(o);
  }
  return map;
}

/** bucket から (source, metric[, device]) に一致する最も新鮮な Observation を返す。
 *  同一 metric が複数 source 経由で入る場合 (例 http:status を live probe と coverage の両方が出す)、
 *  fresh を stale より優先する (live 実測が committed の古い値を上書き)。 */
function find(bucket, source, metric, device) {
  const rank = { fresh: 0, partial: 1, stale: 2, missing: 3 };
  let best;
  for (const o of bucket.observations) {
    if (o.source !== source || o.metric !== metric) continue;
    if (device != null && o.dimensions?.device !== device) continue;
    if (!best || (rank[o.freshness] ?? 3) < (rank[best.freshness] ?? 3)) best = o;
  }
  return best;
}
function val(bucket, source, metric, device) {
  const o = find(bucket, source, metric, device);
  return o ? o.value : undefined;
}

// ── detectors ─────────────────────────────────────────────────────────
// 各 detector は (bucket, config) → candidate[] (通常 0..1)。データ不足なら空を返す
// (missing を 0 と誤解しない)。証拠は evidence[] に必ず添える。

function ctrOpportunity(bucket, cfg) {
  const imp = num(val(bucket, "gsc", "impressions"));
  const ctr = num(val(bucket, "gsc", "ctr"));
  const pos = num(val(bucket, "gsc", "position"));
  if (imp == null || ctr == null || pos == null) return [];
  if (imp < cfg.minImpressionsForCtr) return []; // sample-size gate
  const expected = expectedCtrForPosition(pos);
  if (expected == null || ctr >= expected * cfg.ctrOpportunity.maxRatioOfExpected) return [];
  const gap = expected - ctr;
  const impact = clamp01(Math.log10(imp) / 5) * clamp01(gap / expected);
  return [
    mk(bucket, "ctr-opportunity", {
      impact,
      confidence: 0.6 * cfg.ctrRewriteConfidencePenalty, // 単一 source (GSC) + 過去 title rewrite の effect/none を踏まえ抑制
      actionability: 0.8, // seoTitle/description 改修で対応可
      effort: cfg.effort.low,
      evidence: evi(bucket, [["gsc", "impressions"], ["gsc", "ctr"], ["gsc", "position"]]),
      expectedMetric: `CTR ${(ctr * 100).toFixed(2)}% → 期待 ${(expected * 100).toFixed(1)}% 帯`,
      suggestedVerification: "seoTitle/description の curiosity gap 改修後、4/8 週で GSC CTR を再計測 (1 件ずつ query 確認・一括 rewrite 禁止)",
      limitations: ["単一 source (GSC) のみ", "過去 title rewrite に effect/none 実績あり — CTR のみを根拠に大量 rewrite しない"],
    }),
  ];
}

function strikingDistance(bucket, cfg) {
  const imp = num(val(bucket, "gsc", "impressions"));
  const pos = num(val(bucket, "gsc", "position"));
  if (imp == null || pos == null) return [];
  const { minPos, maxPos, minImpressions } = cfg.strikingDistance;
  if (pos < minPos || pos > maxPos || imp < minImpressions) return [];
  const impact = clamp01(Math.log10(imp) / 5) * clamp01((maxPos - pos) / (maxPos - minPos) + 0.2);
  return [
    mk(bucket, "striking-distance", {
      impact,
      confidence: 0.6,
      actionability: 0.6, // content 補強 / 内部リンク
      effort: cfg.effort.medium,
      evidence: evi(bucket, [["gsc", "impressions"], ["gsc", "position"]]),
      expectedMetric: `position ${pos.toFixed(1)} → Top10 圏へ`,
      suggestedVerification: "content 補強 + 内部リンク後、4 週で position を GSC 再計測",
      limitations: ["需要はあるが順位改善は content 質に依存"],
    }),
  ];
}

function mobileGap(bucket, cfg) {
  const impM = num(val(bucket, "gsc", "impressions", "mobile"));
  const ctrM = num(val(bucket, "gsc", "ctr", "mobile"));
  const ctrD = num(val(bucket, "gsc", "ctr", "desktop"));
  const posM = num(val(bucket, "gsc", "position", "mobile"));
  const posD = num(val(bucket, "gsc", "position", "desktop"));
  if (impM == null || impM < cfg.mobileGap.minImpressions) return [];
  const ctrWorse = ctrM != null && ctrD != null && ctrD > 0 && ctrM < ctrD * cfg.mobileGap.ctrGapRatio;
  const posWorse = posM != null && posD != null && posM - posD >= cfg.mobileGap.posGap;
  // PSI mobile CWV も参照 (あれば根拠を強める)
  const lcpM = num(val(bucket, "psi", "lcp_ms", "mobile"));
  if (!ctrWorse && !posWorse) return [];
  return [
    mk(bucket, "mobile-gap", {
      impact: clamp01(Math.log10(impM) / 5) * 0.8,
      confidence: ctrWorse && posWorse ? 0.7 : 0.5,
      actionability: 0.6,
      effort: cfg.effort.medium,
      evidence: evi(bucket, [["gsc", "ctr", "mobile"], ["gsc", "ctr", "desktop"], ["gsc", "position", "mobile"]]).concat(
        lcpM != null ? evi(bucket, [["psi", "lcp_ms", "mobile"]]) : []
      ),
      expectedMetric: "mobile の CTR/position を desktop 水準へ",
      suggestedVerification: "mobile レイアウト / CWV (LCP) を確認し改善後 device 別 GSC を再計測",
      limitations: lcpM == null ? ["PSI mobile CWV 未取得 — device 差の原因は未特定"] : [],
    }),
  ];
}

function indexabilityConflict(bucket, cfg) {
  const cov = val(bucket, "inspection", "coverageState");
  const robots = val(bucket, "inspection", "robotsTxtState");
  const inSitemap = val(bucket, "static", "inSitemap");
  const noindex = val(bucket, "static", "noindex");
  const status = num(val(bucket, "http", "status"));
  const conflicts = [];
  if (inSitemap === true && noindex === true) conflicts.push("sitemap 掲載かつ noindex");
  if (inSitemap === true && status != null && status >= 400) conflicts.push(`sitemap 掲載だが HTTP ${status}`);
  if (robots === "DISALLOWED" && inSitemap === true) conflicts.push("sitemap 掲載だが robots で DISALLOWED");
  if (conflicts.length === 0) return [];
  return [
    mk(bucket, "indexability-conflict", {
      impact: 0.6,
      confidence: 0.8, // 技術的矛盾は明確
      actionability: 0.9,
      effort: cfg.effort.low,
      evidence: evi(bucket, [["static", "inSitemap"], ["static", "noindex"], ["http", "status"], ["inspection", "coverageState"]]),
      expectedMetric: "sitemap / noindex / status / canonical の矛盾解消",
      suggestedVerification: "矛盾を解消し URL Inspection で coverageState を観測 (observe-after-fix)",
      limitations: cov == null ? ["URL Inspection 未取得 — Google 側認識は未確認"] : [],
    }),
  ];
}

function crawledNotIndexed(bucket, cfg) {
  const cov = str(val(bucket, "inspection", "coverageState"));
  const status = num(val(bucket, "http", "status"));
  const category = str(val(bucket, "static", "coverageCategory"));
  // URL Inspection が取れている場合は、古い GSC UI export 由来の category より優先する。
  // 「登録済み」と「crawled-not-indexed」が同居した誤候補を手作業で消し続けないため。
  const isCni = cov
    ? /crawled.*not indexed|クロール済/i.test(cov)
    : category === "crawled-not-indexed";
  if (!isCni) return [];
  if (status != null && status !== 200) return []; // 生存 URL のみ (死んでいれば別 candidate)
  return [
    mk(bucket, "crawled-not-indexed", {
      impact: 0.5,
      confidence: cov ? 0.7 : 0.5,
      actionability: 0.6,
      effort: cfg.effort.medium,
      evidence: evi(bucket, [["inspection", "coverageState"], ["http", "status"], ["static", "coverageCategory"]]),
      expectedMetric: "crawled-not-indexed → indexed",
      suggestedVerification: "content 補強 + 内部リンク + sitemap 整合 → URL Inspection 観測 (Indexing API 送信はしない)",
      limitations: ["Google の未登録判断。content 質・重複を疑う"],
    }),
  ];
}

function soft404Risk(bucket, cfg) {
  const status = num(val(bucket, "http", "status"));
  const category = str(val(bucket, "static", "coverageCategory"));
  const thin = val(bucket, "http", "thinContent");
  const isSoft = category === "soft-404" || thin === true;
  if (!isSoft) return [];
  if (status != null && status !== 200) return [];
  return [
    mk(bucket, "soft-404-risk", {
      impact: 0.5,
      confidence: thin === true ? 0.7 : 0.5,
      actionability: 0.7,
      effort: cfg.effort.medium,
      evidence: evi(bucket, [["http", "status"], ["http", "thinContent"], ["static", "coverageCategory"]]),
      expectedMetric: "thin 200 → 実データ補強 or noindex/410",
      suggestedVerification: "R2 観測値の年数・データ点数を確認し補強 or noindex 判定",
      limitations: ["薄さ判定は content 実測が必要 (要 gsc-analyst 判断)"],
    }),
  ];
}

function canonicalDrift(bucket, cfg) {
  const user = str(val(bucket, "inspection", "userCanonical"));
  const google = str(val(bucket, "inspection", "googleCanonical"));
  if (!user || !google) return [];
  if (toPathKey(user) === toPathKey(google)) return [];
  return [
    mk(bucket, "canonical-drift", {
      impact: 0.55,
      confidence: 0.8,
      actionability: 0.8,
      effort: cfg.effort.medium,
      evidence: evi(bucket, [["inspection", "userCanonical"], ["inspection", "googleCanonical"]]),
      expectedMetric: "user canonical と Google canonical の一致",
      suggestedVerification: "canonical/内部リンク/重複 content を是正 → URL Inspection 再観測",
      limitations: [],
    }),
  ];
}

function cwvOpportunity(bucket, cfg) {
  // field data (CrUX) 優先。無ければ PSI field を caveat 付きで参照 (長期 SSOT にはしない)。
  const cruxLcp = str(val(bucket, "crux", "lcp_p75_category"));
  const psiLcp = str(val(bucket, "psi", "lcp_field_category"));
  const cat = cruxLcp ?? psiLcp;
  if (!cat) return [];
  const poor = /poor/i.test(cat);
  const ni = /needs.?improvement/i.test(cat);
  if (!poor && !(ni && !cfg.cwv.poorOnly)) return [];
  const fromPsiOnly = cruxLcp == null && psiLcp != null;
  return [
    mk(bucket, "cwv-opportunity", {
      impact: poor ? 0.6 : 0.4,
      confidence: cruxLcp != null ? 0.7 : 0.5,
      actionability: 0.5,
      effort: cfg.effort.high,
      evidence: evi(bucket, cruxLcp != null ? [["crux", "lcp_p75_category"]] : [["psi", "lcp_field_category"]]),
      expectedMetric: `LCP field ${cat} → good`,
      suggestedVerification: "CrUX History で 28 日 rolling を確認しつつ CWV 改善",
      limitations: fromPsiOnly
        ? ["CrUX 未取得 — PSI 埋込 field を暫定使用 (field data の長期 SSOT にしない)"]
        : [],
    }),
  ];
}

function labRegression(bucket, cfg) {
  const cur = num(val(bucket, "psi", "performance_score"));
  const base = num(val(bucket, "psi", "performance_score_baseline"));
  if (cur == null || base == null) return [];
  const drop = base - cur;
  if (drop < cfg.labRegression.minDropPct) return [];
  return [
    mk(bucket, "lab-regression", {
      impact: clamp01(drop / 50),
      confidence: 0.6,
      actionability: 0.6,
      effort: cfg.effort.medium,
      evidence: evi(bucket, [["psi", "performance_score"], ["psi", "performance_score_baseline"]]),
      expectedMetric: `PSI perf ${cur} → baseline ${base} 回復`,
      suggestedVerification: "local Lighthouse で PR 前後を比較 (PSI と環境差を limitations に記録)",
      limitations: ["PSI lab は変動あり — local Lighthouse で再現性確認"],
    }),
  ];
}

function serverRisk(bucket, cfg) {
  const status = num(val(bucket, "http", "status"));
  const cf5xx = num(val(bucket, "cloudflare", "status5xxCount"));
  const workerErr = num(val(bucket, "cloudflare", "workerErrors"));
  const emptyR2 = val(bucket, "http", "emptyR2Body");
  const risks = [];
  if (status != null && status >= 500) risks.push(`HTTP ${status}`);
  if (cf5xx != null && cf5xx > 0) risks.push(`Cloudflare 5xx ${cf5xx}`);
  if (workerErr != null && workerErr > 0) risks.push(`Worker exception ${workerErr}`);
  if (emptyR2 === true) risks.push("R2 snapshot 欠損による empty 200");
  if (risks.length === 0) return [];
  return [
    mk(bucket, "server-risk", {
      impact: 0.8,
      confidence: 0.8,
      actionability: 0.9,
      effort: cfg.effort.medium,
      evidence: evi(bucket, [["http", "status"], ["cloudflare", "status5xxCount"], ["cloudflare", "workerErrors"], ["http", "emptyR2Body"]]),
      expectedMetric: "5xx / empty 200 の解消",
      suggestedVerification: "本番 HTTP を Googlebot UA で再実測 + Cloudflare GraphQL で 5xx 推移確認",
      limitations: [],
    }),
  ];
}

function queryGap(bucket, cfg) {
  // page × query slice がある場合のみ: 高需要 query が汎用 page にしか着地していない
  const imp = num(val(bucket, "gsc", "query_impressions"));
  const hasDedicated = val(bucket, "static", "hasDedicatedLanding");
  if (imp == null || imp < cfg.minImpressionsForCtr) return [];
  if (hasDedicated !== false) return [];
  return [
    mk(bucket, "query-gap", {
      impact: clamp01(Math.log10(imp) / 5),
      confidence: 0.5,
      actionability: 0.5,
      effort: cfg.effort.high,
      evidence: evi(bucket, [["gsc", "query_impressions"], ["static", "hasDedicatedLanding"]]),
      expectedMetric: "専用 landing 新設で query 需要を捕捉",
      suggestedVerification: "query 需要と競合を確認し landing を新設 (人間承認)",
      limitations: ["query×page slice が必要 — 需要の恒常性を要確認"],
    }),
  ];
}

function intentMismatch(bucket, cfg) {
  const mismatch = val(bucket, "static", "intentMismatch");
  if (mismatch !== true) return []; // 明示シグナルがある時のみ (content 解析必須)
  return [
    mk(bucket, "intent-mismatch", {
      impact: 0.4,
      confidence: 0.4,
      actionability: 0.5,
      effort: cfg.effort.medium,
      evidence: evi(bucket, [["static", "intentMismatch"]]),
      expectedMetric: "query 群と title/content の整合",
      suggestedVerification: "上位 query と title/H1 を突合し整合 (人間判断)",
      limitations: ["content 解析が必要 — 自動判定は暫定"],
    }),
  ];
}

/** 需要はあるが必要データ (source or custom dimension) が欠けている URL を measurement-gap として明示。 */
function measurementGap(bucket, cfg) {
  const imp = num(val(bucket, "gsc", "impressions"));
  if (imp == null || imp < cfg.minImpressionsForCtr) return [];
  const missing = [];
  if (val(bucket, "ga4", "sessions") === undefined) missing.push("ga4:sessions");
  if (val(bucket, "psi", "lcp_ms", "mobile") === undefined) missing.push("psi:lcp_ms(mobile)");
  if (val(bucket, "crux", "lcp_p75_category") === undefined) missing.push("crux:lcp_p75");
  if (missing.length === 0) return [];
  return [
    mk(bucket, "measurement-gap", {
      impact: 0.3,
      confidence: 0.9, // 「データが無い」ことは確実
      actionability: 0.4,
      effort: cfg.effort.low,
      evidence: evi(bucket, [["gsc", "impressions"]]),
      expectedMetric: `不足データ: ${missing.join(", ")}`,
      suggestedVerification: "該当 collector を live 実行 or GA4 custom dimension を登録して再取得",
      limitations: ["missing を 0 と扱わない — 判定前にデータ取得が必要"],
    }),
  ];
}

const DETECTORS = [
  ctrOpportunity, strikingDistance, queryGap, intentMismatch, mobileGap,
  indexabilityConflict, crawledNotIndexed, soft404Risk, canonicalDrift,
  cwvOpportunity, labRegression, serverRisk, measurementGap,
];

/**
 * Observation 群から candidate を生成する (決定的)。
 * @param {object[]} observations
 * @param {{config?:object, pastEffects?:Record<string,"none"|"adverse">, now?:string}} [opts]
 * @returns {object[]} score 降順 → id 昇順の安定ソート
 */
export function buildCandidates(observations, opts = {}) {
  const cfg = opts.config ?? DEFAULT_CONFIG;
  const pastEffects = opts.pastEffects ?? {};
  const byUrl = groupByUrl(observations);
  const out = [];
  const seen = new Set(); // dedupe: type + url
  for (const bucket of byUrl.values()) {
    for (const detect of DETECTORS) {
      for (const cand of detect(bucket, cfg)) {
        const dedupeKey = `${cand.type}::${cand.url}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        // past effect none/adverse → confidence 抑制 (再発防止)
        const past = pastEffects[cand.url] ?? pastEffects[`${cand.type}::${cand.url}`];
        if (past === "none") cand.scoreBreakdown.confidence *= 0.6;
        if (past === "adverse") cand.scoreBreakdown.confidence *= 0.3;
        if (past) cand.limitations.push(`過去施策 effect/${past} — confidence を抑制`);
        cand.score = scoreCandidate(cand.scoreBreakdown);
        out.push(cand);
      }
    }
  }
  // 決定的順序: score 降順 → id 昇順
  out.sort((a, b) => (b.score - a.score) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return out;
}

// ── helpers ───────────────────────────────────────────────────────────

/** candidate object をevidence contractに従って組み立てる。 */
function mk(bucket, type, p) {
  const freshness = evidenceFreshness(p.evidence);
  const evidenceCoverage = clamp01(distinctSources(p.evidence) / 3); // 3 source で満点
  const observedAt = latestObservedAt(bucket.observations);
  const period = baselinePeriod(p.evidence);
  return {
    id: `${type}::${bucket.url}`,
    url: bucket.url,
    type,
    status: "pending",
    score: 0, // buildCandidates で確定
    scoreBreakdown: {
      impact: round(p.impact, 4),
      confidence: round(p.confidence, 4),
      actionability: round(p.actionability, 4),
      freshness,
      evidenceCoverage: round(evidenceCoverage, 4),
      effort: p.effort,
    },
    evidence: p.evidence,
    baselinePeriod: period,
    observedAt,
    freshness,
    limitations: p.limitations ?? [],
    expectedMetric: p.expectedMetric ?? null,
    suggestedVerification: p.suggestedVerification ?? null,
    externalActionFlag: false, // read-only 提案。deploy/送信は人間承認
  };
}

/** evidence 参照 [[source,metric,device?],...] を bucket から解決する。 */
function evi(bucket, refs) {
  const out = [];
  for (const [source, metric, device] of refs) {
    const o = find(bucket, source, metric, device);
    if (!o) continue;
    out.push({
      source,
      metric: device ? `${metric}[${device}]` : metric,
      value: o.value,
      freshness: o.freshness,
      periodEnd: o.periodEnd ?? null,
    });
  }
  return out;
}

function evidenceFreshness(evidence) {
  if (!evidence.length) return "missing";
  const rank = { fresh: 0, partial: 1, stale: 2, missing: 3 };
  let worst = "fresh";
  for (const e of evidence) if ((rank[e.freshness] ?? 3) > (rank[worst] ?? 0)) worst = e.freshness;
  return worst;
}
function distinctSources(evidence) {
  return new Set(evidence.map((e) => e.source)).size;
}
function latestObservedAt(observations) {
  let latest = null;
  for (const o of observations) {
    if (!latest || (o.observedAt && o.observedAt > latest)) latest = o.observedAt;
  }
  return latest ?? new Date().toISOString();
}
function baselinePeriod(evidence) {
  const ends = evidence.map((e) => e.periodEnd).filter(Boolean).sort();
  if (!ends.length) return null;
  return { start: ends[0], end: ends[ends.length - 1] };
}

function num(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
function str(v) {
  return v === undefined || v === null ? null : String(v);
}
function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}
function round(x, d) {
  const m = 10 ** d;
  return Math.round((x + Number.EPSILON) * m) / m;
}

export { CANDIDATE_TYPES };
