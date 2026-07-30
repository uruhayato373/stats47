#!/usr/bin/env node
/**
 * fetch-ranking-data-r2.mjs (完全DBレス版データ接地)
 *
 * ブログ記事リライトの「捏造防止の土台」。記事が参照する /ranking/<key> の観測値を
 * **R2 公開 URL から決定的に取得**し、`<base>/<slug>/data/<key>-prefecture-rankings.json`
 * (統一スキーマ + value 降順で rank 再計算) を生成する。
 *
 * 旧 `fetch-article-data.mjs` は D1 (`metrics` テーブル) 依存で DBレス環境では動かないため、
 * その置き換え。R2 read のみ (SSD/認証不要)。クラウドルーティン (blog-auto-brushup.yml) と
 * 手動 brushup の両方から使う共通土台。
 *
 * slug → rankingKey の解決:
 *   1. --keys <k1,k2> 明示指定があればそれ
 *   2. 無ければ記事 article.md 内の `/ranking/<key>` 参照 (source-link href / markdown link) を抽出
 *
 * Usage:
 *   node .claude/scripts/blog/fetch-ranking-data-r2.mjs --slug <slug> [--base <dir>] [--keys k1,k2] [--year YYYY] [--dry-run] [--digest]
 *
 * 出力:
 *   - <base>/<slug>/data/<key>-prefecture-rankings.json  (--dry-run 時は書かない)
 *   - --digest 指定時: /tmp/digest_<slug>.txt (全47県 + 地域分布。リライト agent のグラウンドトゥルース)
 *   - stdout: JSON summary { slug, keys, files, ranking: {key: {year, unit, top, bottom, ratio}} }
 *
 * exit: 0 = ok / 1 = 引数不正・記事なし / 2 = key 解決できず / 3 = R2 取得失敗
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

// ---------- CLI ----------
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const SLUG = getArg("--slug");
const BASE = getArg("--base") || "docs/21_ブログ記事原稿";
const KEYS_OVERRIDE = getArg("--keys");
const YEAR = getArg("--year");
const DRY_RUN = args.includes("--dry-run");
const WRITE_DIGEST = args.includes("--digest");
// --data-name: primary key の出力 basename を明示指定する (拡張子なし)。
//   既存記事の参照SVG名 (例: aging-solo-ranking) に合わせて復旧する用途。
//   未指定時は従来通り `<slug>-prefecture-rankings`。
const DATA_NAME = getArg("--data-name");

if (!SLUG) {
  console.error("usage: --slug <slug> [--base <dir>] [--keys k1,k2] [--year YYYY] [--dry-run] [--digest]");
  process.exit(1);
}

const articleDir = path.join(PROJECT_ROOT, BASE, SLUG);
const articlePath = fs.existsSync(path.join(articleDir, "article.md"))
  ? path.join(articleDir, "article.md")
  : path.join(articleDir, "article.mdx");
if (!fs.existsSync(articlePath)) {
  console.error(`[error] article not found: ${articlePath}`);
  process.exit(1);
}

// ---------- 地域マップ (digest の地域分布検算用) ----------
const REGION = {
  "北海道": "北海道",
  "青森県": "東北", "岩手県": "東北", "宮城県": "東北", "秋田県": "東北", "山形県": "東北", "福島県": "東北",
  "茨城県": "北関東", "栃木県": "北関東", "群馬県": "北関東",
  "埼玉県": "南関東", "千葉県": "南関東", "東京都": "南関東", "神奈川県": "南関東",
  "新潟県": "甲信越", "山梨県": "甲信越", "長野県": "甲信越",
  "富山県": "北陸", "石川県": "北陸", "福井県": "北陸",
  "岐阜県": "東海", "静岡県": "東海", "愛知県": "東海", "三重県": "東海",
  "滋賀県": "近畿", "京都府": "近畿", "大阪府": "近畿", "兵庫県": "近畿", "奈良県": "近畿", "和歌山県": "近畿",
  "鳥取県": "山陰", "島根県": "山陰", "岡山県": "山陽", "広島県": "山陽", "山口県": "山陽",
  "徳島県": "四国", "香川県": "四国", "愛媛県": "四国", "高知県": "四国",
  "福岡県": "九州", "佐賀県": "九州", "長崎県": "九州", "熊本県": "九州", "大分県": "九州", "宮崎県": "九州", "鹿児島県": "九州",
  "沖縄県": "沖縄",
};

// ---------- ranking key 解決 ----------
function resolveKeys() {
  if (KEYS_OVERRIDE) return KEYS_OVERRIDE.split(",").map((s) => s.trim()).filter(Boolean);
  const content = fs.readFileSync(articlePath, "utf8");
  const keys = new Set();
  // source-link href="/ranking/<key>" / markdown [..](/ranking/<key>) / https://stats47.jp/ranking/<key>
  const re = /\/ranking\/([a-z0-9-]+)/gi;
  let m;
  while ((m = re.exec(content)) !== null) keys.add(m[1]);
  return [...keys];
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

// ---------- 1 key 分のデータ生成 ----------
// outBaseName: 出力ファイル名 (拡張子なし)。primary ranking は <slug> で固定し、
//   チャート placeholder `<!-- chart:<slug>-prefecture-rankings -->` と確実に対応させる。
//   追加参照 key は <key> 名で factual グラウンドトゥルースとしてのみ生成 (チャートなし)。
async function buildForKey(key, outBaseName, fullName) {
  const valuesUrl = `${R2_BASE}/app/ranking/${key}/values.json`;
  const itemUrl = `${R2_BASE}/app/ranking/${key}/item.json`;
  const values = await getJson(valuesUrl);

  // item.json (表示名/単位/出典) は best-effort
  let item = {};
  try {
    const it = await getJson(itemUrl);
    item = it.item || it || {};
  } catch {
    // item が無くても values だけで生成できる
  }

  const parts = (values.partitions || []).slice().sort((a, b) => (a.yearCode > b.yearCode ? 1 : -1));
  if (parts.length === 0) throw new Error(`no partitions: ${key}`);
  const partition = YEAR
    ? parts.find((p) => String(p.yearCode) === String(YEAR)) || parts[parts.length - 1]
    : parts[parts.length - 1];

  // value 降順で rank を再計算 (R2 の rank が 0/未設定のケースに対応)
  const sorted = partition.values.slice().sort((a, b) => b.value - a.value);
  const data = sorted.map((v, i) => ({
    rank: i + 1,
    areaName: v.areaName,
    pref: v.areaName, // bar chart ラベル用
    value: v.value,
    areaCode: v.areaCode,
  }));

  const unit = item.unit || sorted[0]?.unit || "";
  const title = item.title || item.rankingName || key;
  const year = partition.yearCode;
  const payload = {
    // カード見出しは簡潔に（指標名）。年はサブタイトルへ分離し、横長/縦長とも見切れにくくする。
    title,
    subtitle: `${year}年`,
    label: title,
    unit,
    year,
    rankingKey: key,
    // ★出典名は sourceConfig.source.name。sourceConfig.name は存在しないキーで、
    //   常に undefined → 全記事が既定文言に落ちていた (2026-07-30 是正)。
    source: item.sourceConfig?.source?.name || item.source?.name || "e-Stat（政府統計の総合窓口）",
    generatedBy: "fetch-ranking-data-r2.mjs",
    data,
  };

  // 出力 basename: --data-name 明示があればそれ (既存SVG名に合わせる復旧用)、
  // 無ければ従来の `<stem>-prefecture-rankings`。
  const baseName = fullName || `${outBaseName}-prefecture-rankings`;
  const fileName = `${baseName}.json`;
  const outPath = path.join(articleDir, "data", fileName);
  const sourcePath = path.join(articleDir, "data", `${baseName}.source.json`);

  // 出典 manifest (SSOT配慮): e-Stat 生パラメータは複製しない。
  // 真実源は rankingKey → R2 app/ranking (=metric config → e-Stat → R2 派生)。
  // これさえあれば --keys <rankingKey> で同じデータを決定的に再取得できる。
  const manifest = {
    kind: "ranking",
    rankingKey: key,
    year,
    unit,
    label: title,
    transform: "all47 (svg-builder が上位5+下位5を抽出)",
    source: `r2:app/ranking/${key}/values.json`,
    upstream: "metric config (packages/data-configs) → e-Stat → R2 app/ranking",
    restore: `node .claude/scripts/blog/fetch-ranking-data-r2.mjs --slug ${SLUG} --keys ${key} --data-name ${baseName}`,
    fetchedAt: new Date().toISOString(),
    generatedBy: "fetch-ranking-data-r2.mjs",
  };

  if (!DRY_RUN) {
    fs.mkdirSync(path.join(articleDir, "data"), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
    fs.writeFileSync(sourcePath, JSON.stringify(manifest, null, 2));
  }

  const ratio = (data[0].value / data[data.length - 1].value).toFixed(1);
  return { key, year, unit, title, count: data.length, file: path.relative(PROJECT_ROOT, outPath), data, ratio };
}

// ---------- digest (リライト agent のグラウンドトゥルース) ----------
function writeDigest(results) {
  const reg = (arr) => {
    const c = {};
    arr.forEach((x) => {
      const g = REGION[x.areaName] || "?";
      c[g] = (c[g] || 0) + 1;
    });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}${v}`).join("・");
  };
  const blocks = results.map((r) => {
    const d = r.data;
    const max = d[0], min = d[d.length - 1];
    const lines = d.map((x) => `${x.rank}. ${x.areaName}(${x.areaCode}) ${x.value.toLocaleString()}${r.unit} [${REGION[x.areaName] || "?"}]`);
    return [
      `RANKING KEY: ${r.key}  (${r.title})`,
      `年: ${r.year}  単位: ${r.unit}`,
      `1位: ${max.areaName} ${max.value.toLocaleString()}${r.unit} / ${d.length}位: ${min.areaName} ${min.value.toLocaleString()}${r.unit} / 比 ${r.ratio}倍`,
      `TOP10 地域分布: ${reg(d.slice(0, 10))}`,
      `BOTTOM10 地域分布: ${reg(d.slice(-10))}`,
      ``,
      `=== 全${d.length}県 (rank. 県名(コード) 値 [地域]) ===`,
      ...lines,
    ].join("\n");
  });
  const digestPath = `/tmp/digest_${SLUG}.txt`;
  fs.writeFileSync(digestPath, blocks.join("\n\n========================================\n\n"));
  return digestPath;
}

// ---------- main ----------
const keys = resolveKeys();
if (keys.length === 0) {
  console.error(`[error] ranking key を解決できません。記事に /ranking/<key> 参照が無い場合は --keys で指定してください: ${SLUG}`);
  process.exit(2);
}

// primary ranking = slug と一致する key、無ければ最初の key。これを <slug> 名で出力しチャート対象にする。
const primaryKey = keys.includes(SLUG) ? SLUG : keys[0];

const results = [];
for (const key of keys) {
  const outBaseName = key === primaryKey ? SLUG : key;
  // --data-name は primary key のみに適用 (既存SVG名へ合わせる復旧用)。
  const fullName = DATA_NAME && key === primaryKey ? DATA_NAME : null;
  try {
    results.push(await buildForKey(key, outBaseName, fullName));
  } catch (e) {
    console.error(`[error] key=${key}: ${e.message}`);
    process.exit(3);
  }
}

let digestPath = null;
if (WRITE_DIGEST && !DRY_RUN) digestPath = writeDigest(results);

const summary = {
  slug: SLUG,
  keys,
  dryRun: DRY_RUN,
  digest: digestPath,
  ranking: Object.fromEntries(
    results.map((r) => [
      r.key,
      {
        year: r.year, unit: r.unit, count: r.count, ratioMaxMin: r.ratio,
        top: r.data.slice(0, 3).map((x) => `${x.rank}.${x.areaName} ${x.value.toLocaleString()}`),
        bottom: r.data.slice(-2).map((x) => `${x.rank}.${x.areaName} ${x.value.toLocaleString()}`),
        file: r.file,
      },
    ])
  ),
};
console.log(JSON.stringify(summary, null, 2));
process.exit(0);
