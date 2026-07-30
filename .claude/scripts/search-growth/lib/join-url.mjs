/**
 * join-url — URL 正規化 (GSC page ↔ GA4 pagePath ↔ CrUX URL ↔ route の結合キー)。
 *
 * url-policy.ts は Node から直 import 不可 (`@/config/known-theme-slugs` → app features
 * 依存) のため、結合に必要な純粋正規化だけをここに自己完結で実装する。
 * 正典: .claude/skills/analytics/search-growth/reference/platform-contract.md
 * （trailing slash / query / fragment / canonical / domain）。
 */

export const SITE_ORIGIN = "https://stats47.jp";
const SITE_HOSTS = new Set(["stats47.jp", "www.stats47.jp"]);

/** UTM / クリック ID など、結合キーで無視する query パラメータ。 */
const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "gclid", "fbclid", "yclid", "ref", "ref_src",
]);

/**
 * 入力 (フル URL または path) を正規化 path キーにする。
 * - host を落とし path のみ (同一 host 前提の結合キー)
 * - trailing slash を除去 (ルート "/" は保持)
 * - query / fragment を落とす
 * - percent-encoding を NFC decode して Unicode を一致させる (例 /blog/tags/平均体重)
 * @param {string} input
 * @returns {string|null} 例 "/ranking/income-per-capita" / パース不能なら null
 */
export function toPathKey(input) {
  if (typeof input !== "string" || input.trim() === "") return null;
  let path;
  try {
    const u = input.startsWith("http") ? new URL(input) : new URL(input, SITE_ORIGIN);
    path = u.pathname;
  } catch {
    return null;
  }
  path = safeDecode(path);
  // trailing slash 除去 (ルートは保持)
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (path === "") path = "/";
  return path;
}

/** フル URL / path を canonical な絶対 URL に正規化する (host 統一・tracking query 除去)。 */
export function toCanonicalUrl(input, site = SITE_ORIGIN) {
  const key = toPathKey(input);
  if (key == null) return null;
  return site.replace(/\/+$/, "") + key;
}

/** query を保持したまま正規化 (canonical drift 検査用: tracking のみ除去)。 */
export function stripTrackingParams(input) {
  try {
    const u = input.startsWith("http") ? new URL(input) : new URL(input, SITE_ORIGIN);
    for (const k of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(k.toLowerCase())) u.searchParams.delete(k);
    }
    return u.toString();
  } catch {
    return input;
  }
}

/**
 * MCP / CLI input の allowlist 検証。stats47.jp 配下のみ許可。
 * path のみ (相対) も許可する。
 */
export function isAllowedUrl(input, site = SITE_ORIGIN) {
  if (typeof input !== "string" || input.trim() === "") return false;
  if (input.startsWith("/")) return true; // 相対 path
  try {
    const u = new URL(input);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return SITE_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

function safeDecode(s) {
  try {
    return decodeURIComponent(s).normalize("NFC");
  } catch {
    return s.normalize ? s.normalize("NFC") : s;
  }
}
