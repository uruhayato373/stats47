/**
 * 問いのページ (試作) の計算。4 つの問いについて、空間演算で市区町村・県を組に分け、組ごとの推移を出す。
 * 出力は `.local/r2/app/geo/questions/<slug>.json`。R2 へは書かない。
 *
 *   node --import tsx packages/gis/src/geo-questions/scripts/build-geo-questions.ts
 *
 * 入力 (すべて読むだけ):
 *   - 市区町村の境界: fetchMunicipalityTopologyForWardMode(県, "merged") (政令指定都市は市全体)
 *   - 人口・製造品出荷額: R2 app/stats/<指標>/cities.json (合併を今の市域に組み替えた系列)
 *   - 宿泊者数: R2 app/stats/actual-overnight-guests/values.json (都道府県)
 *   - 高速道路の接合部: .local/r2/app/geo/history/expressway/joints.topojson (build-expressway-joints.ts)
 *   - 新幹線の駅: 鉄道時系列 N05 の ZIP の Station2 層 (台帳の SHA で照合)
 *   - 空港: .local/r2/app/geo/history/airport/summary.json (県別の空港数)
 *
 * 試作のため、問いの定義はこのファイルにある。設計が固まったら問いの台帳 (data/geo/) へ移す。
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { SITE } from "@stats47/types";
import { geoBounds, geoCentroid, geoContains } from "d3-geo";
import { feature as topoFeature } from "topojson-client";
import unzipper from "unzipper";

import { haversineKm } from "../../infra-history/core";
import { findInfraNetwork } from "../../infra-history/networks";
import { fetchMunicipalityTopologyForWardMode } from "../../mlit/fetch-ward-mode-topology";

import type { Feature, FeatureCollection, Geometry, Point } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";

const ROOT = path.resolve(__dirname, "../../../../..");
const OUT_DIR = path.join(ROOT, ".local/r2/app/geo/questions");
const R2_PUBLIC = process.env.R2_PUBLIC_FETCH_URL ?? SITE.r2PublicBaseUrl;
const PREF_CODES = Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, "0"));

type GroupDef = { code: string; label: string; color: string };
interface QuestionOutput {
  slug: string;
  generatedAt: string;
  unitOfArea: "municipality" | "prefecture";
  measure: { label: string; unit: string; note: string };
  groups: (GroupDef & { count: number })[];
  years: number[];
  series: Record<string, (number | null)[]>;
  /** 地図用: 地域コード → 組 */
  areas: Record<string, string>;
  names: Record<string, string>;
  /** 地図に重ねる点 (駅など。名前・開業年) */
  points: { name: string; lon: number; lat: number; year: number }[];
  conservation: { areasWithData: number; grouped: number; note: string };
  inputs: string[];
}

interface Municipality {
  code: string;
  name: string;
  pref: string;
  feature: Feature<Geometry>;
  bounds: [[number, number], [number, number]];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`取得に失敗: ${url} HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function loadMunicipalities(): Promise<Municipality[]> {
  const all: Municipality[] = [];
  for (const pref of PREF_CODES) {
    const topology = (await fetchMunicipalityTopologyForWardMode(pref, "merged")) as unknown as Topology;
    const object = topology.objects[Object.keys(topology.objects)[0]] as GeometryCollection;
    const collection = topoFeature(topology, object) as FeatureCollection<Geometry, Record<string, string>>;
    for (const f of collection.features) {
      const code = String(f.properties.N03_007 ?? "");
      if (!/^\d{5}$/.test(code)) continue;
      all.push({ code, name: String(f.properties.N03_004 ?? code), pref, feature: f, bounds: geoBounds(f) as Municipality["bounds"] });
    }
  }
  return all;
}

function municipalityOf(municipalities: readonly Municipality[], lon: number, lat: number): Municipality | null {
  for (const m of municipalities) {
    const [[w, s], [e, n]] = m.bounds;
    if (lon < w || lon > e || lat < s || lat > n) continue;
    if (geoContains(m.feature, [lon, lat])) return m;
  }
  return null;
}

type Rows = { rows: { areaCode: string; areaName: string; yearCode: string; value: number | null; prefectureCode?: string }[] };

/** 市区町村 × 年の値 (行政区の行は除く: 名前が「県 市 区」の 3 語) */
async function loadCitySeries(metricKey: string): Promise<{ byCode: Map<string, Map<number, number>>; names: Map<string, string> }> {
  const payload = await fetchJson<Rows>(`${R2_PUBLIC}/app/stats/${metricKey}/cities.json`);
  const byCode = new Map<string, Map<number, number>>();
  const names = new Map<string, string>();
  for (const row of payload.rows) {
    if (typeof row.value !== "number" || !Number.isFinite(row.value) || row.areaName.trim().split(/\s+/).length >= 3) continue;
    const series = byCode.get(row.areaCode) ?? new Map<number, number>();
    series.set(Number(row.yearCode.slice(0, 4)), row.value);
    byCode.set(row.areaCode, series);
    names.set(row.areaCode, row.areaName);
  }
  return { byCode, names };
}

/** 組ごとの合計を、基準年 = 100 の指数にする。全年に値がある地域だけを使う (年で母集団を変えない) */
function indexSeries(
  groupOf: Map<string, string>,
  series: Map<string, Map<number, number>>,
  years: readonly number[],
  groups: readonly GroupDef[],
): { series: Record<string, (number | null)[]>; counts: Map<string, number>; used: number } {
  const totals = new Map(groups.map((g) => [g.code, years.map(() => 0)]));
  const counts = new Map(groups.map((g) => [g.code, 0]));
  let used = 0;
  for (const [code, group] of groupOf) {
    const values = series.get(code);
    if (!values || !years.every((y) => values.has(y))) continue;
    used += 1;
    counts.set(group, (counts.get(group) ?? 0) + 1);
    const total = totals.get(group);
    if (!total) continue;
    years.forEach((y, i) => (total[i] += values.get(y) ?? 0));
  }
  const out: Record<string, (number | null)[]> = {};
  for (const [group, total] of totals) out[group] = total[0] > 0 ? total.map((v) => Math.round((v / total[0]) * 1000) / 10) : years.map(() => null);
  return { series: out, counts, used };
}

function eraGroup(year: number | null, eras: readonly { code: string; to: number }[], none: string): string {
  if (year === null) return none;
  return eras.find((era) => year <= era.to)?.code ?? none;
}

function write(output: QuestionOutput): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${output.slug}.json`);
  fs.writeFileSync(file, `${JSON.stringify(output)}\n`);
  console.log(`  ${path.relative(ROOT, file)} 組 ${output.groups.map((g) => `${g.label}=${g.count}`).join(" / ")}`);
}

function readTopology(relative: string): Topology {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8")) as Topology;
}

async function readShinkansenStations(): Promise<{ name: string; lon: number; lat: number; year: number }[]> {
  const network = findInfraNetwork("railway");
  if (!network) throw new Error("台帳に railway が無い");
  const zip = path.join(ROOT, ".local/infra-history/src", `${network.source.dataId}-${network.source.version}.zip`);
  const buffer = fs.readFileSync(zip);
  if (createHash("sha256").update(buffer).digest("hex") !== network.source.archiveSha256) throw new Error("N05 の ZIP が台帳と一致しない");
  const directory = await unzipper.Open.buffer(buffer);
  const entry = directory.files.find((f: { path: string }) => f.path === `UTF-8/${network.source.dataId}-${network.source.version}_Station2.geojson`);
  if (!entry) throw new Error("ZIP に Station2 が無い");
  const geojson = JSON.parse((await entry.buffer()).toString("utf8")) as FeatureCollection<Point, Record<string, string | null>>;
  // 事業者種別 1 (JR新幹線) の記録。同じ駅 (路線 + 駅名) の最も早い設置開始年を開業年とする
  const first = new Map<string, { name: string; lon: number; lat: number; year: number }>();
  for (const f of geojson.features) {
    if (String(f.properties.N05_001) !== "1") continue;
    const year = Number(f.properties.N05_005b);
    const name = String(f.properties.N05_011 ?? "");
    const key = `${f.properties.N05_002}:${name}`;
    const [lon, lat] = f.geometry.coordinates;
    const prev = first.get(key);
    if (!prev || year < prev.year) first.set(key, { name: `${name} (${f.properties.N05_002})`, lon, lat, year });
  }
  return [...first.values()];
}

async function main(): Promise<void> {
  const generatedAt = new Date().toISOString();
  console.log("市区町村の境界を読む (47 県)");
  const municipalities = await loadMunicipalities();
  console.log(`  ${municipalities.length} 市区町村`);
  const population = await loadCitySeries("total-population");
  const censusYears = [1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025];

  // ── 問い 1: IC ができた市区町村は人口が減りにくかったか ──
  const joints = readTopology(".local/r2/app/geo/history/expressway/joints.topojson");
  const jointFeatures = (topoFeature(joints, joints.objects.points as GeometryCollection) as FeatureCollection<Point, { s: number; e: number; c: string; n: string }>).features;
  const ics = jointFeatures.filter((f) => f.properties.c === "ic" || f.properties.c === "smart-ic");
  const firstIc = new Map<string, number>();
  for (const ic of ics) {
    const [lon, lat] = ic.geometry.coordinates;
    const m = municipalityOf(municipalities, lon, lat);
    if (!m) continue;
    firstIc.set(m.code, Math.min(firstIc.get(m.code) ?? Infinity, ic.properties.s));
  }
  const icGroups: GroupDef[] = [
    { code: "by-1980", label: "1980年までに IC ができた", color: "hsl(var(--chart-3))" },
    { code: "1981-1999", label: "1981〜1999年に IC ができた", color: "hsl(var(--chart-2))" },
    { code: "2000-2024", label: "2000年以降に IC ができた", color: "hsl(var(--chart-4))" },
    { code: "none", label: "IC が無い", color: "hsl(var(--muted-foreground))" },
  ];
  const icEras = [
    { code: "by-1980", to: 1980 },
    { code: "1981-1999", to: 1999 },
    { code: "2000-2024", to: 2024 },
  ];
  const groupOfIc = new Map(municipalities.map((m) => [m.code, eraGroup(firstIc.get(m.code) ?? null, icEras, "none")]));
  const q1 = indexSeries(groupOfIc, population.byCode, censusYears, icGroups);
  write({
    slug: "ic-population",
    generatedAt,
    unitOfArea: "municipality",
    measure: { label: "人口 (1980年 = 100)", unit: "", note: "組ごとの人口の合計を、1980年を 100 とした指数で表す" },
    groups: icGroups.map((g) => ({ ...g, count: q1.counts.get(g.code) ?? 0 })),
    years: censusYears,
    series: q1.series,
    areas: Object.fromEntries(groupOfIc),
    names: Object.fromEntries(municipalities.map((m) => [m.code, population.names.get(m.code) ?? m.name])),
    points: [],
    conservation: { areasWithData: municipalities.length, grouped: q1.used, note: "全年に人口がある市区町村だけを組の合計に使う" },
    inputs: ["国土数値情報 高速道路時系列データ N06 (2024年版) の接合部 (一般 IC・スマート IC)", "国勢調査の市区町村別人口 (e-Stat、合併を今の市域に組み替えた系列)", "国土数値情報 行政区域 (2024年1月1日、政令指定都市は市全体)"],
  });

  // ── 問い 2: 工場はインターチェンジの近くに集まったか ──
  const shipment = await loadCitySeries("manufacturing-shipment-amount");
  const icNow = ics.filter((f) => f.properties.s <= 2023 && 2023 <= f.properties.e);
  const distanceGroups: GroupDef[] = [
    { code: "inside", label: "市区町村の中に IC がある", color: "hsl(var(--chart-3))" },
    { code: "under-10", label: "最寄りの IC まで 10km 未満", color: "hsl(var(--chart-2))" },
    { code: "10-30", label: "10〜30km", color: "hsl(var(--chart-4))" },
    { code: "over-30", label: "30km 以上", color: "hsl(var(--muted-foreground))" },
  ];
  const groupOfDistance = new Map<string, string>();
  for (const m of municipalities) {
    const hasInside = icNow.some((ic) => {
      const [lon, lat] = ic.geometry.coordinates;
      const [[w, s], [e, n]] = m.bounds;
      return lon >= w && lon <= e && lat >= s && lat <= n && geoContains(m.feature, [lon, lat]);
    });
    if (hasInside) {
      groupOfDistance.set(m.code, "inside");
      continue;
    }
    const center = geoCentroid(m.feature);
    const nearest = Math.min(...icNow.map((ic) => haversineKm(center as [number, number], ic.geometry.coordinates as [number, number])));
    groupOfDistance.set(m.code, nearest < 10 ? "under-10" : nearest < 30 ? "10-30" : "over-30");
  }
  const shipmentYears = Array.from({ length: 2023 - 1980 + 1 }, (_, i) => 1980 + i);
  // 全国に占める割合 (%)。全年に値がある市区町村だけで分母を作る
  const totals = shipmentYears.map(() => 0);
  const byGroup = new Map(distanceGroups.map((g) => [g.code, shipmentYears.map(() => 0)]));
  const counts2 = new Map(distanceGroups.map((g) => [g.code, 0]));
  let used2 = 0;
  for (const [code, group] of groupOfDistance) {
    const values = shipment.byCode.get(code);
    if (!values || !shipmentYears.every((y) => values.has(y))) continue;
    used2 += 1;
    counts2.set(group, (counts2.get(group) ?? 0) + 1);
    shipmentYears.forEach((y, i) => {
      const v = values.get(y) ?? 0;
      totals[i] += v;
      const arr = byGroup.get(group);
      if (arr) arr[i] += v;
    });
  }
  write({
    slug: "ic-manufacturing",
    generatedAt,
    unitOfArea: "municipality",
    measure: { label: "全国の製造品出荷額に占める割合", unit: "%", note: "組ごとの出荷額の合計が、全国 (集計に使った市区町村の合計) に占める割合" },
    groups: distanceGroups.map((g) => ({ ...g, count: counts2.get(g.code) ?? 0 })),
    years: shipmentYears,
    series: Object.fromEntries([...byGroup].map(([g, arr]) => [g, arr.map((v, i) => (totals[i] > 0 ? Math.round((v / totals[i]) * 1000) / 10 : null))])),
    areas: Object.fromEntries(groupOfDistance),
    names: Object.fromEntries(municipalities.map((m) => [m.code, shipment.names.get(m.code) ?? m.name])),
    points: [],
    conservation: { areasWithData: municipalities.length, grouped: used2, note: "1980〜2023年の全年に出荷額がある市区町村だけを使う。距離は市区町村の重心から、2023年にある IC まで" },
    inputs: ["国土数値情報 高速道路時系列データ N06 (2024年版) の接合部 (2023年にある一般 IC・スマート IC)", "製造品出荷額等の市区町村別 (e-Stat、合併を今の市域に組み替えた系列)", "国土数値情報 行政区域 (2024年1月1日、政令指定都市は市全体)"],
  });

  // ── 問い 3: 新幹線の駅ができた町はどう変わったか ──
  const stations = await readShinkansenStations();
  const firstStation = new Map<string, number>();
  for (const st of stations) {
    const m = municipalityOf(municipalities, st.lon, st.lat);
    if (!m) continue;
    firstStation.set(m.code, Math.min(firstStation.get(m.code) ?? Infinity, st.year));
  }
  const stationGroups: GroupDef[] = [
    { code: "by-1980", label: "1980年までに新幹線の駅ができた", color: "hsl(var(--chart-3))" },
    { code: "1981-1999", label: "1981〜1999年に駅ができた", color: "hsl(var(--chart-2))" },
    { code: "2000-2024", label: "2000年以降に駅ができた", color: "hsl(var(--chart-4))" },
    { code: "none", label: "新幹線の駅が無い", color: "hsl(var(--muted-foreground))" },
  ];
  const groupOfStation = new Map(municipalities.map((m) => [m.code, eraGroup(firstStation.get(m.code) ?? null, icEras, "none")]));
  const q3 = indexSeries(groupOfStation, population.byCode, censusYears, stationGroups);
  write({
    slug: "shinkansen-population",
    generatedAt,
    unitOfArea: "municipality",
    measure: { label: "人口 (1980年 = 100)", unit: "", note: "組ごとの人口の合計を、1980年を 100 とした指数で表す" },
    groups: stationGroups.map((g) => ({ ...g, count: q3.counts.get(g.code) ?? 0 })),
    years: censusYears,
    series: q3.series,
    areas: Object.fromEntries(groupOfStation),
    names: Object.fromEntries(municipalities.map((m) => [m.code, population.names.get(m.code) ?? m.name])),
    points: stations,
    conservation: { areasWithData: municipalities.length, grouped: q3.used, note: "全年に人口がある市区町村だけを組の合計に使う。1950年以前の開業は原典で 1950年にまとめられている" },
    inputs: ["国土数値情報 鉄道時系列データ N05 (2024年版) の駅 (事業者種別 = JR新幹線)", "国勢調査の市区町村別人口 (e-Stat、合併を今の市域に組み替えた系列)", "国土数値情報 行政区域 (2024年1月1日、政令指定都市は市全体)"],
  });

  // ── 問い 4: 空港のある県とない県で、宿泊者数の伸び方は違うか ──
  const airportSummary = JSON.parse(fs.readFileSync(path.join(ROOT, ".local/r2/app/geo/history/airport/summary.json"), "utf8")) as {
    years: number[];
    prefectures: Record<string, { total: number[]; byCategory: Record<string, number[]> }>;
  };
  const yearIndex = airportSummary.years.indexOf(2009);
  const airportGroups: GroupDef[] = [
    { code: "major", label: "拠点空港・国管理空港がある県", color: "hsl(var(--chart-3))" },
    { code: "local", label: "地方管理などの空港だけがある県", color: "hsl(var(--chart-2))" },
    { code: "none", label: "空港が無い県", color: "hsl(var(--muted-foreground))" },
  ];
  const groupOfPref = new Map<string, string>();
  for (const pref of PREF_CODES) {
    const entry = airportSummary.prefectures[pref];
    const major = (entry?.byCategory.hub?.[yearIndex] ?? 0) + (entry?.byCategory.national?.[yearIndex] ?? 0);
    const any = entry?.total[yearIndex] ?? 0;
    groupOfPref.set(pref, major > 0 ? "major" : any > 0 ? "local" : "none");
  }
  const guests = await fetchJson<Rows>(`${R2_PUBLIC}/app/stats/actual-overnight-guests/values.json`);
  const guestSeries = new Map<string, Map<number, number>>();
  const prefNames = new Map<string, string>();
  for (const row of guests.rows) {
    if (typeof row.value !== "number" || row.areaCode === "00000") continue;
    const pref = row.areaCode.slice(0, 2);
    const s = guestSeries.get(pref) ?? new Map<number, number>();
    s.set(Number(row.yearCode.slice(0, 4)), row.value);
    guestSeries.set(pref, s);
    prefNames.set(pref, row.areaName);
  }
  const guestYears = Array.from({ length: 2024 - 2009 + 1 }, (_, i) => 2009 + i);
  const q4 = indexSeries(groupOfPref, guestSeries, guestYears, airportGroups);
  write({
    slug: "airport-tourism",
    generatedAt,
    unitOfArea: "prefecture",
    measure: { label: "延べ宿泊者数 (2009年 = 100)", unit: "", note: "組ごとの延べ宿泊者数の合計を、2009年を 100 とした指数で表す" },
    groups: airportGroups.map((g) => ({ ...g, count: q4.counts.get(g.code) ?? 0 })),
    years: guestYears,
    series: q4.series,
    areas: Object.fromEntries(groupOfPref),
    names: Object.fromEntries(prefNames),
    points: [],
    conservation: { areasWithData: 47, grouped: q4.used, note: "空港の有無は 2009年時点。全年に宿泊者数がある県だけを組の合計に使う" },
    inputs: ["国土数値情報 空港時系列データ N08 (2021年版) の県別空港数 (2009年)", "宿泊旅行統計調査の延べ宿泊者数 (都道府県別)"],
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
