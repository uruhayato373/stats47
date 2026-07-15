#!/usr/bin/env node
/**
 * note-catalog を既存の真実源からブートストラップする一回限りの移行スクリプト。
 *
 * 入力 (既存の真実源・捏造しない):
 *   .claude/state/note-published-urls.json  (公開済み 203 件: vertical/title/url/is_paid/published_at/r2_path/price_jpy)
 *   .claude/state/note-draft-index.json      (未公開ドラフト 37 件: vertical/r2_path/status)
 * 出力:
 *   .claude/scripts/note/catalog/data/<vertical>.ts  (NoteArticle[] の git TS。以後これが SSOT)
 *
 * 実行後は data/*.ts が SSOT。以降 note-published-urls.json は generate-note-catalog.ts が
 * カタログから再生成する派生物になる。
 *
 * Usage: node .claude/scripts/note/catalog/bootstrap-from-indices.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../../..");
const DRY = process.argv.includes("--dry-run");

const pub = JSON.parse(
  readFileSync(join(ROOT, ".claude/state/note-published-urls.json"), "utf8"),
);
const drafts = JSON.parse(
  readFileSync(join(ROOT, ".claude/state/note-draft-index.json"), "utf8"),
);

/** vertical → 既定マガジン (koumuin 系は既存フッター運用でシリーズ = 1 マガジン) */
const DEFAULT_MAGAZINE = {
  "koumuin-claude-code": "koumuin-claude-code",
  "koumuin-estat-claude-code": "koumuin-estat-claude-code",
  "koumuin-gis": "koumuin-gis",
  // stats47-note / membership は編集で割り当てるため null
};

/** stats47-note のシリーズを key 接頭辞から推定 (A/B/C/D)。既定は A (ランキング量産系) */
function inferSeries(vertical, key) {
  if (vertical !== "stats47-note") return undefined;
  const m = key.match(/^([A-Da-d])-/);
  return m ? m[1].toUpperCase() : "A";
}

// key → NoteArticle。published を優先、draft で未公開を補完
const byKey = new Map();

for (const [key, v] of Object.entries(pub.articles || {})) {
  if (key.startsWith("_")) continue; // コメント行
  if (!v || !v.vertical) continue;
  const vertical = v.vertical;
  const art = {
    key,
    vertical,
    series: inferSeries(vertical, key),
    title: v.title || key,
    magazine: DEFAULT_MAGAZINE[vertical] ?? null,
    isPaid: !!v.is_paid,
    priceJpy: v.price_jpy != null ? Number(v.price_jpy) : undefined,
    status: v.url ? "published" : "draft",
    noteUrl: v.url || undefined,
    publishedAt: v.published_at || undefined,
    r2Path: v.r2_path || `note/${vertical}/${key}`,
    stats47Targets: undefined, // 送客先は編集で追記 (index に無い)
  };
  byKey.set(key, art);
}

for (const [key, v] of Object.entries(drafts.drafts || {})) {
  if (!v || !v.vertical) continue;
  if (byKey.has(key)) continue; // published 側を優先
  const vertical = v.vertical;
  byKey.set(key, {
    key,
    vertical,
    series: inferSeries(vertical, key),
    title: key,
    magazine: DEFAULT_MAGAZINE[vertical] ?? null,
    isPaid: false,
    priceJpy: undefined,
    status: "draft",
    noteUrl: undefined,
    publishedAt: undefined,
    r2Path: v.r2_path || `note/${vertical}/${key}`,
    stats47Targets: undefined,
  });
}

// vertical でグループ化
const byVertical = new Map();
for (const art of byKey.values()) {
  if (!byVertical.has(art.vertical)) byVertical.set(art.vertical, []);
  byVertical.get(art.vertical).push(art);
}

const IDENT = {
  "stats47-note": "stats47NoteArticles",
  "koumuin-claude-code": "koumuinClaudeCodeArticles",
  "koumuin-estat-claude-code": "koumuinEstatClaudeCodeArticles",
  "koumuin-gis": "koumuinGisArticles",
  membership: "membershipArticles",
};

function emitEntry(a) {
  const lines = [];
  lines.push(`  {`);
  lines.push(`    key: ${JSON.stringify(a.key)},`);
  lines.push(`    vertical: ${JSON.stringify(a.vertical)},`);
  if (a.series) lines.push(`    series: ${JSON.stringify(a.series)},`);
  lines.push(`    title: ${JSON.stringify(a.title)},`);
  lines.push(`    magazine: ${a.magazine === null ? "null" : JSON.stringify(a.magazine)},`);
  lines.push(`    isPaid: ${a.isPaid},`);
  if (a.priceJpy != null && !Number.isNaN(a.priceJpy) && a.priceJpy > 0)
    lines.push(`    priceJpy: ${a.priceJpy},`);
  lines.push(`    status: ${JSON.stringify(a.status)},`);
  if (a.noteUrl) lines.push(`    noteUrl: ${JSON.stringify(a.noteUrl)},`);
  if (a.publishedAt) lines.push(`    publishedAt: ${JSON.stringify(a.publishedAt)},`);
  lines.push(`    r2Path: ${JSON.stringify(a.r2Path)},`);
  lines.push(`  },`);
  return lines.join("\n");
}

const dataDir = join(__dirname, "data");
if (!DRY) mkdirSync(dataDir, { recursive: true });

const summary = [];
for (const [vertical, arts] of byVertical) {
  arts.sort((a, b) => a.key.localeCompare(b.key));
  const ident = IDENT[vertical] || vertical.replace(/[^a-z]/gi, "") + "Articles";
  const body = arts.map(emitEntry).join("\n");
  const ts = `/**
 * note-catalog データ: ${vertical} (${arts.length} 件)
 *
 * ⚠️ このファイルが SSOT。手編集してよいのは editorial メタ (magazine / series /
 * stats47Targets / title) のみ。派生インデックス note-published-urls.json は
 * generate-note-catalog.ts で再生成する (手編集しない)。
 *
 * 初版は bootstrap-from-indices.mjs が既存インデックスから生成。
 */
import type { NoteArticle } from "../types";

export const ${ident}: NoteArticle[] = [
${body}
];
`;
  const outPath = join(dataDir, `${vertical}.ts`);
  if (!DRY) writeFileSync(outPath, ts, "utf8");
  summary.push(`${vertical}: ${arts.length} 件 → data/${vertical}.ts`);
}

console.log(`=== note-catalog bootstrap ${DRY ? "(dry-run)" : ""} ===`);
console.log(`総記事: ${byKey.size} 件`);
for (const s of summary) console.log("  " + s);
if (DRY) console.log("\n本番: node .claude/scripts/note/catalog/bootstrap-from-indices.mjs");
