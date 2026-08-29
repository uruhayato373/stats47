/**
 * buzz-map-utm-core.mjs — buzz-map の UTM API (薄い adapter)。
 *
 * ★UTM の実装本体は正典 `.claude/scripts/lib/sns-utm.cjs` に一本化した (CP5)。
 *   本モジュールは buzz-map の呼び出し形 (ideaId → campaign=buzz-map-<ideaId>) を
 *   canonical util へ委譲するだけ。UTM 規則を変えるときは sns-utm.cjs を直す。
 *
 * 規約 (sns-content-standards §4):
 *   utm_source=x|instagram, utm_medium=social, utm_campaign=buzz-map-<ideaId>, utm_content=<variant>
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const snsUtm = require("../../lib/sns-utm.cjs");

/**
 * buzz-map の canonical URL に UTM を付ける。canonical util へ委譲。
 * @param {{ canonicalUrl:string, platform:"x"|"instagram", ideaId:string, variant:string }} p
 * @param {string} [base]
 * @returns {string}
 */
export function buildUtmUrl({ canonicalUrl, platform, ideaId, variant }, base) {
  const campaign = snsUtm.campaignFor("buzz-map", { ideaId });
  return snsUtm.buildUtmUrl({ canonicalUrl, platform, campaign, variant }, base);
}

/** campaign 名だけ欲しいとき (posts.json 記録用)。 */
export function utmCampaignFor(ideaId) {
  return snsUtm.campaignFor("buzz-map", { ideaId });
}

/**
 * 投稿から landing まで同じ campaign で直接計測できるかを検証する。
 * draft gate 用の純粋関数で、URL・campaign・source・medium・attribution の欠落を停止する。
 * @param {{ utmUrl:string|null, ideaId:string, platform:"x"|"instagram", attribution:string }} p
 * @returns {{ valid:boolean, reasons:string[] }}
 */
export function validateAttributionContract({ utmUrl, ideaId, platform, attribution }) {
  const reasons = [];
  if (!utmUrl) return { valid: false, reasons: ["utm_url が無い"] };

  let url;
  try {
    url = new URL(utmUrl, "https://stats47.jp");
  } catch {
    return { valid: false, reasons: ["utm_url が不正"] };
  }

  const expectedCampaign = utmCampaignFor(ideaId);
  if (url.searchParams.get("utm_source") !== platform) reasons.push("utm_source 不一致");
  if (url.searchParams.get("utm_medium") !== "social") reasons.push("utm_medium 不一致");
  if (url.searchParams.get("utm_campaign") !== expectedCampaign) reasons.push("utm_campaign 不一致");
  if (!url.searchParams.get("utm_content")) reasons.push("utm_content が無い");
  if (attribution !== "direct") reasons.push("attribution != direct");

  return { valid: reasons.length === 0, reasons };
}
