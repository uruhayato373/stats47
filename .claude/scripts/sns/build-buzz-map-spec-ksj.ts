#!/usr/bin/env tsx
/**
 * build-buzz-map-spec-ksj.ts — 国土数値情報 (KSJ) / MLIT DPF の GIS データから
 * buzz-map spec を生成する。e-Stat 版 (build-buzz-map-spec.ts) の GIS 版。
 *
 * 2 モード:
 *   - point-plot (型C): 属性フィルタで絞ったフィーチャの代表点を data.points に載せる
 *     (まちの計量舎の「◯◯をプロット」系。駅乗降・ダム・道の駅 等)
 *   - point-muni (型A): 該当フィーチャの代表点を市区町村 polygon と point-in-polygon して
 *     「◯◯がある/ない自治体」の二値マップにする (--invert で無い側を hit に)
 *
 * データ入力:
 *   - 既定: R2 `gis/mlit-ksj/<dataId>/<version>/national.topojson` (公開 URL・認証不要)
 *   - --geojson <path>: ローカル GeoJSON (MLIT DPF GraphQL 取得結果等の受け皿)
 *
 * 代表点は d3-geo geoCentroid (Point=そのまま / LineString=線の重心 / Polygon=面の重心)。
 *
 * 正典: .claude/rules/buzz-map-standards.md (§1 型C / §2 spec)
 *
 * Usage:
 *   # 型C 点プロット (駅乗降5千人以上)
 *   npx tsx .claude/scripts/sns/build-buzz-map-spec-ksj.ts \
 *     --data-id S12 --version 24 --mode point-plot --filter "S12_057>=5000" \
 *     --id station-5k-plot --title "乗降5千人以上の駅はどこか" --accent social \
 *     --label-hit "5千人以上の駅" [--data-year "令和4年度"] [--point-radius 4]
 *
 *   # 型A 点→自治体二値 (駅が1つも無い自治体)
 *   npx tsx .claude/scripts/sns/build-buzz-map-spec-ksj.ts \
 *     --data-id S12 --version 24 --mode point-muni --invert \
 *     --id station-zero-muni --title "駅が1つも無い市区町村" --accent infra \
 *     --label-hit "駅なし" --label-miss "駅あり"
 *
 *   # DPF GeoJSON を入力に
 *   npx tsx .claude/scripts/sns/build-buzz-map-spec-ksj.ts \
 *     --geojson /tmp/dpf-dams.geojson --mode point-plot --id dams-plot ...
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { geoCentroid, geoLength } from "d3-geo";
import type { Feature, Geometry, Position } from "geojson";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { assertKsjPublicKeysAllowed } from "../../../packages/r2-storage/src/scripts/lib/ksj-publication-guard";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const SPECS_DIR = join(PROJECT_ROOT, "apps/remotion/src/features/buzz-map/specs");
const ASSETS_DIR = join(PROJECT_ROOT, "apps/remotion/public/buzz-map/assets");
const MUNI_TOPOJSON = join(PROJECT_ROOT, "apps/remotion/public/buzz-map/municipalities.topojson");

// KSJ dataId → 出典名 (datasets.ts の name を静的転記。ネットワーク非依存)
const KSJ_NAMES: Record<string, string> = {
  S12: "駅別乗降客数", W01: "ダム", P35: "道の駅", C28: "空港", P03: "発電施設",
  P12: "観光資源", P04: "医療機関", P05: "市町村役場", L01: "地価公示", C09: "漁港",
  C02: "港湾", P13: "都市公園", P29: "学校", W09: "湖沼",
  N02: "鉄道", N06: "高速道路時系列", W05: "河川", C23: "海岸線", N07: "バスルート",
};

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
    dataId: val("--data-id"),
    version: val("--version"),
    r2Key: val("--r2-key"), // 任意 R2 キー (例 app/highway-history/highway-sections.topojson)
    geojson: val("--geojson"),
    mode: (val("--mode") ?? "point-plot") as "point-plot" | "point-muni" | "line-network",
    filter: val("--filter"),
    invert: a.includes("--invert"),
    yearProp: val("--year-prop"), // 型D: 線の年属性 (例 N06_002)
    lineWidth: val("--line-width") ? Number(val("--line-width")) : null,
    id: req("--id"),
    title: req("--title"),
    subtitle: val("--subtitle"),
    titleLines: val("--title-lines"),
    accent: (val("--accent") ?? "infra") as "social" | "infra",
    theme: val("--theme") as "blue" | "dark" | "paper" | null,
    labelHit: val("--label-hit") ?? "該当",
    labelMiss: val("--label-miss") ?? "非該当",
    dataYear: val("--data-year"),
    pointRadius: val("--point-radius") ? Number(val("--point-radius")) : null,
  };
}

// ─── 属性フィルタ (eval せず自前パース: "<prop> <op> <number>") ───
type Cmp = (v: unknown) => boolean;
function parseFilter(expr: string): { prop: string; test: Cmp } {
  const m = expr.match(/^\s*([\w]+)\s*(>=|<=|>|<|==|!=)\s*(-?\d+\.?\d*)\s*$/);
  if (!m) {
    console.error(`✗ --filter の形式が不正です: "${expr}" (例: "S12_057>=5000")`);
    process.exit(1);
  }
  const [, prop, op, numStr] = m;
  const t = Number(numStr);
  const ops: Record<string, Cmp> = {
    ">=": (v) => typeof v === "number" && v >= t,
    "<=": (v) => typeof v === "number" && v <= t,
    ">": (v) => typeof v === "number" && v > t,
    "<": (v) => typeof v === "number" && v < t,
    "==": (v) => Number(v) === t,
    "!=": (v) => Number(v) !== t,
  };
  return { prop, test: ops[op] };
}

// ─── point-in-polygon (ray-casting、bbox 枝刈り) — 前例 export-depopulation-medical-snapshot.ts 準拠 ───
type Ring = Position[];
function pointInRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
interface MuniPoly {
  code: string;
  rings: Ring[];
  bbox: [number, number, number, number];
}
function ringsBbox(rings: Ring[]): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rings) for (const [x, y] of r) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

function loadMuniPolys(): MuniPoly[] {
  const topo = JSON.parse(readFileSync(MUNI_TOPOJSON, "utf8")) as Topology<{
    [k: string]: GeometryCollection<{ N03_007?: string }>;
  }>;
  const key = Object.keys(topo.objects)[0];
  const fc = feature(topo, topo.objects[key]);
  const polys: MuniPoly[] = [];
  for (const f of fc.features) {
    const code = f.properties?.N03_007;
    if (!code) continue;
    const g = f.geometry;
    const rings: Ring[] = [];
    if (g.type === "Polygon") rings.push(...g.coordinates);
    else if (g.type === "MultiPolygon") for (const p of g.coordinates) rings.push(...p);
    else continue;
    polys.push({ code, rings, bbox: ringsBbox(rings) });
  }
  return polys;
}

function muniOfPoint(lon: number, lat: number, polys: MuniPoly[]): string | null {
  for (const p of polys) {
    const [minX, minY, maxX, maxY] = p.bbox;
    if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue;
    // 外環 (偶数 index=外周) のみ判定 (穴は簡略化: MultiPolygon の各要素先頭が外周)
    if (pointInRing(lon, lat, p.rings[0])) return p.code;
  }
  return null;
}

// ─── フィーチャ列挙 (raw = topology/GeoJSON 原文も返す。line-network の asset コピー用) ───
interface LoadResult {
  features: Feature[];
  /** 型D で public assets へコピーする原データ (topojson or GeoJSON) */
  raw: unknown;
  rawIsTopology: boolean;
}

async function loadFeatures(opts: ReturnType<typeof parseArgs>): Promise<LoadResult> {
  // 原典のコピーだけでなく点座標を含む公開specも、KSJの商用公開境界を守る。
  const sourceKeys = [
    ...(opts.dataId ? [`gis/mlit-ksj/${opts.dataId}/${opts.version ?? 'unknown'}/source`] : []),
    ...(opts.r2Key ? [opts.r2Key] : []),
  ];
  assertKsjPublicKeysAllowed(sourceKeys);
  if (opts.geojson) {
    const gj = JSON.parse(readFileSync(opts.geojson, "utf8")) as {
      type: string;
      features?: Feature[];
    };
    if (gj.type === "FeatureCollection" && gj.features)
      return { features: gj.features, raw: gj, rawIsTopology: false };
    if (gj.type === "Feature")
      return { features: [gj as unknown as Feature], raw: gj, rawIsTopology: false };
    console.error("✗ --geojson は FeatureCollection か Feature である必要があります");
    process.exit(1);
  }
  // R2 キー: --r2-key (任意) 優先、無ければ gis/mlit-ksj 規約パス
  let url: string;
  if (opts.r2Key) {
    url = `${PUBLIC_URL}/${opts.r2Key}`;
  } else {
    if (!opts.dataId || !opts.version) {
      console.error("✗ R2 入力には --r2-key、または --data-id と --version が必須です (または --geojson)");
      process.exit(1);
    }
    url = `${PUBLIC_URL}/gis/mlit-ksj/${opts.dataId}/${opts.version}/national.topojson`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`✗ R2 topojson が取得できません (${res.status}): ${url}`);
    console.error("  (national ではなく県別の場合や、未変換の場合があります)");
    process.exit(1);
  }
  const topo = (await res.json()) as Topology;
  const key = Object.keys(topo.objects)[0];
  const fc = feature(topo, topo.objects[key] as GeometryCollection);
  return { features: fc.features, raw: topo, rawIsTopology: true };
}

function centroidOf(f: Feature): [number, number] | null {
  const c = geoCentroid(f as Feature<Geometry>);
  if (!c || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) return null;
  return [c[0], c[1]];
}

async function main() {
  const opts = parseArgs();
  const { features, raw, rawIsTopology } = await loadFeatures(opts);
  console.log(`フィーチャ ${features.length} 件を読み込み`);

  // フィルタ適用
  let hit = features;
  if (opts.filter) {
    const { prop, test } = parseFilter(opts.filter);
    hit = features.filter((f) => test(f.properties?.[prop as keyof typeof f.properties]));
    console.log(`フィルタ "${opts.filter}": ${hit.length} 件が該当`);
  }

  const sourceName = opts.dataId
    ? `国土数値情報（${KSJ_NAMES[opts.dataId] ?? opts.dataId}データ・国土交通省）`
    : "国土交通省 各種GISデータ";
  const yearLabel = opts.dataYear ?? (opts.version ? `第${opts.version}版` : "");
  const source = [
    `出典: ${sourceName}を加工して作成`,
    [yearLabel, "全国"].filter(Boolean).join(" / "),
    "stats47.jp",
  ];

  // ─── 型D: 線ネットワーク (asset 配置 + years 自動導出 + km 集計) ───
  if (opts.mode === "line-network") {
    mkdirSync(ASSETS_DIR, { recursive: true });
    const assetRel = `buzz-map/assets/${opts.id}.topojson`;
    // topojson 原文をそのまま asset に配置 (GeoJSON 入力時も .topojson 拡張で保存=中身は FC)
    writeFileSync(join(ASSETS_DIR, `${opts.id}.topojson`), JSON.stringify(raw));

    // 年範囲の自動導出 (--year-prop があれば)
    let years: { from: number; to: number } | undefined;
    if (opts.yearProp) {
      const ys = hit
        .map((f) => Number(f.properties?.[opts.yearProp as keyof typeof f.properties]))
        .filter((y) => Number.isFinite(y) && y > 1900 && y < 2100);
      if (ys.length > 0) years = { from: Math.min(...ys), to: Math.max(...ys) };
    }

    // 総延長 km (geoLength は球面ラジアン → ×6371)
    let totalKm = 0;
    for (const f of hit) totalKm += geoLength(f as Feature<Geometry>) * 6371;
    const kmRounded = Math.round(totalKm);

    const spec: Record<string, unknown> = {
      id: opts.id,
      type: "D",
      level: "pref",
      title: opts.title,
      ...(opts.titleLines ? { titleLines: opts.titleLines.split("|") } : {}),
      subtitle: opts.subtitle ?? "",
      source,
      accent: opts.accent,
      ...(opts.theme ? { theme: opts.theme } : {}),
      ...(opts.lineWidth ? { lineWidth: opts.lineWidth } : {}),
      ...(opts.yearProp ? { lineYearProp: opts.yearProp } : {}),
      ...(years ? { years, holdSeconds: 2, summary: { max: false, min: false } } : {}),
      legend: {
        title: "区分（総延長）",
        rows: [{ key: "hit", label: opts.labelHit, fill: "accent", count: kmRounded }],
      },
      data: { linesAsset: assetRel },
    };

    writeFileSync(join(SPECS_DIR, `${opts.id}.json`), JSON.stringify({ spec }, null, 2) + "\n");
    console.log(`✓ spec 生成: ${join(SPECS_DIR, `${opts.id}.json`)}`);
    console.log(`  asset: apps/remotion/public/${assetRel} (${rawIsTopology ? "topojson" : "geojson"})`);
    console.log(`  線 ${hit.length} 本 / 総延長 ${kmRounded}km${years ? ` / 年 ${years.from}-${years.to}` : ""}`);
    console.log(`\nレンダ (静止画=最新年の全網図):`);
    console.log(`  cd apps/remotion && npx remotion still src/index.ts BuzzMap-Still-45 \\`);
    console.log(`    ../../.local/r2/sns/buzz-map/${opts.id}/x/stills/${opts.id}-45.png \\`);
    console.log(`    --props=src/features/buzz-map/specs/${opts.id}.json`);
    if (years) {
      console.log(`\nレンダ (時系列リール試写):`);
      console.log(`  npx remotion render src/index.ts BuzzMap-Reel-11 /tmp/${opts.id}-preview.mp4 \\`);
      console.log(`    --props=src/features/buzz-map/specs/${opts.id}.json --frames=0-89 --scale=0.5`);
    }
    return;
  }

  let spec: Record<string, unknown>;

  if (opts.mode === "point-plot") {
    // 型C: 代表点をプロット
    const pts: [number, number][] = [];
    for (const f of hit) {
      const c = centroidOf(f);
      if (c) pts.push(c);
    }
    console.log(`点プロット: ${pts.length} 点 (代表点=geoCentroid)`);
    spec = {
      id: opts.id,
      type: "C",
      level: "pref",
      title: opts.title,
      ...(opts.titleLines ? { titleLines: opts.titleLines.split("|") } : {}),
      subtitle: opts.subtitle ?? "",
      source,
      accent: opts.accent,
      ...(opts.theme ? { theme: opts.theme } : {}),
      ...(opts.pointRadius ? { pointRadius: opts.pointRadius } : {}),
      legend: {
        title: "区分（件数）",
        rows: [{ key: "hit", label: opts.labelHit, fill: "accent", count: pts.length }],
      },
      data: { points: { hit: pts } },
    };
  } else {
    // 型A: 点→自治体 PIP → 二値
    const polys = loadMuniPolys();
    const hitMuni = new Set<string>();
    for (const f of hit) {
      const c = centroidOf(f);
      if (!c) continue;
      const code = muniOfPoint(c[0], c[1], polys);
      if (code) hitMuni.add(code);
    }
    const total = polys.length;
    // --invert: 「該当フィーチャが1つも無い自治体」を hit 色に
    const targetCodes = opts.invert
      ? polys.map((p) => p.code).filter((c) => !hitMuni.has(c))
      : [...hitMuni];
    const hitCount = targetCodes.length;
    const missCount = total - hitCount;
    console.log(
      `PIP: 該当フィーチャを持つ自治体 ${hitMuni.size} / 母数 ${total}` +
        (opts.invert ? ` → invert で hit=${hitCount} (該当なし自治体)` : ""),
    );
    const values: Record<string, string> = {};
    for (const c of targetCodes) values[c] = "hit";
    spec = {
      id: opts.id,
      type: "A",
      level: "muni",
      title: opts.title,
      ...(opts.titleLines ? { titleLines: opts.titleLines.split("|") } : {}),
      subtitle: opts.subtitle ?? "",
      source,
      accent: opts.accent,
      ...(opts.theme ? { theme: opts.theme } : {}),
      legend: {
        title: "区分（自治体数）",
        rows: [
          { key: "hit", label: opts.labelHit, fill: "accent", count: hitCount },
          { key: "miss", label: opts.labelMiss, fill: "land", count: missCount },
        ],
      },
      data: { values },
    };
  }

  mkdirSync(SPECS_DIR, { recursive: true });
  const outPath = join(SPECS_DIR, `${opts.id}.json`);
  writeFileSync(outPath, JSON.stringify({ spec }, null, 2) + "\n");
  console.log(`✓ spec 生成: ${outPath}`);
  const comp = opts.mode === "point-plot" ? "BuzzMap-Still-45" : "BuzzMap-Still-45";
  console.log(`\nレンダ:`);
  console.log(`  cd apps/remotion && npx remotion still src/index.ts ${comp} \\`);
  console.log(`    ../../.local/r2/sns/buzz-map/${opts.id}/x/stills/${opts.id}-45.png \\`);
  console.log(`    --props=src/features/buzz-map/specs/${opts.id}.json`);
}

main();
