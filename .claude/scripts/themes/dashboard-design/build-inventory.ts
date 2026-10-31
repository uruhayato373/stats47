/**
 * テーマの章と見せ方の一括設計の入力: 全テーマの指標ごとに、R2 の都道府県の観測から年の数・期間・単位を数える。
 * 出力 .local/theme-design/inventory.json を ask-notebooklm.mjs (設計案の依頼) と apply-design.ts (機械の検査) が読む。
 *
 * 使い方: npx tsx .claude/scripts/themes/dashboard-design/build-inventory.ts
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { getMetricConfig } from "@stats47/data-configs";

import { datasetDir } from "../../../../config/datasets.mjs";
import { statsR2Key } from "@stats47/stats-r2/types";
import { SITE } from "@stats47/types";

const PROJECT_ROOT = resolve(__dirname, "../../../..");
const DIR = resolve(PROJECT_ROOT, datasetDir("themes.catalogs"));
const OUT_DIR = resolve(PROJECT_ROOT, ".local/theme-design");

const out: Record<string, unknown> = {};
const cache = new Map<string, unknown>();
async function stats(key: string) {
  if (cache.has(key)) return cache.get(key);
  let r: unknown = null;
  try {
    const res = await fetch(`${SITE.r2PublicBaseUrl}/${statsR2Key(key, "prefecture")}`);
    if (res.ok) {
      const p = (await res.json()) as { rows: { yearCode?: string; year?: string; unit?: string; areaCode: string }[]; meta: { yearRange: [string, string] | null; areaCount: number } };
      const years = new Set(p.rows.map((x) => String(x.yearCode ?? x.year ?? "")));
      const units = new Set(p.rows.map((x) => x.unit ?? ""));
      r = { years: years.size, range: p.meta.yearRange, units: [...units].slice(0, 2), areas: p.meta.areaCount };
    } else r = { http: res.status };
  } catch (e) { r = { err: String(e).slice(0, 80) }; }
  cache.set(key, r);
  return r;
}
async function main() {
const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
const keys = new Set<string>();
const cats: Record<string, any> = {};
for (const f of files) {
  const c = JSON.parse(readFileSync(resolve(DIR, f), "utf8"));
  cats[c.key] = c;
  for (const m of c.metrics) keys.add(m.rankingKey);
}
const list = [...keys];
const metricInfo: Record<string, unknown> = {};
for (let i = 0; i < list.length; i += 16) {
  await Promise.all(list.slice(i, i + 16).map(async (k) => {
    const cfg = getMetricConfig(k) as any;
    metricInfo[k] = { title: cfg?.title ?? cfg?.name, unit: cfg?.unit, ...(await stats(k) as object) };
  }));
}
for (const [key, c] of Object.entries(cats)) {
  out[key] = {
    title: c.title,
    sections: (c.sections ?? []).map((s: any) => ({ key: s.key, title: s.title, groups: s.metricGroupKeys, charts: s.chartKeys, embedded: s.embeddedSectionKeys })),
    groups: (c.metricGroups ?? []).map((g: any) => ({ key: g.key, title: g.title, keys: g.rankingKeys })),
    charts: (c.charts ?? []).map((ch: any) => ({ key: ch.componentKey, type: ch.componentType, title: ch.title, refs: (ch.componentProps?.seriesRefs ?? ch.componentProps?.columnSeriesRefs ?? []).map((r: any) => r.metricKey) })),
    metrics: c.metrics.map((m: any) => ({ k: m.rankingKey, l: m.shortLabel, r: m.role })),
  };
}
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, "inventory.json"), JSON.stringify({ themes: out, metricInfo }, null, 1));
console.log(Object.keys(out).length, "themes", list.length, "metrics");
}

void main();
