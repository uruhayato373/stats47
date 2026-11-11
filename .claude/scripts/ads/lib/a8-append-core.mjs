/**
 * a8-append-core.mjs — 広告の台帳 `affiliate.ads` (data/affiliate/ledger/ads.json) への機械追記の純ロジック (browser/git 非依存)。
 *
 * 台帳は `{ "ads": [ ... ] }` の JSON。読んだ文書の形を確かめ、配列の末尾に 1 件ずつ足し、
 * 書き手と同じ形 (`JSON.stringify(doc, null, 2) + "\n"`) で書き出す。形が崩れていたら abort (SSOT 破壊防止)。
 *
 * 責務:
 *   - parseAdsDoc:     台帳の文字列 → 文書 (JSON として読めて形が合うときだけ)
 *   - validateAdsDoc:  追記できる形か検証 (`ads` が配列で、各要素が文字列の id を持つ)
 *   - extractIds:      既存 id 一覧 (衝突チェック用)
 *   - uniqueId:        衝突しない id を採番
 *   - renderEntry:     AffiliateAd draft → 台帳の項目の順にそろえた 1 件
 *   - appendEntry:     配列の末尾に 1 件を足した新しい文書を返す (元の文書は変えない)
 *   - serializeAdsDoc: 文書 → 台帳の文字列
 */

/** 追記できる形か: `{ ads: [ { id: string, ... }, ... ] }`。 */
export function validateAdsDoc(doc) {
  if (typeof doc !== "object" || doc === null || Array.isArray(doc)) return { ok: false, error: "doc-not-object" };
  if (!Array.isArray(doc.ads)) return { ok: false, error: "ads-not-array" };
  for (const [index, ad] of doc.ads.entries()) {
    if (typeof ad !== "object" || ad === null || Array.isArray(ad)) return { ok: false, error: `ad-not-object:${index}` };
    if (typeof ad.id !== "string" || ad.id.length === 0) return { ok: false, error: `ad-id-missing:${index}` };
  }
  return { ok: true, count: doc.ads.length, isEmpty: doc.ads.length === 0 };
}

/** 台帳の文字列を読む。JSON として読めない・形が合わないときは { ok: false, error }。 */
export function parseAdsDoc(text) {
  if (typeof text !== "string") return { ok: false, error: "text-not-string" };
  let doc;
  try {
    doc = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `invalid-json:${e instanceof Error ? e.message : String(e)}` };
  }
  const v = validateAdsDoc(doc);
  return v.ok ? { ok: true, doc } : v;
}

/** 文書 → 台帳の文字列 (書き手の唯一の書き方)。 */
export function serializeAdsDoc(doc) {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

/** 既存の広告の id 一覧。 */
export function extractIds(doc) {
  return doc.ads.map((ad) => ad.id);
}

/** 既存の広告の全項目から a8mat トークンを集合で抽出 (dedup 用。htmlContent / imageUrl / pixel いずれからも拾う)。 */
export function extractA8mats(doc) {
  return new Set([...JSON.stringify(doc.ads).matchAll(/a8mat=([A-Za-z0-9+._%-]+)/g)].map((m) => m[1]));
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
  "targetCategories", "targetRankingKeys", "adType", "imageUrl", "trackingPixelUrl",
  "width", "height", "createdAt", "updatedAt",
];

/**
 * AffiliateAd draft → 台帳の項目の順 (FIELD_ORDER) にそろえた 1 件。
 * createdAt/updatedAt が null なら現在時刻を入れる (nowStr 経由・テスト固定可)。
 */
export function renderEntry(draft, nowStr) {
  const obj = {};
  for (const k of FIELD_ORDER) {
    if (k === "createdAt" || k === "updatedAt") {
      obj[k] = draft[k] ?? nowStr ?? null;
    } else if (k === "targetRankingKeys") {
      // 対象ランキングは任意項目。空なら出さない (既存の広告と同じ形を保つ)
      if (Array.isArray(draft[k]) && draft[k].length > 0) obj[k] = [...draft[k]];
    } else {
      obj[k] = k in draft ? draft[k] : null;
    }
  }
  return obj;
}

/**
 * 配列の末尾に entry を足した新しい文書を返す。元の文書は変えない。
 * 形が崩れた文書・既にある id の entry は throw (呼び出し側が uniqueId で採番してから渡す)。
 */
export function appendEntry(doc, entry) {
  const v = validateAdsDoc(doc);
  if (!v.ok) throw new Error(`appendEntry: invalid doc (${v.error})`);
  if (doc.ads.some((ad) => ad.id === entry?.id)) throw new Error(`appendEntry: id が重複 (${entry?.id})`);
  return { ...doc, ads: [...doc.ads, entry] };
}

/**
 * decision レーン (資料請求・見積もり・相談・購入・契約) の広告は対象ランキングの限定が必須
 * (affiliate-ads-standards.md §2)。空・実在しない key を問題の一覧で返す (空配列なら OK)。
 * 2026-10-19 に、追記スクリプトが targetRankingKeys を書き出さず 13 件を手で直した (AFF-APPEND-TARGET-KEYS-01)。
 * @param {{ lane?: string }} profile
 * @param {string[] | null | undefined} keys
 * @param {(key: string) => boolean} metricExists
 */
export function validateDecisionTargets(profile, keys, metricExists) {
  const list = Array.isArray(keys) ? keys : [];
  if (profile?.lane !== "decision") return [];
  if (list.length === 0) return ["decision レーンなのに targetRankingKeys が空"];
  return list.filter((key) => !metricExists(key)).map((key) => `targetRankingKeys の ${key} が metric 定義に無い`);
}
