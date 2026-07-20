/**
 * a8-append-core.mjs — affiliate-ads-data.ts への機械追記の純ロジック (browser/git 非依存)。
 *
 * AST を使わず、AFFILIATE_ADS が「末尾 `];` で閉じる純 JSON リテラル配列」という現行構造を利用して
 * 最終 `];` 直前に 1 エントリを挿入する。末尾パターンが崩れていたら abort (SSOT 破壊防止)。
 *
 * 責務:
 *   - validateTail: 追記可能な構造か検証
 *   - extractIds:   既存 id 一覧 (衝突チェック用)
 *   - uniqueId:     衝突しない id を採番
 *   - renderEntry:  AffiliateAd draft → 既存インデントに一致する TS リテラル文字列
 *   - insertEntry:  最終 `];` 直前に挿入した新ソースを返す
 */

/** AFFILIATE_ADS 配列が「... },\n];\n」または「...[]」で正しく閉じているか。 */
export function validateTail(src) {
  if (typeof src !== "string") return { ok: false, error: "src-not-string" };
  // export const AFFILIATE_ADS ... = [ ... ]; の閉じ括弧 `];` が存在すること。
  if (!/AFFILIATE_ADS\s*:\s*AffiliateAd\[\]\s*=\s*\[/.test(src)) {
    return { ok: false, error: "array-decl-not-found" };
  }
  // 最後の `];` を探す (配列の閉じ)。
  const idx = src.lastIndexOf("];");
  if (idx < 0) return { ok: false, error: "closing-bracket-not-found" };
  // `];` の直前 (空白除く) は `,`/`}` (末尾要素・現行は末尾カンマ付き) か `[` (空配列) であること。
  const before = src.slice(0, idx).replace(/\s+$/, "");
  const lastChar = before.slice(-1);
  if (lastChar !== "}" && lastChar !== "," && lastChar !== "[") {
    return { ok: false, error: `unexpected-char-before-bracket:${lastChar}` };
  }
  return { ok: true, closeIndex: idx, isEmpty: lastChar === "[" };
}

/** 既存ソースから "id": "..." を全抽出。 */
export function extractIds(src) {
  return [...src.matchAll(/"id":\s*"([^"]*)"/g)].map((m) => m[1]);
}

/** 既存ソース全文から a8mat トークンを全抽出 (dedup 用。htmlContent / imageUrl / pixel いずれからも拾う)。 */
export function extractA8mats(src) {
  return new Set([...src.matchAll(/a8mat=([A-Za-z0-9+._%-]+)/g)].map((m) => m[1]));
}

/** AffiliateAd draft の htmlContent から a8mat トークンを取り出す (無ければ null)。 */
export function draftA8mat(draft) {
  const m = String(draft?.htmlContent ?? "").match(/a8mat=([A-Za-z0-9+._%-]+)/);
  return m ? m[1] : null;
}

/**
 * baseId が既存と衝突しないよう連番 (_001, _002...) を振り直す。
 * baseId は "af_<slug>_a8_001" 形式想定。末尾 3 桁を増やす。
 */
export function uniqueId(baseId, existingIds) {
  const set = new Set(existingIds);
  if (!set.has(baseId)) return baseId;
  const m = baseId.match(/^(.*_)(\d{3})$/);
  const prefix = m ? m[1] : `${baseId}_`;
  let n = m ? Number(m[2]) : 1;
  for (let i = 0; i < 999; i++) {
    n += 1;
    const cand = `${prefix}${String(n).padStart(3, "0")}`;
    if (!set.has(cand)) return cand;
  }
  throw new Error(`uniqueId: 連番が尽きた (${baseId})`);
}

const FIELD_ORDER = [
  "id", "title", "htmlContent", "areaCode", "vertical", "categoryKey",
  "locationCode", "isActive", "priority", "startDate", "endDate",
  "targetCategories", "adType", "imageUrl", "trackingPixelUrl",
  "width", "height", "createdAt", "updatedAt",
];

/**
 * AffiliateAd draft → 既存インデント (2space) に一致する配列要素リテラル。
 * 末尾カンマ付き。createdAt/updatedAt が null なら現在時刻を入れる (nowStr 経由・テスト固定可)。
 */
export function renderEntry(draft, nowStr) {
  const obj = {};
  for (const k of FIELD_ORDER) {
    if (k === "createdAt" || k === "updatedAt") {
      obj[k] = draft[k] ?? nowStr ?? null;
    } else {
      obj[k] = k in draft ? draft[k] : null;
    }
  }
  // JSON.stringify(obj, null, 2) は先頭要素 "{" から 2space。配列内なので全行 +2space。
  const body = JSON.stringify(obj, null, 2)
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
  return `${body},`;
}

/**
 * 最終 `];` の直前に entryLiteral を挿入した新ソースを返す。
 * validateTail 済み前提。挿入は「閉じ `];` を含む行の直前」に改行込みで置く。
 */
export function insertEntry(src, entryLiteral) {
  const v = validateTail(src);
  if (!v.ok) throw new Error(`insertEntry: invalid tail (${v.error})`);
  const head = src.slice(0, v.closeIndex); // ... },\n  (または [ )
  const tail = src.slice(v.closeIndex); // ];\n...
  // head の末尾改行を保ちつつ entry を差し込む。head が改行で終わっていなければ足す。
  const sep = head.endsWith("\n") ? "" : "\n";
  return `${head}${sep}${entryLiteral}\n${tail}`;
}
