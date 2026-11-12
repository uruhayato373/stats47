#!/usr/bin/env npx tsx
/**
 * 家計調査の指標がテーマ・県ページ・ブログのどこから到達できるかを数える。
 * 出力: data/surveys/kakei-coverage.json。未到達があっても監査は失敗にしない (展開の進み具合の記録)。
 * ゴールの判定は、未到達・未判定の品目・予定の表がすべて 0 件になること。
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import { datasetDir, datasetPath } from "../../../config/datasets.mjs";
import { KNOWN_RANKING_KEYS } from "@stats47/ranking/config";
import { R2_PUBLIC_BASE_URL } from "../lib/site-config.cjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT_PATH = resolve(ROOT, datasetDir("surveys.portfolio"), "kakei-coverage.json");
const CONCURRENCY = 16;
const SAMPLE_SIZE = 20;
const PREFECTURE_COUNT = 47;

const readText = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }));
  return results;
}

async function blogLinkedKeys(keys: Set<string>): Promise<Set<string>> {
  const res = await fetch(`${R2_PUBLIC_BASE_URL}/app/blog/all.json`);
  if (!res.ok) throw new Error(`blog 一覧: HTTP ${res.status}`);
  const body = (await res.json()) as { articles?: { slug: string; published?: boolean }[] };
  const slugs = (body.articles ?? []).filter((a) => a.published).map((a) => a.slug);
  const linked = new Set<string>();
  await mapLimit(slugs, CONCURRENCY, async (slug) => {
    const article = await fetch(`${R2_PUBLIC_BASE_URL}/app/blog/${slug}/article.md`);
    if (!article.ok) return;
    for (const m of (await article.text()).matchAll(/\/ranking\/([a-z0-9-]+)/g)) {
      if (keys.has(m[1])) linked.add(m[1]);
    }
  });
  return linked;
}

/** 県ページの「全国 3 位以内の品目」に載っている指標 */
async function areaTopItemKeys(): Promise<Set<string>> {
  const codes = Array.from({ length: PREFECTURE_COUNT }, (_, i) => `${String(i + 1).padStart(2, "0")}000`);
  const found = new Set<string>();
  await mapLimit(codes, CONCURRENCY, async (code) => {
    const res = await fetch(`${R2_PUBLIC_BASE_URL}/app/areas/${code}/databook.json`);
    if (!res.ok) throw new Error(`databook ${code}: HTTP ${res.status}`);
    const body = (await res.json()) as { kakeiTopItems?: { rankingKey: string }[] };
    for (const item of body.kakeiTopItems ?? []) found.add(item.rankingKey);
  });
  return found;
}

async function main(): Promise<void> {
  const metrics = Object.values(METRICS_REGISTRY).filter((m) => m.isActive !== false && m.source.kind === "kakei-chousa");
  const keys = new Set(metrics.map((m) => m.key));
  const known = new Set<string>(KNOWN_RANKING_KEYS);
  const catalogs = readdirSync(resolve(ROOT, datasetDir("themes.catalogs")))
    .filter((f) => f.endsWith(".json"))
    .map((f) => readText(`${datasetDir("themes.catalogs")}/${f}`));
  const directory = readText("apps/web/src/features/theme-dashboard/lib/kakei-ranking-directory.generated.ts");
  const areaTemplate = readText(datasetPath("areas.databook-template"));
  const [blog, areaTopItems] = await Promise.all([blogLinkedKeys(keys), areaTopItemKeys()]);

  const rows = metrics.map((m) => ({
    key: m.key,
    ranking: known.has(m.key),
    theme: catalogs.some((text) => text.includes(`"${m.key}"`)) || directory.includes(`"${m.key}"`),
    area: areaTemplate.includes(`"${m.key}"`) || areaTopItems.has(m.key),
    blog: blog.has(m.key),
  }));
  const unreached = rows.filter((r) => !r.theme && !r.area && !r.blog).map((r) => r.key);

  const ledger = JSON.parse(readText(datasetPath("estat.kakei-ledger"))) as {
    summary: { tablesByStatus: Record<string, number> };
    items: { status: string }[];
  };
  const summary = {
    metrics: rows.length,
    ranking: rows.filter((r) => r.ranking).length,
    theme: rows.filter((r) => r.theme).length,
    area: rows.filter((r) => r.area).length,
    blog: rows.filter((r) => r.blog).length,
    unreached: unreached.length,
    undecidedItems: ledger.items.filter((i) => i.status === "undecided" || i.status === "planned").length,
    plannedTables: ledger.summary.tablesByStatus.planned ?? 0,
  };
  const complete = summary.unreached === 0 && summary.undecidedItems === 0 && summary.plannedTables === 0;

  writeFileSync(OUT_PATH, `${JSON.stringify({ complete, summary, unreachedSample: unreached.slice(0, SAMPLE_SIZE), rows }, null, 2)}\n`);
  console.log(JSON.stringify({ complete, ...summary }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
