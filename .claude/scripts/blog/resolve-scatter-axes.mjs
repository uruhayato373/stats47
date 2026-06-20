#!/usr/bin/env node
/**
 * resolve-scatter-axes.mjs — scatter の x/y 軸を SSOT key へ明示対応づけし、値照合(≥0.95)で
 * 確定した時だけ kind:scatter の source.json を書く (1画像=1設定ファイルの徹底, §1.7)。
 *
 * backfill-source.mjs の自動照合(記事リンクkeyのみ)で当たらなかった scatter を、
 * axis ラベルから all.json を名前検索して見つけた候補keyを CONFIG に明示し、決定的に検証する。
 *   - points[{x,y,label}] でも独自スキーマ({areaName,fiscalIndex,...}) でも field 指定で対応
 *   - 各 key 軸を SSOT(app/ranking) と照合し ≥0.95 のときだけ採用 (捏造防止)
 *   - derived 軸 (記事 label/note に式あり) は formula を記録 (値照合しない)
 * 出力: staging .local/r2/app/blog/<slug>/data/<base>.source.json
 * R2 反映: push-r2-wrangler.ts app/blog --apply
 * 正典: blog-data-schema.md §1.7 / §1.5
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const STAGE = path.join(PROJECT_ROOT, ".local/r2/app/blog");

// axis: { field, key }            → SSOT key を値照合して採用
//       { field, derived }        → 記事に式あり。値照合せず formula を記録
const CONFIG = [
  { slug: "housing-cost-livability-trend", base: "rent-floorarea-scatter",
    x: { field: "x", key: "private-rental-housing-rent-per-3-3m2" },
    y: { field: "y", key: "floor-area-per-dwelling-owner" } },
  { slug: "fertility-fiscal-nexus", base: "fiscal-fertility-scatter",
    x: { field: "fiscalIndex", key: "fiscal-strength-index-prefecture" },
    y: { field: "fertilityRate", key: "total-fertility-rate" } },
  { slug: "unemployment-tertiary-industry-link", base: "tertiary-unemployment-scatter",
    x: { field: "tertiaryRatio", key: "employed-people-ratio-tertiary" },
    y: { field: "unemploymentRate", key: "unemployment-rate" } },
];

// flat 単一指標ランキング: 記事リンク外の既存 key に scale(json値×scale=SSOT値) を掛けて照合。
// 派生に見えて実は raw key のスケール/切り出しだったケース (例: 平均給与月額 万円 = avg-salary ÷10000)。
const FLAT_CONFIG = [
  { slug: "prefecture-salary-remote-gap", base: "prefecture-salary-remote-gap-prefecture-rankings",
    key: "avg-salary-all-prefecture", scale: 10000, label: "平均給与月額", unit: "万円" },
];

async function fj(u) { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }

/** scatter json → 指定 field の {areaName/label → 値} マップ (points 配列 or 県別配列 両対応) */
function axisMap(json, field) {
  const arr = Array.isArray(json) ? json : (json.points || json.values || json.data || []);
  const m = new Map();
  for (const it of arr) {
    const name = it.label ?? it.areaName ?? it.name;
    if (name != null && it[field] != null) m.set(name, Number(it[field]));
  }
  return m;
}
async function ssotPartitions(key) {
  const v = await fj(`${R2}/app/ranking/${key}/values.json`);
  return (v.partitions || []).map((p) => ({ year: p.yearCode, values: p.values }));
}
function matchRate(jsonMap, ssotVals) {
  let ok = 0, n = 0;
  for (const v of ssotVals) {
    const jv = jsonMap.get(v.areaName) ?? jsonMap.get(v.areaName.replace(/[都道府県]$/, ""));
    if (jv == null) continue;
    n++;
    if (Math.abs(v.value - jv) <= Math.max(0.15, Math.abs(v.value) * 0.02)) ok++;
  }
  return n >= 3 ? ok / n : 0;
}
/** axis (key 指定) を SSOT と照合し {key,year,rate}; derived は {derived} を返す */
async function resolveAxis(json, axis) {
  if (axis.derived) return { derived: axis.derived, field: axis.field };
  const m = axisMap(json, axis.field);
  if (m.size < 3) return { field: axis.field, error: `field '${axis.field}' のマップが ${m.size} 件` };
  let best = null;
  // partition は年昇順。同率なら最新年を採用 (>=) し、restore が誤年を引かないようにする
  for (const p of await ssotPartitions(axis.key)) {
    const rate = matchRate(m, p.values);
    if (!best || rate >= best.rate) best = { key: axis.key, year: p.year, rate };
  }
  return { ...best, field: axis.field };
}

async function main() {
  const VERIFY_MIN = 0.95;
  for (const c of CONFIG) {
    let json;
    try { json = await fj(`${R2}/app/blog/${c.slug}/data/${c.base}.json`); }
    catch (e) { console.log(`✗ ${c.slug}/${c.base}: json取得失敗 ${e.message}`); continue; }
    const rx = await resolveAxis(json, c.x);
    const ry = await resolveAxis(json, c.y);
    const okX = rx.derived || (rx.rate != null && rx.rate >= VERIFY_MIN);
    const okY = ry.derived || (ry.rate != null && ry.rate >= VERIFY_MIN);
    const fmtRate = (r) => (r.derived ? "derived" : `${Math.round((r.rate ?? 0) * 100)}%`);
    if (!okX || !okY) {
      console.log(`✗ ${c.base}: x=${fmtRate(rx)}(${c.x.key ?? "derived"}) y=${fmtRate(ry)}(${c.y.key ?? "derived"}) — 採用せず`);
      continue;
    }
    const year = rx.year || ry.year;
    const manifest = {
      kind: "scatter",
      xKey: c.x.key, yKey: c.y.key,
      ...(rx.derived ? { xDerived: rx.derived } : {}),
      ...(ry.derived ? { yDerived: ry.derived } : {}),
      year,
      source: [c.x.key && `r2:app/ranking/${c.x.key}/values.json`, c.y.key && `r2:app/ranking/${c.y.key}/values.json`].filter(Boolean),
      upstream: "metric config → e-Stat → R2 app/ranking (x軸/y軸の2指標)",
      verifiedMatchRate: Math.round(Math.min(rx.derived ? 1 : rx.rate, ry.derived ? 1 : ry.rate) * 100),
      generatedBy: "resolve-scatter-axes.mjs",
      note: "scatter軸不足: axisラベルから候補keyを名前検索しSSOT値照合で確定",
    };
    const dir = path.join(STAGE, c.slug, "data");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${c.base}.source.json`), JSON.stringify(manifest, null, 2));
    console.log(`✓ ${c.base}: x=${fmtRate(rx)}(${c.x.key}) y=${fmtRate(ry)}(${c.y.key}) year=${year} → 書込`);
  }

  // flat 単一指標 (scale 対応)
  for (const c of FLAT_CONFIG) {
    let json;
    try { json = await fj(`${R2}/app/blog/${c.slug}/data/${c.base}.json`); }
    catch (e) { console.log(`✗ ${c.slug}/${c.base}: json取得失敗`); continue; }
    const arr = Array.isArray(json) ? json : (json.data || []);
    const m = new Map();
    for (const it of arr) { const n = it.areaName ?? it.label ?? it.name; if (n != null && it.value != null) m.set(n, Number(it.value) * (c.scale || 1)); }
    let best = null;
    for (const p of await ssotPartitions(c.key)) { const rate = matchRate(m, p.values); if (!best || rate >= best.rate) best = { year: p.year, rate }; }
    if (!best || best.rate < VERIFY_MIN) { console.log(`✗ ${c.base}: best ${Math.round((best?.rate ?? 0) * 100)}% (${c.key} ×${c.scale}) — 採用せず`); continue; }
    const dir = path.join(STAGE, c.slug, "data");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${c.base}.source.json`), JSON.stringify({
      kind: "ranking", rankingKey: c.key, year: best.year, unit: c.unit, label: c.label,
      transform: `raw値 ÷${c.scale} (記事は${c.unit}表記) + 上位5下位5抽出`,
      source: `r2:app/ranking/${c.key}/values.json`,
      upstream: "metric config → e-Stat → R2 app/ranking",
      restore: `node .claude/scripts/blog/fetch-ranking-data-r2.mjs --slug ${c.slug} --keys ${c.key} --data-name ${c.base}`,
      verifiedMatchRate: Math.round(best.rate * 100), generatedBy: "resolve-scatter-axes.mjs",
      note: "派生でなく raw key のスケール表記。json値×scaleでSSOT照合し確定",
    }, null, 2));
    console.log(`✓ ${c.base}: ${Math.round(best.rate * 100)}% (${c.key} ×${c.scale}) year=${best.year} → 書込`);
  }
  console.log(`\nstaging: .local/r2/app/blog/<slug>/data/<base>.source.json (R2反映: push-r2-wrangler.ts app/blog --apply)`);
}
main();
