#!/usr/bin/env node
/**
 * データ集の地図に使う都道府県境界を作る (e-Stat「令和 2 年国勢調査 町丁・字等別境界データ」→ 都道府県で結合)。
 *
 * 入力: 都道府県ごとの shapefile (`<source-dir>/NN/r2kaNN.shp`)。無ければ e-Stat から 1 県ずつダウンロードして置く
 *       (既存 `.claude/scripts/products/build-muni-data-product.mjs` と同じ URL・同じ 1 秒間隔)。
 * 出力: `.local/data-packs/_boundary/prefecture-r2census-2020.geojson` と `.meta.json` (git 管理外・派生物)。
 * 検査: 47 件・県コード集合・面積 (元の面積との差)・人口 (R2 の国勢調査 2020 総人口との一致)・重なり (合計面積と和集合の面積)。
 *       1 つでも外れたら exit 1 (出力は書かない)。
 *
 * 実行: npx tsx packages/product-factory/scripts/build-prefecture-boundary.mts [--source-dir <dir>] [--interval 300] [--min-island-km2 1]
 * 外部コマンド: mapshaper / mapshaper-xl (npm i -g mapshaper)。呼び出し元: オーナー / data-pack-manager。
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  PREFECTURE_BOUNDARY_DIR,
  PREFECTURE_BOUNDARY_PATH,
  PREFECTURE_BOUNDARY_META_PATH,
  PREFECTURE_BOUNDARY_MIN_ISLAND_KM2,
  PREFECTURE_BOUNDARY_SOURCE,
  checkBoundaryShape,
  type PrefectureBoundary,
} from "../src/maps/prefecture-boundary";
import { PREFECTURES } from "../src/data/prefectures";
import { SITE } from "@stats47/data-configs";
import { statsR2Key } from "@stats47/r2-storage/keys";
import { to2DigitPrefCode } from "@stats47/area";

const { values: args } = parseArgs({
  options: {
    "source-dir": { type: "string" },
    interval: { type: "string", default: "300" },
    "min-island-km2": { type: "string", default: String(PREFECTURE_BOUNDARY_MIN_ISLAND_KM2) },
  },
});

const WATER_HCODE = 8154; // 水面調査区 (湾・湖など。陸の形に含めない)
const AREA_TOLERANCE = 0.01; // 結合後の面積と元の面積の差 (簡略化による)
const OVERLAP_TOLERANCE = 0.001; // 各県の面積の合計と和集合の面積の差
const SOURCE_DIR = resolve(args["source-dir"] ?? join(PREFECTURE_BOUNDARY_DIR, "_source"));
const WORK_DIR = join(PREFECTURE_BOUNDARY_DIR, "_work");
const interval = Number(args.interval);
const minIslandM2 = Number(args["min-island-km2"]) * 1_000_000;
const codes2 = PREFECTURES.map((p) => p.code2);

function run(cmd: string, argv: string[]): string {
  return execFileSync(cmd, argv, { encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "pipe"] });
}

const sha256 = (path: string): string => createHash("sha256").update(readFileSync(path)).digest("hex");

async function ensureSource(pref: string): Promise<string> {
  const dir = join(SOURCE_DIR, pref);
  const shp = join(dir, `r2ka${pref}.shp`);
  if (existsSync(shp)) return shp;
  mkdirSync(dir, { recursive: true });
  const url = PREFECTURE_BOUNDARY_SOURCE.downloadUrlTemplate.replace("<都道府県コード2桁>", pref);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`境界 ${pref}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.subarray(0, 2).toString() !== "PK") throw new Error(`境界 ${pref}: zip ではない応答`);
  writeFileSync(join(dir, "source.zip"), bytes);
  run("unzip", ["-o", "-q", join(dir, "source.zip"), "-d", dir]);
  await new Promise((done) => setTimeout(done, 1000));
  return shp;
}

/** 都道府県ごとに水面調査区を除いて結合し、元の面積・人口の合計を持たせた shapefile を作る。 */
function dissolvePrefecture(pref: string, shp: string): string {
  const out = join(WORK_DIR, `${pref}.shp`);
  run("mapshaper", [
    shp,
    "-filter", `HCODE !== ${WATER_HCODE}`,
    "-each", "srcArea=AREA, pop=JINKO",
    "-dissolve", "PREF", "sum-fields=srcArea,pop", "copy-fields=PREF_NAME",
    "-o", out, "force",
  ]);
  return out;
}

/** 水面調査区に住む人 (船舶など)。形には含めないが、国勢調査の総人口との突合には要る。 */
function waterPopulation(pref: string, shp: string): number {
  const out = join(WORK_DIR, `water-${pref}.json`);
  run("mapshaper", [
    shp,
    "-filter", `HCODE === ${WATER_HCODE}`,
    "-each", "waterPop=JINKO",
    "-o", out, "format=json", "force",
  ]);
  if (!existsSync(out)) return 0; // 水面調査区が無い県は空の層になり、出力されない
  const rows = JSON.parse(readFileSync(out, "utf8")) as { waterPop: number }[];
  return rows.reduce((sum, r) => sum + r.waterPop, 0);
}

function census2020Population(): Promise<Map<string, number>> {
  return fetch(`${SITE.r2PublicBaseUrl}/${statsR2Key("total-population", "prefecture")}`)
    .then((r) => {
      if (!r.ok) throw new Error(`total-population: HTTP ${r.status}`);
      return r.json() as Promise<{ rows: { areaCode: string; yearCode: string; value: number | null }[] }>;
    })
    .then((json) => {
      const m = new Map<string, number>();
      for (const row of json.rows) if (row.yearCode === "2020" && row.value !== null) m.set(to2DigitPrefCode(row.areaCode), row.value);
      return m;
    });
}

async function main(): Promise<void> {
  mkdirSync(WORK_DIR, { recursive: true });
  const sources: { pref: string; shp: string; zipSha256?: string; zipMtime?: string }[] = [];
  const waterPop = new Map<string, number>();
  for (const pref of codes2) {
    const shp = await ensureSource(pref);
    const zip = join(shp, "..", "source.zip");
    sources.push({
      pref,
      shp,
      zipSha256: existsSync(zip) ? sha256(zip) : undefined,
      zipMtime: existsSync(zip) ? statSync(zip).mtime.toISOString().slice(0, 10) : undefined,
    });
    dissolvePrefecture(pref, shp);
    waterPop.set(pref, waterPopulation(pref, shp));
    console.log(`[boundary] ${pref} 結合`);
  }

  const raw = join(WORK_DIR, "combined.geojson");
  run("mapshaper-xl", [
    "6gb",
    "-i", ...codes2.map((p) => join(WORK_DIR, `${p}.shp`)), "combine-files", "snap",
    "-merge-layers", "force",
    "-simplify", "dp", `interval=${interval}`, "keep-shapes",
    "-filter-islands", `min-area=${minIslandM2}`, "remove-empty",
    "-each", "calcArea=this.area",
    "-o", raw, "format=geojson", "precision=0.0001", "force",
  ]);
  const combined = JSON.parse(readFileSync(raw, "utf8")) as {
    type: "FeatureCollection";
    features: { type: "Feature"; geometry: PrefectureBoundary["features"][number]["geometry"]; properties: Record<string, unknown> }[];
  };

  const popByPref = await census2020Population();
  const problems: string[] = [];
  const perPref: { code: string; name: string; srcAreaKm2: number; areaKm2: number; areaRatio: number; landPopulation: number; waterAreaPopulation: number; r2Population: number | null }[] = [];
  const features: PrefectureBoundary["features"] = [];
  for (const f of combined.features) {
    const p = f.properties;
    const code = String(p.PREF);
    const master = PREFECTURES.find((x) => x.code2 === code);
    if (!master) {
      problems.push(`${code}: 想定外の県コード`);
      continue;
    }
    if (String(p.PREF_NAME) !== master.name) problems.push(`${code}: 名称 ${String(p.PREF_NAME)} ≠ ${master.name}`);
    const srcArea = Number(p.srcArea);
    const calc = Number(p.calcArea);
    const ratio = calc / srcArea;
    if (Math.abs(ratio - 1) > AREA_TOLERANCE) problems.push(`${code}: 面積比 ${ratio.toFixed(4)} (許容 ±${AREA_TOLERANCE})`);
    const r2 = popByPref.get(code) ?? null;
    const water = waterPop.get(code) ?? 0;
    // 形に含めた町丁の人口 + 水面調査区の人口 = 国勢調査 2020 の総人口 (R2 の total-population) になること
    if (r2 === null) problems.push(`${code}: R2 の国勢調査 2020 総人口が無い`);
    else if (r2 !== Number(p.pop) + water) problems.push(`${code}: 人口 ${String(p.pop)} + 水面 ${water} ≠ R2 ${r2}`);
    perPref.push({ code, name: master.name, srcAreaKm2: Math.round(srcArea / 1e4) / 100, areaKm2: Math.round(calc / 1e4) / 100, areaRatio: Number(ratio.toFixed(4)), landPopulation: Number(p.pop), waterAreaPopulation: water, r2Population: r2 });
    features.push({ type: "Feature", geometry: f.geometry, properties: { code, name: master.name } });
  }
  features.sort((a, b) => a.properties.code.localeCompare(b.properties.code));
  const boundary: PrefectureBoundary = { type: "FeatureCollection", features };

  const shape = checkBoundaryShape(boundary, codes2);
  problems.push(...shape.problems);

  // 重なり: 各県の面積の合計と、全県を 1 つに結合した面積が合うか
  const overlapTmp = join(WORK_DIR, "overlap.geojson");
  writeFileSync(overlapTmp, JSON.stringify(boundary));
  run("mapshaper", [
    overlapTmp,
    "-each", "a=this.area",
    "-o", join(WORK_DIR, "areas.json"), "format=json", "force",
  ]);
  const areas = (JSON.parse(readFileSync(join(WORK_DIR, "areas.json"), "utf8")) as { a: number }[]).reduce((s, r) => s + r.a, 0);
  run("mapshaper", [overlapTmp, "-dissolve", "-each", "a=this.area", "-o", join(WORK_DIR, "union.json"), "format=json", "force"]);
  const union = (JSON.parse(readFileSync(join(WORK_DIR, "union.json"), "utf8")) as { a: number }[])[0].a;
  const overlapRatio = areas / union - 1;
  if (overlapRatio > OVERLAP_TOLERANCE) problems.push(`県の形が重なっている: 面積の合計 / 和集合 - 1 = ${overlapRatio.toExponential(2)}`);

  console.log(`[boundary] 形 ${shape.features} 件・${shape.polygons} ポリゴン・${shape.vertices} 点 / 重なり ${overlapRatio.toExponential(2)}`);
  if (problems.length > 0) {
    console.error(`境界の検査に失敗 (${problems.length} 件):\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }

  mkdirSync(PREFECTURE_BOUNDARY_DIR, { recursive: true });
  writeFileSync(PREFECTURE_BOUNDARY_PATH, JSON.stringify(boundary));
  const meta = {
    source: PREFECTURE_BOUNDARY_SOURCE,
    builtAt: new Date().toISOString(),
    sourceFiles: sources.map((s) => ({ pref: s.pref, shpSha256: sha256(s.shp), zipSha256: s.zipSha256, zipFetchedOn: s.zipMtime })),
    params: { simplify: `dp interval=${interval}m keep-shapes`, minIslandKm2: Number(args["min-island-km2"]), excludedHcode: WATER_HCODE },
    checks: {
      features: shape.features,
      polygons: shape.polygons,
      vertices: shape.vertices,
      bytes: statSync(PREFECTURE_BOUNDARY_PATH).size,
      overlapRatio,
      tolerances: { area: AREA_TOLERANCE, overlap: OVERLAP_TOLERANCE },
      populationTotal: perPref.reduce((s, r) => s + r.landPopulation + r.waterAreaPopulation, 0),
    },
    perPrefecture: perPref.sort((a, b) => a.code.localeCompare(b.code)),
  };
  writeFileSync(PREFECTURE_BOUNDARY_META_PATH, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`[boundary] 書き出し: ${PREFECTURE_BOUNDARY_PATH} (${meta.checks.bytes.toLocaleString()} bytes)`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
