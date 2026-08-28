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
  // authored 配列 AFFILIATE_ADS_BASE の閉じ括弧 `];` が存在すること。
  if (!/AFFILIATE_ADS_BASE\s*:\s*AffiliateAd\[\]\s*=\s*\[/.test(src)) {
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
/**
 * catalog entry + parseA8Code の fields から AffiliateAd の下書きを作る (純関数)。
 *
 * ★ locationCode は adType で分ける。banner 解決は locationCode を見ない
 *   (vertical + adType のみ / `affiliate-ad-snapshot.ts` の readActiveBannersByVerticalsFromR2) が、
 *   **text 解決は見る** (`sidebar-bottom` / `footer`)。全部 blog-bottom にすると harvest した text は
 *   banner 経路 (adType で弾かれる) にも text 経路 (locationCode 不一致) にも乗らず
 *   **永久に表示されない死に在庫**になる (2026-07-28 に 2 件が実際にそうなっていた)。
 *   A8 は canonical バナー非提供の案件が多く text fallback が常態なので影響が大きい。
 *
 * priority の 50 は仮置きで、`append-affiliate-ads.ts` が確定EPC のバンド式で上書きする。
 */
export function buildAdDraft(entry, fields) {
  // 名前を ascii スラグ化。日本語のみ等でスラグが空になる場合は A8 programId を使う (一意・追跡可能)。
  const nameSlug = String(entry.name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const slug = nameSlug || String(entry.programId || "prog").replace(/[^a-z0-9]/gi, "");
  // ★ 同一プログラムから banner と text の両方を登録できるので、id で種別が読めるようにする。
  //   banner は従来どおり `af_<slug>_a8_001` (既存 SSOT の命名を変えない)。text だけ `_text_` を挟む。
  //   これが無いと uniqueId の連番 `_002` になり、名前から banner/text を区別できない。
  const kind = fields.adType === "text" ? "_text" : "";
  return {
    id: `af_${slug}_a8${kind}_001`,
    title: entry.name,
    htmlContent: fields.htmlContent,
    programRef: `a8:${entry.programId}`,
    areaCode: null,
    vertical: entry.vertical ?? null,
    categoryKey: null,
    locationCode: fields.adType === "text" ? "sidebar-bottom" : "blog-bottom",
    isActive: true,
    priority: 50,
    startDate: null,
    endDate: null,
    targetCategories: null,
    adType: fields.adType,
    imageUrl: fields.imageUrl,
    trackingPixelUrl: fields.trackingPixelUrl,
    width: fields.width,
    height: fields.height,
    createdAt: null,
    updatedAt: null,
  };
}

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
  "id", "title", "htmlContent", "programRef", "areaCode", "vertical", "categoryKey",
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
