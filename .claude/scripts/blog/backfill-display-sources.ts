/**
 * backfill-display-sources — 公開記事の chart source.json に、出典の項目を書き足す
 *
 * 1. displaySources: GIS 派生 (国土地理院の地名情報等) や manual の図は、source.json に統計調査への参照が無く、
 *    記事末尾「データ出典」(`DataSourceList`) を出せない。置換表の記事ごとの displaySources を、その記事の
 *    全 chart source.json に書き足す (既に displaySources を持つ図は変更しない)。
 * 2. charts.<base>.add: 図ごとに、調査の紐付けに要る項目 (statsDataIds・surveyScope など) を書き足す
 *    (2026-11-14 追加)。足すだけで、既にある項目は上書きしない (同じ値なら何もしない。違う値なら止める)。
 *
 * 置換表: `.claude/scripts/blog/data/display-sources-backfill.json`
 * 出力: `.local/blog-datasource-fix/out/<slug>/data/<base>.source.json` (+ 原本を `_src/` に保存)
 * R2 反映は本文と同じ `push-article-md-r2.ts --src .local/blog-datasource-fix/out` で行う。
 *
 * 使い方:
 *   npx tsx .claude/scripts/blog/backfill-display-sources.ts          # dry-run
 *   npx tsx .claude/scripts/blog/backfill-display-sources.ts --apply
 */
import * as fs from "fs";
import * as path from "path";
import { R2_PUBLIC_BASE_URL } from "../lib/site-config.cjs";

const ROOT = path.resolve(__dirname, "..", "..", "..");
const R2_BASE = (process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL).replace(/\/+$/, "");
const TABLE = path.join(ROOT, ".claude/scripts/blog/data/display-sources-backfill.json");
const WORK_DIR = path.join(ROOT, ".local/blog-datasource-fix");
const APPLY = process.argv.includes("--apply");

interface ArticleEntry {
  displaySources?: unknown[];
  /** 図ごとに書き足す項目。key は図の base 名 (data/<base>.svg) */
  charts?: Record<string, { add: Record<string, unknown> }>;
}
interface BackfillTable {
  articles: Record<string, ArticleEntry>;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

function chartBases(content: string): string[] {
  return [...new Set([...content.matchAll(/\]\(data\/([^)]+?)\.svg(?:[?#][^)]*)?\)/g)].map((m) => m[1]))];
}

function writeFile(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

/** 書き足す項目のうち、まだ無いものだけを返す。既にあって値が違うものは止める (正本を黙って上書きしない) */
export function missingFields(source: Record<string, unknown>, add: Record<string, unknown>, where: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(add)) {
    if (!(key in source)) out[key] = value;
    else if (JSON.stringify(source[key]) !== JSON.stringify(value)) {
      throw new Error(`${where}: ${key} が既にあり、値が違う (既存 ${JSON.stringify(source[key])})`);
    }
  }
  return out;
}

async function main(): Promise<void> {
  const table = JSON.parse(fs.readFileSync(TABLE, "utf8")) as BackfillTable;
  let written = 0;
  for (const [slug, entry] of Object.entries(table.articles)) {
    const content = await fetchText(`${R2_BASE}/app/blog/${slug}/article.md`);
    const bases = chartBases(content);
    for (const base of Object.keys(entry.charts ?? {})) {
      if (!bases.includes(base)) throw new Error(`${slug}: 本文に図 ${base} が無い`);
    }
    for (const base of bases) {
      const key = `data/${base}.source.json`;
      const original = await fetchText(`${R2_BASE}/app/blog/${slug}/${key}`);
      const source = JSON.parse(original) as Record<string, unknown>;
      let next = source;
      if (entry.displaySources && source.kind !== "authored" && !Array.isArray(source.displaySources)) {
        next = { ...next, displaySources: entry.displaySources };
      }
      const add = entry.charts?.[base]?.add;
      if (add) next = { ...next, ...missingFields(next, add, `${slug}/${key}`) };
      if (JSON.stringify(next) === JSON.stringify(source)) continue;
      written++;
      const changed = Object.keys(next).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(source[k]));
      console.log(`  ${slug}/${key}  足す項目: ${changed.join(", ")}`);
      if (!APPLY) continue;
      writeFile(path.join(WORK_DIR, "_src", slug, key), original);
      writeFile(path.join(WORK_DIR, "out", slug, key), `${JSON.stringify(next, null, 2)}\n`);
    }
  }
  console.log(`${written} 件の source.json に項目を${APPLY ? "書き足しました" : "書き足します (dry-run)"}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
