#!/usr/bin/env tsx
/**
 * M01 の分析: 製造業が強い町の強さは、規模か生産性か。
 * 台帳 data/content/analyses.json・figures.json の結論の数字と図をここから再現する。
 *
 *   npm run analysis:frame -- --spec .claude/scripts/analysis/examples/m01-manufacturing.json --out .local/analysis/m01/frame.json
 *   npx tsx .claude/scripts/analysis/m01-factory-size.ts .local/analysis/m01/frame.json .local/analysis/m01
 *
 * 人口あたり出荷額 = 人口あたり工場数 × 1 工場の人数 × 1 人あたり出荷額 の恒等式で町の差を 3 つに分ける。
 * 2 つに分けると「1 工場あたり出荷額」の中で規模と生産性が混ざるので、3 つで分ける。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { geoMercator, geoPath } from "d3-geo";
import sharp from "sharp";
import { feature } from "topojson-client";

import { CHART_THEMES, type ChartTheme } from "../../../apps/remotion/src/features/data-cards/chart-theme";
import { renderGroupedBarsChart, type GroupedBarChart } from "../../../apps/admin/lib/template-grouped-bars";
import { renderRelationshipScatterChart, type ScatterChart } from "../../../apps/admin/lib/template-relationship-scatter";
import { SAMPLE_FRAME, escapeXml, sampleBodyTop, sampleFrame, textWidth } from "../../../apps/admin/lib/template-sample-frame";
import { SERIES_COLORS } from "../../../packages/svg-builder/src/shared/color";
import { correlation } from "./analysis-frame-core.mjs";

import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";

const MIN_POPULATION = 30_000;
const ROBUSTNESS_POPULATIONS = [10_000, 30_000, 100_000];
const SOURCE = "社会・人口統計体系";
const FACTORS = ["工場の数", "1工場の人数", "1人あたり出荷額"] as const;
const OKINAWA = "47";
const EXAMPLES_PER_TYPE = 3;
const PUBLIC_DIR = join(import.meta.dirname ?? __dirname, "../../../apps/web/public");

interface FrameRow {
  code: string;
  name: string;
  shipment_2023: number;
  establishments_2024: number;
  employees_2024: number;
  daytime_2020: number;
  daytimeRatio_2020: number;
}

const [framePath, outDir] = process.argv.slice(2);
if (!framePath || !outDir) {
  console.error("引数: <frame.json> <出力先>");
  process.exit(2);
}
const rows: FrameRow[] = JSON.parse(readFileSync(framePath, "utf8")).rows;
const population = (r: FrameRow) => (r.daytime_2020 / r.daytimeRatio_2020) * 100;
const complete = (r: FrameRow) => r.shipment_2023 > 0 && r.establishments_2024 > 0 && r.employees_2024 > 0 && population(r) > 0;
const covariance = (a: number[], b: number[]) => {
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const ma = mean(a), mb = mean(b);
  return a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0) / (a.length - 1);
};
const median = (values: number[]) => [...values].sort((x, y) => x - y)[Math.floor(values.length / 2)];
const percent = (value: number) => Number((value * 100).toFixed(1));

const measures = (r: FrameRow) => ({
  perCapita: r.shipment_2023 / population(r),
  // 人口 1 万人あたりの事業所数
  density: (r.establishments_2024 / population(r)) * 1e4,
  // 1 事業所あたりの従業者数
  people: r.employees_2024 / r.establishments_2024,
  // 1 人あたり出荷額 (億円。元の単位は百万円)
  productivity: r.shipment_2023 / r.employees_2024 / 100,
});
type Town = FrameRow & ReturnType<typeof measures>;
const townsOver = (minimum: number): Town[] => rows.filter((r) => complete(r) && population(r) >= minimum).map((r) => ({ ...r, ...measures(r) }));

/**
 * log(人口あたり出荷額) の分散を、3 つの項の単独の分散と重なり (2 倍の共分散) へ分ける。重なりを等分すると
 * 「ほぼ 3 分の 1 ずつ」に見えるが、規模と 1 人あたり出荷額の重なりは切り分けられないので分けずに残す。
 */
function decompose(group: Town[]) {
  const density = group.map((t) => Math.log(t.density));
  const people = group.map((t) => Math.log(t.people));
  const productivity = group.map((t) => Math.log(t.productivity));
  const total = group.map((_, i) => density[i] + people[i] + productivity[i]);
  const whole = covariance(total, total);
  const part = (a: number[], b: number[], times = 1) => percent((times * covariance(a, b)) / whole);
  return {
    density: part(density, density),
    people: part(people, people),
    productivity: part(productivity, productivity),
    peopleProductivity: part(people, productivity, 2),
    densityOverlap: Number((part(density, people, 2) + part(density, productivity, 2)).toFixed(1)),
  };
}

const towns = townsOver(MIN_POPULATION);
const robustness = ROBUSTNESS_POPULATIONS.map((minimum) => {
  const group = townsOver(minimum);
  return { minimum, towns: group.length, ...decompose(group) };
});
const shares = decompose(towns);

const ranked = [...towns].sort((a, b) => b.perCapita - a.perCapita);
const quarterOf = (i: number) => ranked.slice(Math.floor((i * ranked.length) / 4), Math.floor(((i + 1) * ranked.length) / 4));
const top = quarterOf(0);
const quarterMedians = [0, 1, 2, 3].map((i) => {
  const group = quarterOf(i);
  return {
    label: ["上位4分の1", "2番目", "3番目", "下位4分の1"][i],
    towns: group.length,
    density: median(group.map((t) => t.density)),
    people: median(group.map((t) => t.people)),
    productivity: median(group.map((t) => t.productivity)),
  };
});
const base = quarterMedians[3];
const quarters = quarterMedians.map((q) => ({
  ...q,
  density: Number(q.density.toFixed(1)),
  people: Number(q.people.toFixed(1)),
  productivity: Number(q.productivity.toFixed(2)),
  densityRatio: Number((q.density / base.density).toFixed(2)),
  peopleRatio: Number((q.people / base.people).toFixed(2)),
  productivityRatio: Number((q.productivity / base.productivity).toFixed(2)),
}));

// 型: 3 つのうち、全町の中央値からの倍率がいちばん大きいもの
const center = { density: median(towns.map((t) => t.density)), people: median(towns.map((t) => t.people)), productivity: median(towns.map((t) => t.productivity)) };
const TYPES = [
  { key: "density", label: "数の町" },
  { key: "people", label: "規模の町" },
  { key: "productivity", label: "1人あたりの町" },
] as const;
const typeOf = (t: Town) => TYPES.reduce((best, type) => (t[type.key] / center[type.key] > t[best.key] / center[best.key] ? type : best));
/** 最大の倍率が 2 番目の何倍か。型の例にするのは差がはっきりした町だけ */
const typeMargin = (t: Town) => {
  const [first, second] = TYPES.map((type) => t[type.key] / center[type.key]).sort((a, b) => b - a);
  return first / second;
};
const CLEAR_TYPE_MARGIN = 1.3;
const REGIONS = [
  { label: "北海道・東北", from: 1, to: 7 },
  { label: "関東", from: 8, to: 14 },
  { label: "中部", from: 15, to: 23 },
  { label: "近畿", from: 24, to: 30 },
  { label: "中国・四国", from: 31, to: 39 },
  { label: "九州・沖縄", from: 40, to: 47 },
];
const countTypes = (group: Town[]) => Object.fromEntries(TYPES.map((type) => [type.label, group.filter((t) => typeOf(t).key === type.key).length]));
const topByType = TYPES.map((type) => ({ ...type, towns: top.filter((t) => typeOf(t).key === type.key) }));
const round = (t: Town) => ({
  rank: ranked.indexOf(t) + 1,
  name: t.name,
  perCapitaManYen: Math.round(t.perCapita * 100),
  density: Number(t.density.toFixed(1)),
  people: Math.round(t.people),
  productivityOkuYen: Number(t.productivity.toFixed(2)),
  type: typeOf(t).label,
});

const logCorrelation = (a: (t: Town) => number, b: (t: Town) => number) =>
  Number((correlation(towns.map((t) => Math.log(a(t))), towns.map((t) => Math.log(b(t)))) ?? Number.NaN).toFixed(2));

const prefectureCounts = new Map<string, number>();
for (const t of top) prefectureCounts.set(t.name.split(" ")[0], (prefectureCounts.get(t.name.split(" ")[0]) ?? 0) + 1);

const shareChart: GroupedBarChart = {
  title: "町の差の内訳",
  meta: `人口3万人以上の${towns.length}市区町村。人口あたり出荷額の差（%）`,
  source: SOURCE,
  groups: ["工場の数", "人数", "1人あたり", "人数×1人", "他の重なり"],
  series: [{ label: "差に占める割合", values: [shares.density, shares.people, shares.productivity, shares.peopleProductivity, shares.densityOverlap] }],
};
const quarterChart: GroupedBarChart = {
  title: "4つの区分の3要素",
  meta: `人口3万人以上の${towns.length}市区町村。下位4分の1を1とした倍率`,
  source: SOURCE,
  groups: quarters.map((q) => q.label),
  series: [
    { label: FACTORS[0], values: quarters.map((q) => q.densityRatio) },
    { label: FACTORS[1], values: quarters.map((q) => q.peopleRatio) },
    { label: FACTORS[2], values: quarters.map((q) => q.productivityRatio) },
  ],
};
const leafName = (t: Town) => t.name.split(" ").at(-1) ?? t.name;
const SCATTER_NAMES = ["府中町", "知多市", "市原市", "田原市"];
const scatterChart: ScatterChart = {
  title: "人の多い工場と1人あたり出荷額",
  meta: "2023年 出荷額・2024年 従業者数と事業所数",
  note: "破線は直線で引いた傾向",
  source: SOURCE,
  level: "municipality",
  xLabel: "1工場の人数（人）",
  yLabel: "1人あたり出荷額（億円）",
  points: towns.map((t) => ({ code: t.code, name: leafName(t), x: t.people, y: t.productivity })),
  labelNames: SCATTER_NAMES,
};

function typeMapSvg(theme: ChartTheme) {
  const read = (name: string) => JSON.parse(readFileSync(join(PUBLIC_DIR, name), "utf8")) as Topology;
  const collection = (topology: Topology) =>
    (feature(topology, Object.values(topology.objects)[0] as GeometryCollection) as FeatureCollection<Geometry, { N03_007: string }>).features;
  const prefectureCode = (f: Feature<Geometry, { N03_007: string }>) => String(f.properties.N03_007).padStart(2, "0");
  const prefectures = collection(read("prefecture-simple.topojson"));
  const mainland = prefectures.filter((f) => prefectureCode(f) !== OKINAWA);
  const legendTop = sampleBodyTop(false);
  const top = legendTop + 56;
  const projection = geoMercator().fitExtent(
    [
      [SAMPLE_FRAME.left, top],
      [SAMPLE_FRAME.right, SAMPLE_FRAME.bodyBottom],
    ],
    { type: "FeatureCollection", features: mainland },
  );
  // 地図は全国を 1 枚で見るだけなので、座標の桁を落として SVG を軽くする
  const path = geoPath(projection).digits(1);
  const colorOf = new Map(topByType.flatMap((type, i) => type.towns.map((t) => [t.code, SERIES_COLORS[i]] as const)));
  const land = mainland.map((f) => `<path d="${path(f)}" fill="${theme.wash}" stroke="${theme.line}" stroke-width="1"/>`).join("");
  const areas = collection(read("municipalities.topojson"))
    .filter((f) => colorOf.has(String(f.properties.N03_007)))
    .map((f) => `<path d="${path(f)}" fill="${colorOf.get(String(f.properties.N03_007))}" stroke="${theme.paper}" stroke-width="0.6"/>`)
    .join("");
  let legendX: number = SAMPLE_FRAME.left;
  const legend = topByType
    .map((type, i) => {
      const label = `${type.label} ${type.towns.length}`;
      const item = `<rect x="${legendX}" y="${legendTop}" width="26" height="26" rx="4" fill="${SERIES_COLORS[i]}"/><text x="${legendX + 38}" y="${legendTop + 24}" font-size="30">${escapeXml(label)}</text>`;
      legendX += 38 + textWidth(label, 30) + 36;
      return item;
    })
    .join("");
  return sampleFrame({
    title: "上位191町の3つの型",
    meta: `人口3万人以上の${towns.length}市区町村のうち人口あたり出荷額の上位4分の1`,
    source: SOURCE,
    theme,
    ariaLabel: "上位191町の3つの型の分布",
    attributes: 'data-image-template="choropleth"',
    body: `${legend}${land}${areas}`,
  });
}

const images: Record<string, (theme: ChartTheme) => string> = {
  "factor-shares": (theme) => renderGroupedBarsChart(shareChart, theme),
  "town-quarters-bars": (theme) => renderGroupedBarsChart(quarterChart, theme),
  "people-productivity-scatter": (theme) => renderRelationshipScatterChart(scatterChart, theme),
  "town-types-map": typeMapSvg,
};
const charts: Record<string, unknown> = {
  "factor-shares": shareChart,
  "town-quarters-bars": quarterChart,
  "people-productivity-scatter": scatterChart,
  "town-types-map": { types: topByType.map((type) => ({ label: type.label, codes: type.towns.map((t) => t.code) })) },
};

const smallTowns = rows.filter((r) => complete(r) && population(r) < MIN_POPULATION).map((r) => ({ ...r, ...measures(r) }));

async function main() {
  mkdirSync(outDir, { recursive: true });
  for (const [name, render] of Object.entries(images)) {
    const light = render(CHART_THEMES.light);
    writeFileSync(join(outDir, `${name}.svg`), light);
    writeFileSync(join(outDir, `${name}-dark.svg`), render(CHART_THEMES.dark));
    writeFileSync(join(outDir, `${name}.json`), `${JSON.stringify(charts[name], null, 2)}\n`);
    await sharp(Buffer.from(light), { limitInputPixels: 40_000_000 }).png().toFile(join(outDir, `${name}.png`));
  }
  const result = {
    towns: towns.length,
    shares,
    robustness,
    quarters,
    center: { density: Number(center.density.toFixed(1)), people: Number(center.people.toFixed(1)), productivity: Number(center.productivity.toFixed(2)) },
    correlations: {
      densityPeople: logCorrelation((t) => t.density, (t) => t.people),
      densityProductivity: logCorrelation((t) => t.density, (t) => t.productivity),
      peopleProductivity: logCorrelation((t) => t.people, (t) => t.productivity),
    },
    types: topByType.map((type) => ({
      label: type.label,
      towns: type.towns.length,
      examples: [...type.towns].filter((t) => typeMargin(t) >= CLEAR_TYPE_MARGIN).sort((a, b) => b.perCapita - a.perCapita).slice(0, EXAMPLES_PER_TYPE).map(round),
    })),
    typesAllTowns: countTypes(towns),
    typesByRegion: REGIONS.map((region) => {
      const inRegion = (t: Town) => Number(t.code.slice(0, 2)) >= region.from && Number(t.code.slice(0, 2)) <= region.to;
      return { label: region.label, towns: towns.filter(inRegion).length, top: top.filter(inRegion).length, ...countTypes(top.filter(inRegion)) };
    }),
    linearPeopleProductivity: Number((correlation(towns.map((t) => t.people), towns.map((t) => t.productivity)) ?? Number.NaN).toFixed(2)),
    usableTowns: rows.filter(complete).length,
    townsUnderFourPeople: rows.filter(complete).filter((r) => r.employees_2024 / r.establishments_2024 < 4).length,
    named: ["愛知県 田原市", "愛知県 知多市", "広島県 府中町", "千葉県 市原市"].flatMap((name) => towns.filter((t) => t.name === name).map(round)),
    topPrefectures: [...prefectureCounts].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count })),
    smallTowns: {
      count: smallTowns.length,
      top: [...smallTowns].sort((a, b) => b.perCapita - a.perCapita).slice(0, 4).map((t) => ({ name: t.name, perCapitaManYen: Math.round(t.perCapita * 100), population: Math.round(population(t)) })),
    },
  };
  writeFileSync(join(outDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 1));
}
main();
