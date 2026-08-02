#!/usr/bin/env -S npx tsx
/**
 * rerender-scatter-canonical.mts — scatter カタログの正方形・単色統一 (720×720)。
 *
 * 既存の検証済み scatter json (status=both) から、svg-builder の generateScatterSvg(W=720,H=720 固定)
 * で SVG を再描画し、横長キャンバスと地域色分けを是正する。値 (points) は変えない。
 * generate-article-charts の genScatterChartSvg アダプタを再現する。
 *
 * - 生成結果と同一の SVG はスキップ (no-op)。
 * - title/xLabel/yLabel/xUnit/yUnit は json から継承。
 *
 * 出力: staging .local/r2/app/blog/<slug>/data/<base>.svg (json/source.json は不変)
 * R2 反映: push-r2-wrangler.ts app/blog --apply
 *
 *   npx tsx .claude/scripts/blog/rerender-scatter-canonical.mts --probe-only
 *   npx tsx .claude/scripts/blog/rerender-scatter-canonical.mts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateScatterSvg } from "../../../packages/svg-builder/src/charts/scatter.ts";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const STAGE = path.join(PROJECT_ROOT, ".local/r2/app/blog");
const args = process.argv.slice(2);
const PROBE_ONLY = args.includes("--probe-only");
const BASE_ARG = (() => { const i = args.indexOf("--base"); return i >= 0 ? args[i + 1] : null; })();

async function fj(u: string): Promise<any> { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }
async function ft(u: string): Promise<string> { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }
function viewBoxOf(svg: string): string { const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/); return m ? `${m[1]}x${m[2]}` : "?"; }

/** scatter json → generateScatterSvg (genScatterChartSvg と同等) */
function renderScatter(data: any): string {
  const title = data.title ?? "散布図";
  const xLabel = data.xLabel ?? "X";
  const yLabel = data.yLabel ?? "Y";
  const raw = data.points || data.data || [];
  const points = raw
    .filter((p: any) => typeof p.x === "number" && typeof p.y === "number")
    .map((p: any) => ({ name: p.label || p.pref || p.areaName || "", code: p.code || "", x: p.x, y: p.y }));
  if (!points.length) return "";
  return generateScatterSvg(points, {
    title,
    xLabel: data.xUnit ? `${xLabel}（${data.xUnit}）` : xLabel,
    yLabel: data.yUnit ? `${yLabel}（${data.yUnit}）` : yLabel,
  });
}

function loadTargets(): { slug: string; base: string }[] {
  const q = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, ".claude/state/blog/svg-lineage-queue.json"), "utf8"));
  let entries = q.entries.filter((e: any) => e.status === "both" && e.chartType === "scatter").map((e: any) => ({ slug: e.slug, base: e.base }));
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
  console.error(`[rerender-scatter] ${targets.length} both-scatter を ${PROBE_ONLY ? "probe" : "再描画"}`);
  const results = await pMap(targets, async (t) => {
    const rec: any = { slug: t.slug, base: t.base };
    let json: any;
    try { json = await fj(`${R2}/app/blog/${t.slug}/data/${t.base}.json`); } catch (e: any) { rec.result = "json-fail"; rec.err = String(e.message || e); return rec; }
    let oldSvg = ""; try { oldSvg = await ft(`${R2}/app/blog/${t.slug}/data/${t.base}.svg?cb=${PROJECT_ROOT.length}`); } catch {}
    rec.oldSize = oldSvg ? viewBoxOf(oldSvg) : "none";
    const newSvg = renderScatter(json);
    if (!newSvg) { rec.result = "empty"; return rec; }
    rec.newSize = viewBoxOf(newSvg);
    if (oldSvg === newSvg) { rec.result = "already-canonical"; return rec; }
    rec.result = "rerender";
    if (!PROBE_ONLY) {
      const dir = path.join(STAGE, t.slug, "data");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${t.base}.svg`), newSvg);
    }
    return rec;
  }, 4);
  const by: Record<string, number> = {};
  for (const r of results) by[r.result] = (by[r.result] || 0) + 1;
  console.error(`[rerender-scatter] ${JSON.stringify(by)}`);
  const changed = results.filter((r) => r.result === "rerender");
  if (changed.length) console.error("再描画:", changed.map((r) => `${r.oldSize}→${r.newSize} ${r.base}`).join("\n  "));
  console.log(JSON.stringify({ by, total: results.length, probeOnly: PROBE_ONLY }));
}
main();
