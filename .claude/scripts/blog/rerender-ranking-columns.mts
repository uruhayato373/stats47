#!/usr/bin/env -S npx tsx
/**
 * rerender-ranking-columns.mts — ranking カタログのサイズ統一。
 *
 * 既存の検証済み ranking json (status=both = json+source.json あり) から、**正規の
 * 960×404 columns カード** を直接再描画して非正規サイズの SVG を是正する。
 * generate-article-charts の経路 (article.mdx 依存 + データ形状でサイズが変わる) を避け、
 * svg-builder の generateBarChartSvg(layout:"columns") を json から直接呼ぶ。
 *
 * - データ = 既存 json (SSOT照合済み)。値は変えない。**サイズ/形式のみ正規化**。
 * - 既に columns(幅960) の SVG はスキップ (no-op)。
 * - title/subtitle/unit/source は json から継承。palette は json になければ既定 (red/blue)。
 *
 * 出力: staging .local/r2/app/blog/<slug>/data/<base>.svg (json/source.json は不変)
 * R2 反映: push-r2-wrangler.ts app/blog --apply
 *
 *   npx tsx .claude/scripts/blog/rerender-ranking-columns.mts --probe-only
 *   npx tsx .claude/scripts/blog/rerender-ranking-columns.mts            # staging 書込
 *   npx tsx .claude/scripts/blog/rerender-ranking-columns.mts --base slug/base
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateBarChartSvg } from "../../../packages/svg-builder/src/charts/bar-chart.ts";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const STAGE = path.join(PROJECT_ROOT, ".local/r2/app/blog");
const args = process.argv.slice(2);
const PROBE_ONLY = args.includes("--probe-only");
const BASE_ARG = (() => { const i = args.indexOf("--base"); return i >= 0 ? args[i + 1] : null; })();

async function fj(u: string): Promise<any> { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }
async function ft(u: string): Promise<string> { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }

function rawName(it: any): string { return it.name ?? it.areaName ?? it.pref ?? it.label ?? ""; }

/** generate-article-charts の genBarChartSvg と同等: json → 上位5+下位5 columns SVG */
function renderColumns(json: any): string {
  const items: any[] = Array.isArray(json) ? json : (json.data || []);
  if (!items.length) return "";
  const title = (Array.isArray(json) ? null : json.title) ?? "都道府県別ランキング";
  const subtitle = (Array.isArray(json) ? null : json.subtitle) ?? undefined;
  const source = (Array.isArray(json) ? null : json.source) ?? undefined;
  const unit = (Array.isArray(json) ? null : json.unit) ?? "";
  const palette = (Array.isArray(json) ? null : json.palette) ?? "red";
  const rightPalette = (Array.isArray(json) ? null : json.rightPalette) ?? "blue";
  const N = Math.min(5, Math.floor(items.length / 2) || 1);
  const sorted = [...items].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const top = sorted.slice(0, N);
  const bottom = sorted.slice(-N); // 降順末尾 = 下位を昇順ランクで (reverse しない: rank整合)
  const barItems = [
    ...top.map((it, i) => ({ label: `${i + 1}位 ${rawName(it)}`, name: rawName(it), rank: i + 1, value: it.value ?? 0 })),
    { label: "…", value: 0, isSeparator: true },
    ...bottom.map((it, i) => ({ label: `${sorted.length - N + i + 1}位 ${rawName(it)}`, name: rawName(it), rank: sorted.length - N + i + 1, value: it.value ?? 0 })),
  ];
  return generateBarChartSvg(barItems as any, { title, subtitle, source, unit, palette, rightPalette, layout: "columns" } as any);
}

function viewBoxOf(svg: string): string {
  const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  return m ? `${m[1]}x${m[2]}` : "?";
}

function loadTargets(): { slug: string; base: string }[] {
  const q = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, ".claude/state/blog/svg-lineage-queue.json"), "utf8"));
  let entries = q.entries.filter((e: any) => e.status === "both" && e.chartType === "ranking").map((e: any) => ({ slug: e.slug, base: e.base }));
  if (BASE_ARG) { const [s, b] = BASE_ARG.split("/"); entries = entries.filter((e: any) => e.slug === s && e.base === b); }
  return entries;
}

async function pMap<T, R>(items: T[], fn: (t: T) => Promise<R>, c: number): Promise<R[]> {
  const out: R[] = []; let i = 0;
  const w = async () => { while (i < items.length) { const k = i++; try { out[k] = await fn(items[k]); } catch (e: any) { out[k] = { error: String(e.message || e) } as any; } } };
  await Promise.all(Array.from({ length: Math.min(c, items.length) }, w));
  return out;
}

async function main() {
  const targets = loadTargets();
  console.error(`[rerender-ranking] ${targets.length} both-ranking を ${PROBE_ONLY ? "probe" : "再描画"}`);
  const results = await pMap(targets, async (t) => {
    const rec: any = { slug: t.slug, base: t.base };
    let json: any, oldSvg: string;
    try { json = await fj(`${R2}/app/blog/${t.slug}/data/${t.base}.json`); } catch (e: any) { rec.result = "json-fail"; return rec; }
    try { oldSvg = await ft(`${R2}/app/blog/${t.slug}/data/${t.base}.svg`); } catch { oldSvg = ""; }
    rec.oldSize = oldSvg ? viewBoxOf(oldSvg) : "none";
    const newSvg = renderColumns(json);
    if (!newSvg) { rec.result = "empty"; return rec; }
    rec.newSize = viewBoxOf(newSvg);
    // 既に columns(幅960)で同サイズなら no-op
    if (rec.oldSize === rec.newSize && rec.oldSize.startsWith("960x")) { rec.result = "already-canonical"; return rec; }
    rec.result = "rerender";
    if (!PROBE_ONLY) {
      const dir = path.join(STAGE, t.slug, "data");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${t.base}.svg`), newSvg);
    }
    return rec;
  }, 16);

  const by: Record<string, number> = {};
  for (const r of results) by[r.result] = (by[r.result] || 0) + 1;
  console.error(`\n[rerender-ranking] ${JSON.stringify(by)}`);
  // 再描画対象の old→new サイズ分布
  const changed = results.filter((r) => r.result === "rerender");
  const sizeShift: Record<string, number> = {};
  for (const r of changed) { const k = `${r.oldSize}→${r.newSize}`; sizeShift[k] = (sizeShift[k] || 0) + 1; }
  console.error("size shift:", JSON.stringify(sizeShift));
  fs.writeFileSync("/tmp/rerender-ranking-results.json", JSON.stringify({ by, results }, null, 2));
  console.log(JSON.stringify({ by, total: results.length, probeOnly: PROBE_ONLY }));
}
main();
