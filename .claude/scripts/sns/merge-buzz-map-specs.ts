#!/usr/bin/env tsx
/**
 * merge-buzz-map-specs.ts — 既存の buzz-map spec 2 つを「レイヤー合成 (型E)」spec に統合する。
 *
 * まちの計量舎に無い「掛け合わせ地図」(例: 人口増減の塗り × 高速道路網の線、過疎の塗り ×
 * 医療機関の点) を作るためのヘルパー。新規にデータを組むのではなく、**検証済みの既存 spec を
 * 部品として再利用**する (元データの正しさを引き継ぐ)。
 *
 * 合成ルール:
 *   base    … 塗りレイヤー (型A/E の data.values + legend rows)。無指定なら白地図
 *   overlay … 点レイヤー (型C の data.points) or 線レイヤー (型D の data.linesAsset)
 *   → 型E spec: base の values/塗り凡例 + overlay の points/lines/凡例 を 1 枚に重ねる。
 *   色は塗り=accent、overlay=accent2 を既定にして分離 (--point-fill / --line-stroke で上書き可)。
 *   出典行は両 spec をマージ。凡例 rows には marker (fill/point/line) を自動付与。
 *
 * 正典: .claude/rules/buzz-map-standards.md (§1 型E / §4 組み合わせカタログ)
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/merge-buzz-map-specs.ts \
 *     --base migration-inflow-muni --overlay highway-network-growth \
 *     --id migration-x-highway --title "..." [--title-lines "1|2"] [--subtitle "..."] \
 *     [--point-fill accent2] [--line-stroke accent2]
 *
 *   # 白地図 + 点だけ (base 省略)
 *   npx tsx ... --overlay station-5k-plot --id ... --title "..."
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const SPECS_DIR = join(PROJECT_ROOT, "apps/remotion/src/features/buzz-map/specs");

interface LegendRow {
  key: string;
  label: string;
  fill: string;
  count?: number;
  marker?: "fill" | "point" | "line";
}
interface BuzzSpec {
  id: string;
  type: string;
  level: string;
  title: string;
  titleLines?: string[];
  subtitle: string;
  source: string[];
  accent?: string;
  legend: { title: string; rows?: LegendRow[] };
  data: {
    values?: Record<string, string>;
    points?: Record<string, [number, number][]>;
    linesAsset?: string;
  };
  pointRadius?: number;
  lineYearProp?: string;
  lineWidth?: number;
  years?: { from: number; to: number };
}

function parseArgs() {
  const a = process.argv.slice(2);
  const val = (n: string) => {
    const i = a.indexOf(n);
    return i !== -1 ? (a[i + 1] ?? null) : null;
  };
  const req = (n: string): string => {
    const v = val(n);
    if (v == null) {
      console.error(`✗ 必須引数がありません: ${n}`);
      process.exit(1);
    }
    return v;
  };
  return {
    base: val("--base"),
    overlay: req("--overlay"),
    id: req("--id"),
    title: req("--title"),
    titleLines: val("--title-lines"),
    subtitle: val("--subtitle"),
    pointFill: val("--point-fill") ?? "accent2",
    lineStroke: val("--line-stroke") ?? "accent2",
  };
}

function loadSpec(id: string): BuzzSpec {
  const p = join(SPECS_DIR, `${id}.json`);
  try {
    return (JSON.parse(readFileSync(p, "utf8")) as { spec: BuzzSpec }).spec;
  } catch {
    console.error(`✗ spec が読めません: ${p}`);
    process.exit(1);
  }
}

function main() {
  const opts = parseArgs();
  const overlay = loadSpec(opts.overlay);
  const base = opts.base ? loadSpec(opts.base) : null;

  // overlay の種別を判定 (点 or 線)
  const hasPoints = Boolean(overlay.data.points);
  const hasLines = Boolean(overlay.data.linesAsset);
  if (!hasPoints && !hasLines) {
    console.error(`✗ overlay "${opts.overlay}" は点(型C)でも線(型D)でもありません`);
    process.exit(1);
  }

  // level: base があればその粒度 (塗りは muni polygon 等)、無ければ overlay の level
  const level = base?.level ?? overlay.level;

  // ── 塗りレイヤー (base) ──
  const values = base?.data.values;
  const baseRows: LegendRow[] = (base?.legend.rows ?? []).map((r) => ({
    ...r,
    marker: "fill" as const,
  }));

  // ── overlay レイヤー (点/線) ──
  const overlayRows: LegendRow[] = (overlay.legend.rows ?? []).map((r) => ({
    ...r,
    // overlay の accent 行は accent2 に振り替え (base の塗りと色を分ける)
    fill: r.fill === "accent" ? (hasLines ? opts.lineStroke : opts.pointFill) : r.fill,
    marker: (hasLines ? "line" : "point") as "line" | "point",
  }));

  // ── 出典マージ (末尾 stats47.jp は 1 回) ──
  const srcLines = [
    ...(base?.source ?? []).filter((l) => l !== "stats47.jp"),
    ...overlay.source.filter((l) => l !== "stats47.jp"),
    "stats47.jp",
  ];

  const spec: BuzzSpec = {
    id: opts.id,
    type: "E",
    level,
    title: opts.title,
    ...(opts.titleLines ? { titleLines: opts.titleLines.split("|") } : {}),
    subtitle: opts.subtitle ?? "",
    source: srcLines,
    accent: base?.accent ?? overlay.accent ?? "social",
    ...(hasPoints ? { pointFill: opts.pointFill } : {}),
    ...(hasLines ? { lineStroke: opts.lineStroke } : {}),
    ...(overlay.pointRadius ? { pointRadius: overlay.pointRadius } : {}),
    ...(overlay.lineWidth ? { lineWidth: overlay.lineWidth } : {}),
    // 型E 静止画は最新年の全網図 (lineYearProp は静止画では全描画。year prop 指定時のみフィルタ)
    legend: {
      title: "区分",
      rows: [...baseRows, ...overlayRows],
    },
    data: {
      ...(values ? { values } : {}),
      ...(overlay.data.points ? { points: overlay.data.points } : {}),
      ...(overlay.data.linesAsset ? { linesAsset: overlay.data.linesAsset } : {}),
    },
  };

  const outPath = join(SPECS_DIR, `${opts.id}.json`);
  writeFileSync(outPath, JSON.stringify({ spec }, null, 2) + "\n");

  const layers = [
    base ? `塗り(${opts.base})` : "白地図",
    hasLines ? `線(${opts.overlay})` : `点(${opts.overlay})`,
  ];
  console.log(`✓ 型E 合成 spec 生成: ${outPath}`);
  console.log(`  レイヤー: ${layers.join(" + ")}`);
  console.log(`  凡例 ${spec.legend.rows?.length} 行 (塗り${baseRows.length} + overlay${overlayRows.length})`);
  console.log(`\nレンダ:`);
  console.log(`  cd apps/remotion && npx remotion still src/index.ts BuzzMap-Still-45 \\`);
  console.log(`    ../../.local/r2/sns/buzz-map/${opts.id}/x/stills/${opts.id}-45.png \\`);
  console.log(`    --props=src/features/buzz-map/specs/${opts.id}.json`);
}

main();
