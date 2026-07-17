/**
 * sns-utm.cjs — SNS UTM 生成の**単一正典** (sns-content-standards.md §4 / buzz-map §7.1)。
 *
 * これまで register-drafts.cjs (X 量産) と buzz-map-utm-core.mjs (buzz-map) が別々に UTM を
 * 組み立てていたのを 1 本化する。UTM 規則を変えるときはここだけを直す (ドリフト防止)。
 *
 * 規約 (§4):
 *   utm_source  = x | instagram | youtube
 *   utm_medium  = social
 *   utm_campaign= ドメイン別 (ranking=<rankingKey> / compare=compare-<a>-vs-<b> /
 *                 correlation=correlation-<x>--<y> / buzz-map=buzz-map-<ideaId>)
 *   utm_content = <variant>  (X 量産は template=shock 等 / buzz-map は question-a 等。
 *                 YouTube pinned_comment は <variant>-pinned)
 *
 * canonical (UTM なしの primaryUrl) は SSOT が保持し、caption 生成時だけ UTM を付ける。
 * UTM 付き URL を sitemap / canonical に入れない (呼び元の責務)。
 */

"use strict";

const BASE = "https://stats47.jp";
const VALID_SOURCES = new Set(["x", "instagram", "youtube"]);

/** campaign 名をドメイン別に決定 (§4)。返り値は utm_campaign にそのまま入れる。 */
function campaignFor(domain, params = {}) {
  switch (domain) {
    case "ranking":
      req(params.rankingKey, "rankingKey");
      return params.rankingKey;
    case "compare":
      req(params.areaA, "areaA");
      req(params.areaB, "areaB");
      return `compare-${params.areaA}-vs-${params.areaB}`;
    case "correlation":
      req(params.keyX, "keyX");
      req(params.keyY, "keyY");
      return `correlation-${params.keyX}--${params.keyY}`;
    case "buzz-map":
      req(params.ideaId, "ideaId");
      return `buzz-map-${params.ideaId}`;
    default:
      throw new Error(`sns-utm: 未対応 domain: ${domain}`);
  }
}

/**
 * canonical URL に UTM を付ける (§4 / §7.1)。
 * @param {object} p
 * @param {string} p.canonicalUrl UTM なしの canonical (相対 /ranking/... も絶対も可・query 不可)
 * @param {"x"|"instagram"|"youtube"} p.platform
 * @param {string} p.campaign 既に決定した utm_campaign (campaignFor で作る)
 * @param {string} p.variant utm_content
 * @param {boolean} [p.pinned] YouTube pinned_comment なら true (variant に -pinned)
 * @param {string} [base] 相対 URL 用ベース (既定 https://stats47.jp)
 * @returns {string} UTM 付き絶対 URL
 */
function buildUtmUrl({ canonicalUrl, platform, campaign, variant, pinned }, base = BASE) {
  req(canonicalUrl, "canonicalUrl");
  if (!VALID_SOURCES.has(platform)) throw new Error(`sns-utm: 未対応 platform: ${platform}`);
  req(campaign, "campaign");
  req(variant, "variant");
  if (String(canonicalUrl).includes("?")) {
    throw new Error(`sns-utm: canonicalUrl に query が付いている (clean 必須): ${canonicalUrl}`);
  }
  const absolute = String(canonicalUrl).startsWith("http")
    ? canonicalUrl
    : `${base}${String(canonicalUrl).startsWith("/") ? "" : "/"}${canonicalUrl}`;
  const url = new URL(absolute);
  url.searchParams.set("utm_source", platform);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", pinned ? `${variant}-pinned` : variant);
  return url.toString();
}

/** domain + params から campaign を決めて UTM URL を作る高水準 API。 */
function buildUtmForDomain({ domain, domainParams, canonicalUrl, platform, variant, pinned }, base = BASE) {
  const campaign = campaignFor(domain, domainParams ?? {});
  return buildUtmUrl({ canonicalUrl, platform, campaign, variant, pinned }, base);
}

function req(v, name) {
  if (v == null || v === "") throw new Error(`sns-utm: ${name} が空`);
  return v;
}

module.exports = { buildUtmUrl, buildUtmForDomain, campaignFor, BASE, VALID_SOURCES };
