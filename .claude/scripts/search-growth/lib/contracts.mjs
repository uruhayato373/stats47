/**
 * search-growth — normalized Observation contract (SSOT for the data shape).
 *
 * 正典: docs/02_実装計画/39_検索成長統合MCP・API基盤実装仕様.md §4.2 / §5.
 *
 * すべての collector が raw snapshot を **正規化 Observation** に変換して積む。
 * normalized state は derived で再生成可能 (raw snapshot は既存配置を尊重する)。
 *
 * このファイルは純粋 (Node built-ins のみ・外部依存ゼロ)。CLI と MCP の両方から使う。
 */

/** Observation の source 種別 (§4.2)。 */
export const OBSERVATION_SOURCES = Object.freeze([
  "gsc", // Search Analytics
  "inspection", // URL Inspection API
  "sitemap", // Sitemaps API
  "ga4", // GA4 Data API
  "crux", // CrUX / CrUX History
  "psi", // PageSpeed Insights (public lab)
  "lighthouse", // local Lighthouse (controlled lab)
  "cloudflare", // Cloudflare GraphQL analytics
  "http", // production HTTP probe
  "static", // repository static audit (sitemap/canonical/robots/route)
]);

/**
 * freshness の意味 (§3 / §5.2)。
 * - fresh:   期待鮮度内に取得できた実データ
 * - stale:   取得はできたが古い (閾値超過 or 過去 snapshot へ fallback)
 * - partial: 一部のみ取得 (pagination 打ち切り / dimension 非対応 / origin fallback など)
 * - missing: 取得できなかった (API error / no rows / credential 無し)。**0 と混同しない**
 */
export const FRESHNESS = Object.freeze(["fresh", "stale", "partial", "missing"]);

/** candidate type (§5.1)。決定的ルールで付与する。 */
export const CANDIDATE_TYPES = Object.freeze([
  "ctr-opportunity",
  "striking-distance",
  "query-gap",
  "intent-mismatch",
  "mobile-gap",
  "indexability-conflict",
  "crawled-not-indexed",
  "soft-404-risk",
  "canonical-drift",
  "cwv-opportunity",
  "lab-regression",
  "server-risk",
  "measurement-gap",
]);

/** candidate lifecycle status (§5.2)。 */
export const CANDIDATE_STATUSES = Object.freeze([
  "pending",
  "approved",
  "in-progress",
  "measured",
  "dismissed",
]);

/**
 * @typedef {Object} ObservationProvenance
 * @property {string} [file]        raw snapshot への参照 (相対パス)
 * @property {string} [api]         呼んだ API 名
 * @property {string} [queryHash]   検索 query の非可逆ハッシュ (生 query を保存しない)
 * @property {string[]} limitations 制約・注意 (timezone/attribution/origin-fallback など)
 */

/**
 * @typedef {Object} Observation
 * @property {typeof OBSERVATION_SOURCES[number]} source
 * @property {string} metric                     例 "clicks" / "coverageState" / "lcp_p75"
 * @property {Record<string,string>} dimensions  例 { page, device, query, area }
 * @property {number|string|boolean|null} value  null は「観測できたが値なし」ではなく未取得は freshness=missing で表す
 * @property {string|null} periodStart           ISO date or null
 * @property {string|null} periodEnd             ISO date or null
 * @property {string} observedAt                 ISO datetime (取得時刻)
 * @property {typeof FRESHNESS[number]} freshness
 * @property {ObservationProvenance} provenance
 */

/** 与えた Observation を検証する。副作用なし。 @returns {{ok:boolean, errors:string[]}} */
export function validateObservation(obs) {
  const errors = [];
  if (obs == null || typeof obs !== "object") {
    return { ok: false, errors: ["observation is not an object"] };
  }
  if (!OBSERVATION_SOURCES.includes(obs.source)) {
    errors.push(`invalid source: ${String(obs.source)}`);
  }
  if (typeof obs.metric !== "string" || obs.metric.length === 0) {
    errors.push("metric must be a non-empty string");
  }
  if (obs.dimensions == null || typeof obs.dimensions !== "object" || Array.isArray(obs.dimensions)) {
    errors.push("dimensions must be a plain object");
  } else {
    for (const [k, v] of Object.entries(obs.dimensions)) {
      if (typeof v !== "string") errors.push(`dimension "${k}" must be a string`);
    }
  }
  const vt = typeof obs.value;
  if (!(obs.value === null || vt === "number" || vt === "string" || vt === "boolean")) {
    errors.push(`value must be number|string|boolean|null, got ${vt}`);
  }
  if (obs.value !== null && vt === "number" && !Number.isFinite(obs.value)) {
    errors.push("numeric value must be finite (NaN/Infinity not allowed)");
  }
  if (!FRESHNESS.includes(obs.freshness)) {
    errors.push(`invalid freshness: ${String(obs.freshness)}`);
  }
  if (typeof obs.observedAt !== "string" || Number.isNaN(Date.parse(obs.observedAt))) {
    errors.push("observedAt must be an ISO datetime string");
  }
  for (const k of ["periodStart", "periodEnd"]) {
    const v = obs[k];
    if (v !== null && (typeof v !== "string" || Number.isNaN(Date.parse(v)))) {
      errors.push(`${k} must be ISO date string or null`);
    }
  }
  if (obs.provenance == null || typeof obs.provenance !== "object") {
    errors.push("provenance must be an object");
  } else if (!Array.isArray(obs.provenance.limitations)) {
    errors.push("provenance.limitations must be an array");
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Observation を生成する factory。欠けたフィールドは安全な既定で補い、検証してから返す。
 * @param {Partial<Observation> & {source:string, metric:string}} input
 * @returns {Observation}
 */
export function createObservation(input) {
  const obs = {
    source: input.source,
    metric: input.metric,
    dimensions: input.dimensions ?? {},
    value: input.value === undefined ? null : input.value,
    periodStart: input.periodStart ?? null,
    periodEnd: input.periodEnd ?? null,
    observedAt: input.observedAt ?? new Date().toISOString(),
    freshness: input.freshness ?? (input.value === undefined || input.value === null ? "missing" : "fresh"),
    provenance: {
      file: input.provenance?.file,
      api: input.provenance?.api,
      queryHash: input.provenance?.queryHash,
      limitations: input.provenance?.limitations ?? [],
    },
  };
  const { ok, errors } = validateObservation(obs);
  if (!ok) {
    throw new Error(`createObservation: invalid observation:\n  - ${errors.join("\n  - ")}`);
  }
  return obs;
}

/**
 * collector が返す per-source の実行結果。1 source の失敗を全体に波及させない (§7)。
 * @typedef {Object} SourceResult
 * @property {typeof OBSERVATION_SOURCES[number]} source
 * @property {"success"|"partial"|"failed"|"skipped"} status
 * @property {Observation[]} observations
 * @property {string[]} notes           人間可読の要約 (redact 済み)
 * @property {string[]} limitations
 * @property {string} [error]           failed 時の redact 済みエラー要約
 */

/** SourceResult の status 値。partial を success に見せない (§7)。 */
export const SOURCE_STATUSES = Object.freeze(["success", "partial", "failed", "skipped"]);

/**
 * 空の SourceResult を作る。
 * @param {string} source
 * @param {"success"|"partial"|"failed"|"skipped"} status
 * @returns {SourceResult}
 */
export function emptySourceResult(source, status = "skipped") {
  return { source, status, observations: [], notes: [], limitations: [] };
}
