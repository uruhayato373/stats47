/**
 * redact — google-admin runner の出力 sanitize (pure)。
 *
 * 正典: ./README.md「実行境界」「mutation手順」。
 * cookie / token / localStorage / Authorization / account email / URL query を
 * console・audit JSON・state へ出さない。search-growth の redaction を再利用して拡張する。
 */
import { redactString as baseRedactString } from "../search-growth/lib/redaction.mjs";

/** email をマスクする (account email を保存しない)。 */
export function redactEmail(s) {
  if (typeof s !== "string") return s;
  return s.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]");
}

/** URL の query / fragment を落とす (query に個人情報・token が乗りうる)。 */
export function redactUrl(s) {
  if (typeof s !== "string") return s;
  return s.replace(/(https?:\/\/[^\s"'?#]+)[?#][^\s"']*/g, "$1[REDACTED_QUERY]");
}

/**
 * Google API のエラー本文に含まれる `Help Token: <値>` を落とす。
 *
 * サポート用の識別子だが、README「Cookie、token、localStorage、認証header を保存・出力しない」に
 * 従い state / console へ残さない。キー名ベースの SENSITIVE_KEY_RE では、`detail` のような
 * 無害な名前のキーの**値の中**に埋まった token を捕まえられないため、文字列側で落とす
 * (2026-07-30 に adsense-inventory-latest.json へ実際に保存されていた)。
 */
export function redactHelpToken(s) {
  if (typeof s !== "string") return s;
  return s.replace(/Help Token:\s*\S+/gi, "Help Token: [REDACTED]");
}

/** 文字列を全段 sanitize。 */
export function sanitize(s) {
  return redactHelpToken(redactUrl(redactEmail(baseRedactString(s))));
}

/** object を再帰 sanitize (機密キーは値ごとマスクする)。 */
const SENSITIVE_KEY_RE = /(cookie|token|secret|password|authorization|credential|localstorage|session)/i;

export function sanitizeObject(obj) {
  if (obj == null) return obj;
  if (typeof obj === "string") return sanitize(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = SENSITIVE_KEY_RE.test(k) ? "[REDACTED]" : sanitizeObject(v);
    }
    return out;
  }
  return obj;
}
