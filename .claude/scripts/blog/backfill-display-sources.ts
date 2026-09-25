/**
 * backfill-display-sources — 出典を導出できない公開記事の chart source.json に displaySources を足す
 *
 * GIS 派生 (国土地理院の地名情報等) や manual の図は、source.json に統計調査への参照が無く、
 * 記事末尾「データ出典」(`DataSourceList`) を出せない。置換表
 * `.claude/scripts/blog/data/display-sources-backfill.json` の displaySources を、その記事の
 * 全 chart source.json に書き足す (既に displaySources を持つ図は変更しない)。
 *
 * 出力: `.local/blog-datasource-fix/out/<slug>/data/<base>.source.json` (+ 原本を `_src/` に保存)
 * R2 反映は本文と同じ `push-article-md-r2.ts --src .local/blog-datasource-fix/out` で行う。
 *
 * 使い方:
 *   npx tsx .claude/scripts/blog/backfill-display-sources.ts          # dry-run
 *   npx tsx .claude/scripts/blog/backfill-display-sources.ts --apply
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..", "..", "..");
const R2_BASE = (process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp").replace(/\/+$/, "");
const TABLE = path.join(ROOT, ".claude/scripts/blog/data/display-sources-backfill.json");
const WORK_DIR = path.join(ROOT, ".local/blog-datasource-fix");
const APPLY = process.argv.includes("--apply");

interface BackfillTable {
  articles: Record<string, { displaySources: unknown[] }>;
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

async function main(): Promise<void> {
  const table = JSON.parse(fs.readFileSync(TABLE, "utf8")) as BackfillTable;
  let written = 0;
  for (const [slug, { displaySources }] of Object.entries(table.articles)) {
    const content = await fetchText(`${R2_BASE}/app/blog/${slug}/article.md`);
    for (const base of chartBases(content)) {
      const key = `data/${base}.source.json`;
      const original = await fetchText(`${R2_BASE}/app/blog/${slug}/${key}`);
      const source = JSON.parse(original) as Record<string, unknown>;
      if (source.kind === "authored" || Array.isArray(source.displaySources)) continue;
      const next = `${JSON.stringify({ ...source, displaySources }, null, 2)}\n`;
      written++;
      console.log(`  ${slug}/${key}`);
      if (!APPLY) continue;
      writeFile(path.join(WORK_DIR, "_src", slug, key), original);
      writeFile(path.join(WORK_DIR, "out", slug, key), next);
    }
  }
  console.log(`${written} 件の source.json に displaySources を${APPLY ? "書き足しました" : "書き足します (dry-run)"}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
