/**
 * redaction — secret / query / cookie を安全に扱う純粋関数。
 *
 * 正典: docs/02_実装計画/39 §2.6 / §6.4 / §13 Normalize (secret/query redaction)。
 * - 検索 query の生文字列を公開レポートへ出さない (集計/ハッシュ化)
 * - service account key / bearer / api key / cookie をログへ出さない
 */
import { createHash } from "node:crypto";

/** 検索 query を非可逆ハッシュ化する (provenance.queryHash 用)。生 query を保存しない。 */
export function hashQuery(q) {
  if (q == null) return null;
  return "q_" + createHash("sha256").update(String(q), "utf8").digest("hex").slice(0, 16);
}

/** 機密とみなす object key の判定。 */
const SENSITIVE_KEY_RE = /(authorization|cookie|token|secret|password|passwd|private[_-]?key|api[_-]?key|client[_-]?secret|refresh[_-]?token|credentials?)/i;

/** 文字列中の secret らしき値をマスクする。 */
export function redactString(input) {
  if (typeof input !== "string") return input;
  let s = input;
  // PEM 秘密鍵
  s = s.replace(/-----BEGIN[^-]*PRIVATE KEY-----[\s\S]*?-----END[^-]*PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]");
  // Bearer トークン
  s = s.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, "Bearer [REDACTED]");
  // JWT (3 セグメントの base64url)
  s = s.replace(/\beyJ[A-Za-z0-9_\-]{6,}\.[A-Za-z0-9_\-]{6,}\.[A-Za-z0-9_\-]{6,}\b/g, "[REDACTED_JWT]");
  // key=value 形式の秘密 (URL query / env dump)
  s = s.replace(/\b(key|apikey|api_key|access_token|token|secret|password)=([^&\s"']+)/gi, "$1=[REDACTED]");
  return s;
}

/**
 * URL から query / fragment を落とし (既定)、ログ安全にする。
 * @param {string} url
 * @param {{keepQueryKeys?: string[]}} [opts]
 */
export function redactUrl(url, opts = {}) {
  if (typeof url !== "string") return url;
  try {
    const u = new URL(url);
    const keep = new Set(opts.keepQueryKeys ?? []);
    for (const k of [...u.searchParams.keys()]) {
      if (!keep.has(k)) u.searchParams.delete(k);
      else u.searchParams.set(k, "…");
    }
    u.hash = "";
    return u.toString();
  } catch {
    // 相対パス等: query/fragment を素朴に落とす
    return String(url).split("#")[0].split("?")[0];
  }
}

/** object を深く redact する。機密 key の値は [REDACTED]、文字列値は redactString。 */
export function redactObject(obj, seen = new WeakSet()) {
  if (obj == null) return obj;
  if (typeof obj === "string") return redactString(obj);
  if (typeof obj !== "object") return obj;
  if (seen.has(obj)) return "[Circular]";
  seen.add(obj);
  if (Array.isArray(obj)) return obj.map((v) => redactObject(v, seen));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEY_RE.test(k)) out[k] = "[REDACTED]";
    else out[k] = redactObject(v, seen);
  }
  return out;
}

export { SENSITIVE_KEY_RE };
