#!/usr/bin/env node
/**
 * build-sitemap-ranking-keys.cjs
 *
 * sitemap.ts の /ranking 出力対象キーを「複数週の GSC impressions 和集合」で生成する。
 *
 * ## なぜ和集合か (2026-05-05 インシデント回避)
 * 過去に INDEXABLE_RANKING_KEYS (単一週 W17 の impressions≥1 = 338 件) で sitemap を
 * 絞ったところ、1,584 件がサイトマップから消えて大量インデックス削除が発生した。
 * 原因は「単一週スナップショットの 0 impression」を「価値なし」と誤判定し、
 * indexed 済みページまで落としたこと。
 *
 * 本スクリプトは利用可能な **全週の pages.csv の和集合** を取ることで、
 * 「ある時点で indexed され検索表示された実績がある」キーを保守的に拾う。
 * 一度も impressions を得ていないキー (= 実質 crawled-not-indexed の長期滞留) のみを
 * sitemap から外し、クロール予算を温存する。
 *
 * さらに既存 INDEXABLE_RANKING_KEYS も和集合に含め、過去に indexable 判定された
 * キーの取りこぼしを防ぐ (二重の安全弁)。
 *
 * ## キーごとの lastmod (GSC-SITEMAP-LASTMOD-01・2026-11-25)
 * 出力には SITEMAP_RANKING_LASTMOD (key → YYYY-MM-DD) も別ファイルへ出す。値は R2 の
 * 観測値の values.json (キーは `statsR2Key(key, "prefecture")`) の Last-Modified (R2_PUBLIC_FETCH_URL 経由の HEAD)。
 * 差分 push (packages/r2-storage/src/scripts/diff-push-r2.ts) は R2 上の size と ETag(md5) が
 * 同じ object を送り直さないため、この日付は「values.json の中身が最後に変わった日」を指す。
 * 判定できないキー (404・5xx・Last-Modified 無し) は前回の値を残し、前回も無ければ載せない
 * (根拠の無い日付を作らない)。R2_PUBLIC_FETCH_URL が無いときは全キー前回の値を残す。
 *
 * 出力: apps/web/src/config/sitemap-ranking-keys.ts (SITEMAP_RANKING_KEYS)
 *       apps/web/src/config/sitemap-ranking-lastmod.ts (SITEMAP_RANKING_LASTMOD)
 * 再生成: node .claude/scripts/gsc/build-sitemap-ranking-keys.cjs
 */

const fs = require("fs");
const path = require("path");
const { datasetDir } = require("../../../config/datasets.mjs");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const SNAPSHOTS_DIR = path.join(
  PROJECT_ROOT,
  datasetDir("gsc.snapshots"),
);
const OUT_FILE = path.join(
  PROJECT_ROOT,
  "apps/web/src/config/sitemap-ranking-keys.ts",
);

/** キーごとの lastmod は別ファイル。SITEMAP_RANKING_KEYS は middleware (Edge) の束にも入るため、日付 2,600 行を同じファイルに足さない */
const LASTMOD_OUT_FILE = path.join(
  PROJECT_ROOT,
  "apps/web/src/config/sitemap-ranking-lastmod.ts",
);

const IMPRESSION_THRESHOLD = 1;
const RANKING_PREFIX_RE = /^https?:\/\/[^/]+\/ranking\/([^/?#]+)/;

/** pages.csv (page,clicks,impressions,ctr,position) を読み、imp>=閾値 の ranking キーを返す */
function keysFromPagesCsv(csvPath) {
  const keys = new Set();
  const text = fs.readFileSync(csvPath, "utf8");
  const lines = text.split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    // page は URL なのでカンマを含まない前提 (GSC export 仕様)。先頭4カラムを単純分割。
    const cols = line.split(",");
    const url = cols[0];
    const impressions = Number(cols[2]);
    if (!Number.isFinite(impressions) || impressions < IMPRESSION_THRESHOLD) continue;
    const m = RANKING_PREFIX_RE.exec(url);
    if (!m) continue;
    keys.add(decodeURIComponent(m[1]).replace(/\/$/, ""));
  }
  return keys;
}

/** 既存 INDEXABLE_RANKING_KEYS を二次安全弁として取り込む (正規表現抽出) */
function existingIndexableKeys() {
  const p = path.join(
    PROJECT_ROOT,
    "apps/web/src/config/indexable-ranking-keys.ts",
  );
  const keys = new Set();
  if (!fs.existsSync(p)) return keys;
  const text = fs.readFileSync(p, "utf8");
  const re = /"([a-z0-9][a-z0-9-]*)"/g;
  let m;
  while ((m = re.exec(text))) keys.add(m[1]);
  return keys;
}

/** KNOWN_RANKING_KEYS (全 isActive ranking) を取り込む (正規表現抽出)
 *  INDEXING-SITEMAP-02: 「コンテンツ実体のある URL」= R2 active = KNOWN_RANKING_KEYS を全包含。
 *  GSC impressions 0 でも isActive なら sitemap に載せてクロール機会を与える。
 */
function knownRankingKeys() {
  const p = path.join(
    PROJECT_ROOT,
    "packages/ranking/src/config/known-ranking-keys.ts",
  );
  const keys = new Set();
  if (!fs.existsSync(p)) return keys;
  const text = fs.readFileSync(p, "utf8");
  const re = /"([a-z0-9][a-z0-9-]*)"/g;
  let m;
  while ((m = re.exec(text))) keys.add(m[1]);
  return keys;
}

/** 前回の出力から SITEMAP_RANKING_LASTMOD を読む (取得できなかったキーの据え置き用) */
function previousLastmod() {
  const map = new Map();
  if (!fs.existsSync(LASTMOD_OUT_FILE)) return map;
  const text = fs.readFileSync(LASTMOD_OUT_FILE, "utf8");
  const re = /^ {2}\["([a-z0-9][a-z0-9-]*)", "(\d{4}-\d{2}-\d{2})"\],$/gm;
  let m;
  while ((m = re.exec(text))) map.set(m[1], m[2]);
  return map;
}

/** Last-Modified ヘッダを YYYY-MM-DD (UTC) にする。読めなければ null */
function toIsoDay(header) {
  if (!header) return null;
  const t = Date.parse(header);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
}

/** values.json の Last-Modified を 1 キー分取る。判定できなければ null (呼び出し側が前回値を残す) */
async function fetchValuesLastmod(baseUrl, key) {
  const { statsR2Key } = await import("../../../packages/r2-storage/mirror/r2-keys.mjs");
  const url = `${baseUrl.replace(/\/$/, "")}/${statsR2Key(key, "prefecture")}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return toIsoDay(res.headers.get("last-modified"));
      if (res.status === 404) return null;
    } catch {
      // ネットワーク由来の失敗はリトライし、尽きたら null
    }
    await new Promise((r) => setTimeout(r, 500 * attempt));
  }
  return null;
}

/** キーごとの lastmod。取得できたものは新しい値、できなかったものは前回の値を残す */
async function buildLastmod(keys, previous) {
  const baseUrl = process.env.R2_PUBLIC_FETCH_URL;
  const result = new Map();
  let fetched = 0;
  let kept = 0;
  let missing = 0;
  const queue = [...keys];
  const worker = async () => {
    while (queue.length > 0) {
      const key = queue.shift();
      const day = baseUrl ? await fetchValuesLastmod(baseUrl, key) : null;
      if (day) {
        result.set(key, day);
        fetched++;
      } else if (previous.has(key)) {
        result.set(key, previous.get(key));
        kept++;
      } else {
        missing++;
      }
    }
  };
  await Promise.all(Array.from({ length: 16 }, worker));
  return { result, fetched, kept, missing, networked: Boolean(baseUrl) };
}

async function main() {
  const weeks = fs
    .readdirSync(SNAPSHOTS_DIR)
    .filter((d) => /^\d{4}-W\d{2}$/.test(d))
    .filter((d) => fs.existsSync(path.join(SNAPSHOTS_DIR, d, "pages.csv")))
    .sort();

  if (weeks.length === 0) {
    console.error("[build-sitemap-ranking-keys] no pages.csv snapshots found");
    process.exit(1);
  }

  const union = new Set();
  const perWeek = [];
  for (const w of weeks) {
    const csvPath = path.join(SNAPSHOTS_DIR, w, "pages.csv");
    const keys = keysFromPagesCsv(csvPath);
    perWeek.push(`${w}: ${keys.size}`);
    for (const k of keys) union.add(k);
  }

  const indexableCount = existingIndexableKeys().size;
  let addedFromIndexable = 0;
  for (const k of existingIndexableKeys()) {
    if (!union.has(k)) {
      union.add(k);
      addedFromIndexable++;
    }
  }

  // INDEXING-SITEMAP-02: 全 isActive ranking を sitemap に含める
  const knownKeys = knownRankingKeys();
  let addedFromKnown = 0;
  for (const k of knownKeys) {
    if (!union.has(k)) {
      union.add(k);
      addedFromKnown++;
    }
  }

  // GSC履歴や旧INDEXABLEに残る、現在は配信対象外のキーをsitemapへ戻さない。
  // KNOWNは active・prefecture対応・R2 item実在を満たす現在の配信集合。
  const sorted = [...union].filter((key) => knownKeys.has(key)).sort();

  const lastmod = await buildLastmod(sorted, previousLastmod());

  const header = `/**
 * SITEMAP_RANKING_KEYS — sitemap.ts /ranking 出力対象キー (自動生成・手動編集禁止)
 *
 * **生成: node .claude/scripts/gsc/build-sitemap-ranking-keys.cjs**
 *
 * 複数週 GSC impressions の和集合 + 既存 INDEXABLE_RANKING_KEYS + 全 KNOWN_RANKING_KEYS を
 * 現在の KNOWN_RANKING_KEYS で絞り込む。
 * INDEXING-SITEMAP-02: 「コンテンツ実体のある URL」= active・prefecture対応・R2実在。
 * 2026-05-05 の単一週絞り込みによる大量インデックス削除を回避する設計 (詳細はスクリプト docstring)。
 *
 * 集計週: ${weeks.join(", ")}
 *   週別 impressions>=1 キー数: ${perWeek.join(" / ")}
 * 和集合: ${sorted.length} キー (INDEXABLE +${addedFromIndexable} / KNOWN +${addedFromKnown} / INDEXABLE 総数 ${indexableCount} / KNOWN 総数 ${knownKeys.size})
 * 生成日: ${new Date().toISOString().slice(0, 10)}
 *
 * 安全弁: url-policy.ts shouldIncludeInSitemap は本セットが空の場合 KNOWN 全件に
 *         フォールバックする (生成失敗時の大量削除を防ぐ)。
 */
export const SITEMAP_RANKING_KEYS = new Set<string>([
${sorted.map((k) => `  "${k}",`).join("\n")}
]);
`;

  fs.writeFileSync(OUT_FILE, header);

  const lastmodHeader = `/**
 * SITEMAP_RANKING_LASTMOD — sitemap の /ranking の lastmod の出所 (自動生成・手動編集禁止)
 *
 * **生成: node .claude/scripts/gsc/build-sitemap-ranking-keys.cjs** (build-sitemap-ranking-keys.cjs の docstring を参照)
 *
 * key → R2 values.json の Last-Modified (UTC の日付)。差分 push は中身が同じ object を送り直さないので、
 * values.json の中身が最後に変わった日を表す。取得できなかったキーは前回の値を据え置き、前回も無ければ載せない。
 * 生成日・取得件数の行は書かない (日付が変わらない限り差分を作らないため)。
 * sitemap-ranking-keys.ts と分けているのは、あちらが middleware (Edge) の束に入るため。
 */
export const SITEMAP_RANKING_LASTMOD: ReadonlyMap<string, string> = new Map<string, string>([
${sorted.filter((k) => lastmod.result.has(k)).map((k) => `  ["${k}", "${lastmod.result.get(k)}"],`).join("\n")}
]);
`;
  fs.writeFileSync(LASTMOD_OUT_FILE, lastmodHeader);
  console.log(
    `[build-sitemap-ranking-keys] wrote ${sorted.length} keys to ${path.relative(PROJECT_ROOT, OUT_FILE)} (+ ${path.relative(PROJECT_ROOT, LASTMOD_OUT_FILE)})`,
  );
  console.log(`  weeks: ${weeks.join(", ")}`);
  console.log(`  per-week: ${perWeek.join(" / ")}`);
  console.log(`  added from INDEXABLE: ${addedFromIndexable}`);
  console.log(`  added from KNOWN (isActive): ${addedFromKnown}`);
  console.log(
    `  lastmod: fetched ${lastmod.fetched} / kept ${lastmod.kept} / missing ${lastmod.missing}` +
      (lastmod.networked ? "" : " (R2_PUBLIC_FETCH_URL 未設定のため全件前回値)"),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
