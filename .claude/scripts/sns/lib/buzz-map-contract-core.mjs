/**
 * buzz-map landing contract checker — core module.
 *
 * 仕様: .claude/rules/buzz-map-standards.md §5 (landing contract)。
 * SNS と landing の整合性を機械検証する純粋関数 + fetch 注入型の検証関数を提供する。
 *
 * 完全に副作用のない純粋関数群 (deriveContractResult / isCleanCanonicalUrl /
 * extractPageSignals / checkRequiredTerms) と、HTTP fetch を DI で受け取る
 * verifyLandingContract を分離しているため、ネットワークに依存せずユニットテストできる。
 *
 * @typedef {Object} LandingContract
 * @property {string} ideaId
 * @property {string} canonicalUrl        primary landing URL (UTM なし canonical)
 * @property {string} promise             SNS の約束 (問い)
 * @property {string[]} requiredMetricKeys ページに存在すべき metric key
 * @property {string} [requiredYear]      SNS と一致すべき年次
 * @property {string[]} requiredTerms     title/H1/本文に含まれるべき語
 * @property {number|null} liveStatus     HTTP status (未取得なら null)
 * @property {string|null} verifiedAt     ISO 日時 (未検証なら null)
 * @property {'pass'|'fail'|'pending'} result
 * @property {string[]} reasons
 *
 * @typedef {Object} PageSignals
 * @property {string} title
 * @property {string} h1
 * @property {boolean} isNoindex
 * @property {string} bodyText
 */

/** Googlebot UA (呼び出し側で fetchImpl に渡す用の参考定数)。 */
export const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

/**
 * landing contract の検証内容7項目を評価する純粋関数。
 *
 * liveStatus が null (未取得) なら 'pending'。
 * どれか 1 つでも false なら 'fail' で reasons に該当理由を積む。
 * 全項目 true (かつ liveStatus === 200) なら 'pass'。
 *
 * @param {Object} input
 * @param {number|null} input.liveStatus
 * @param {boolean} input.canonicalOk         canonical がクリーン URL
 * @param {boolean} input.notIndexable        noindex でない (= indexable) こと
 * @param {boolean} input.hasRequiredTerms    requiredTerms が title/H1/本文にある
 * @param {boolean} input.hasRequiredMetricKeys requiredMetricKeys がページに存在
 * @param {boolean} input.yearUnitMatch       年次・対象単位が SNS と一致 + 問いに答えがある
 * @returns {{ result: 'pass'|'fail'|'pending', reasons: string[] }}
 */
export function deriveContractResult({
  liveStatus,
  canonicalOk,
  notIndexable,
  hasRequiredTerms,
  hasRequiredMetricKeys,
  yearUnitMatch,
}) {
  if (liveStatus === null || liveStatus === undefined) {
    return { result: "pending", reasons: ["live status not fetched yet"] };
  }

  const reasons = [];

  if (liveStatus !== 200) {
    reasons.push(`live status is ${liveStatus} (expected 200)`);
  }
  if (!canonicalOk) {
    reasons.push("canonical URL is not clean");
  }
  if (!notIndexable) {
    reasons.push("page is noindex");
  }
  if (!hasRequiredTerms) {
    reasons.push("required terms missing from title/H1/body");
  }
  if (!hasRequiredMetricKeys) {
    reasons.push("required metric keys not present on page");
  }
  if (!yearUnitMatch) {
    reasons.push("year/unit mismatch or promise answer not found");
  }

  if (reasons.length > 0) {
    return { result: "fail", reasons };
  }
  return { result: "pass", reasons: [] };
}

/**
 * クリーンな canonical URL かを判定する純粋関数。
 * 条件: https で始まる / stats47.jp ドメイン / クエリ文字列 (UTM 含む) が無い。
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isCleanCanonicalUrl(url) {
  if (typeof url !== "string" || url.length === 0) return false;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase();
  if (host !== "stats47.jp" && !host.endsWith(".stats47.jp")) return false;

  // クエリ (UTM 含む) が 1 つでもあれば不可。
  if (parsed.search && parsed.search.length > 0) return false;

  return true;
}

/**
 * HTML から title / 最初の h1 / robots noindex 有無 / テキスト本文を軽量 regex で抽出する純粋関数。
 * DOM ライブラリは使わない。
 *
 * @param {string} html
 * @returns {PageSignals}
 */
export function extractPageSignals(html) {
  const safe = typeof html === "string" ? html : "";

  const titleMatch = safe.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeBasicEntities(titleMatch[1]).trim() : "";

  const h1Match = safe.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? stripTags(h1Match[1]).trim() : "";

  const isNoindex = detectNoindex(safe);

  const bodyText = extractBodyText(safe);

  return { title, h1, isNoindex, bodyText };
}

/**
 * 各 requiredTerm が title/h1/bodyText のいずれかに含まれるかを判定する純粋関数。
 *
 * @param {PageSignals} signals
 * @param {string[]} requiredTerms
 * @returns {{ ok: boolean, missing: string[] }}
 */
export function checkRequiredTerms(signals, requiredTerms) {
  const terms = Array.isArray(requiredTerms) ? requiredTerms : [];
  if (terms.length === 0) return { ok: true, missing: [] };

  const haystack = [
    signals?.title ?? "",
    signals?.h1 ?? "",
    signals?.bodyText ?? "",
  ]
    .join("\n")
    .toLowerCase();

  const missing = [];
  for (const term of terms) {
    if (typeof term !== "string" || term.length === 0) continue;
    if (!haystack.includes(term.toLowerCase())) missing.push(term);
  }

  return { ok: missing.length === 0, missing };
}

/**
 * requiredMetricKeys がページに存在するかの緩い判定 (純粋)。
 * html 本文に metricKey 文字列そのもの、または対応する ranking パス (/ranking/<key>) が含まれるか。
 *
 * @param {string} html
 * @param {string[]} requiredMetricKeys
 * @returns {{ ok: boolean, missing: string[] }}
 */
export function checkRequiredMetricKeys(html, requiredMetricKeys) {
  const keys = Array.isArray(requiredMetricKeys) ? requiredMetricKeys : [];
  if (keys.length === 0) return { ok: true, missing: [] };

  const haystack = (typeof html === "string" ? html : "").toLowerCase();

  const missing = [];
  for (const key of keys) {
    if (typeof key !== "string" || key.length === 0) continue;
    const k = key.toLowerCase();
    const present = haystack.includes(k) || haystack.includes(`/ranking/${k}`);
    if (!present) missing.push(key);
  }

  return { ok: missing.length === 0, missing };
}

/**
 * plan を受け取り HTTP fetch (DI) で primary landing を検証して LandingContract を返す。
 *
 * @param {Object} plan
 * @param {string} plan.ideaId
 * @param {string|null} [plan.canonicalUrl]   primary landing URL (別名 primaryUrl)
 * @param {string|null} [plan.primaryUrl]     canonicalUrl の別名
 * @param {string} [plan.promise]
 * @param {string[]} [plan.requiredMetricKeys]
 * @param {string} [plan.requiredYear]
 * @param {string[]} [plan.requiredTerms]
 * @param {Object} [deps]
 * @param {(url: string) => Promise<{ status: number, text: () => Promise<string> }>} [deps.fetchImpl]
 *   HTTP 取得関数。既定は globalThis.fetch。テストでは必ず差し替えられる。
 * @param {() => string} [deps.nowIso] 現在時刻 ISO 生成 (テスト用)。既定 new Date().toISOString()。
 * @returns {Promise<LandingContract>}
 */
export async function verifyLandingContract(plan, deps = {}) {
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch;
  const nowIso = deps.nowIso ?? (() => new Date().toISOString());

  const canonicalUrl = plan?.canonicalUrl ?? plan?.primaryUrl ?? null;

  const base = {
    ideaId: plan?.ideaId ?? "",
    canonicalUrl: canonicalUrl ?? "",
    promise: plan?.promise ?? "",
    requiredMetricKeys: Array.isArray(plan?.requiredMetricKeys)
      ? plan.requiredMetricKeys
      : [],
    requiredYear: plan?.requiredYear,
    requiredTerms: Array.isArray(plan?.requiredTerms) ? plan.requiredTerms : [],
  };

  // primary landing URL が無ければ pending。
  if (!canonicalUrl || String(canonicalUrl).length === 0) {
    return {
      ...base,
      liveStatus: null,
      verifiedAt: null,
      result: "pending",
      reasons: ["no primary landing URL"],
    };
  }

  let liveStatus = null;
  let html = "";
  let fetchError = null;

  try {
    const res = await fetchImpl(canonicalUrl);
    liveStatus =
      typeof res?.status === "number" ? res.status : null;
    if (typeof res?.text === "function") {
      html = await res.text();
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  if (fetchError !== null) {
    return {
      ...base,
      liveStatus: null,
      verifiedAt: nowIso(),
      result: "pending",
      reasons: [`fetch failed: ${fetchError}`],
    };
  }

  const signals = extractPageSignals(html);
  const canonicalOk = isCleanCanonicalUrl(canonicalUrl);
  const notIndexable = !signals.isNoindex;
  const termCheck = checkRequiredTerms(signals, base.requiredTerms);
  const metricCheck = checkRequiredMetricKeys(html, base.requiredMetricKeys);

  // 年次と promise の答えが landing 内にあるか (緩い実装)。
  const yearUnitMatch = evaluateYearAndPromise({
    signals,
    html,
    requiredYear: base.requiredYear,
    promise: base.promise,
    hasRequiredTerms: base.requiredTerms.length > 0,
  });

  const derived = deriveContractResult({
    liveStatus,
    canonicalOk,
    notIndexable,
    hasRequiredTerms: termCheck.ok,
    hasRequiredMetricKeys: metricCheck.ok,
    yearUnitMatch,
  });

  // reasons に欠落した具体語を補足する (deriveContractResult の一般理由を詳細化)。
  const reasons = [...derived.reasons];
  if (!termCheck.ok) {
    reasons.push(`missing terms: ${termCheck.missing.join(", ")}`);
  }
  if (!metricCheck.ok) {
    reasons.push(`missing metric keys: ${metricCheck.missing.join(", ")}`);
  }

  return {
    ...base,
    liveStatus,
    verifiedAt: nowIso(),
    result: derived.result,
    reasons,
  };
}

// ---------------------------------------------------------------------------
// 内部ヘルパー (純粋)
// ---------------------------------------------------------------------------

/**
 * 年次と対象単位が一致し、promise の答えが landing 内にあるかの緩い評価。
 *
 * - requiredYear がある場合は本文/シグナルに年が含まれること (対象年次の一致)。
 * - 問い (promise) への答えは、原則として requiredTerms 検証 (title/H1/本文に主要語が
 *   ある) で担保する設計（title/H1/本文またはページデータにrequiredTermsがあること）。
 *   ここでは requiredTerms が明示されていない場合のフォールバックとしてのみ promise の
 *   主要語断片が本文にあるかを緩く見る。CJK は語分割できないため、requiredTerms がある
 *   ときは promise の追加ゲートをかけない (二重の厳格化で誤 fail するのを避ける)。
 *
 * 指定が無ければ true。
 *
 * @param {Object} args
 * @param {PageSignals} args.signals
 * @param {string} args.html
 * @param {string} [args.requiredYear]
 * @param {string} [args.promise]
 * @param {boolean} args.hasRequiredTerms requiredTerms が定義されているか
 */
function evaluateYearAndPromise({
  signals,
  html,
  requiredYear,
  promise,
  hasRequiredTerms,
}) {
  const haystack = [
    signals?.title ?? "",
    signals?.h1 ?? "",
    signals?.bodyText ?? "",
    typeof html === "string" ? html : "",
  ]
    .join("\n")
    .toLowerCase();

  if (typeof requiredYear === "string" && requiredYear.length > 0) {
    if (!haystack.includes(requiredYear.toLowerCase())) return false;
  }

  // requiredTerms が答えの担保を担うため、それがあるときは promise 追加ゲートをかけない。
  if (!hasRequiredTerms && typeof promise === "string" && promise.length > 0) {
    const tokens = promise
      .split(/[\s、。,.!?？！「」（）()]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);
    if (tokens.length > 0) {
      const anyMatch = tokens.some((t) => haystack.includes(t.toLowerCase()));
      if (!anyMatch) return false;
    }
  }

  return true;
}

/** robots meta / X-Robots 相当を含む noindex を検出する。 */
function detectNoindex(html) {
  // <meta name="robots" content="... noindex ..."> (name / content の順不同・大小無視)
  const metaRe = /<meta\b[^>]*>/gi;
  let m;
  while ((m = metaRe.exec(html)) !== null) {
    const tag = m[0].toLowerCase();
    const isRobots =
      /name\s*=\s*["']?robots["']?/.test(tag) ||
      /name\s*=\s*["']?googlebot["']?/.test(tag);
    if (isRobots && /content\s*=\s*["'][^"']*noindex[^"']*["']/.test(tag)) {
      return true;
    }
  }
  return false;
}

/** HTML タグを除去する。 */
function stripTags(s) {
  return s.replace(/<[^>]*>/g, "");
}

/** 最小限の HTML エンティティをデコードする (title 用)。 */
function decodeBasicEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * script/style/head を除いた body テキストを抽出する軽量実装。
 * DOM を組まず、タグ剥がし + 空白正規化のみ行う。
 */
function extractBodyText(html) {
  let s = html;
  // script / style を丸ごと除去。
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  // head を除去 (title は別途抽出済み)。
  s = s.replace(/<head[\s\S]*?<\/head>/gi, " ");
  // 残りのタグを剥がす。
  s = stripTags(s);
  s = decodeBasicEntities(s);
  // 空白正規化。
  s = s.replace(/\s+/g, " ").trim();
  return s;
}
