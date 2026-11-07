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
 * 工場の数と 1 工場の人数の配分は事業所数の裾切りで大きく動くので、結論は 2 つの積の「人の厚み」
 * (人口あたり従業者数) と 1 人あたり出荷額で出し、4 段の隣どうしの差で読む。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

import { CHART_THEMES, type ChartTheme } from "../../../apps/remotion/src/features/data-cards/chart-theme";
import { renderGroupedBarsChart, type GroupedBarChart } from "../../../apps/admin/lib/template-grouped-bars";
import { renderRelationshipScatterChart, type ScatterChart } from "../../../apps/admin/lib/template-relationship-scatter";
import { correlation } from "./analysis-frame-core.mjs";

const MIN_POPULATION = 30_000;
const ROBUSTNESS_POPULATIONS = [10_000, 30_000, 100_000];
const SOURCE = "社会・人口統計体系";
const THICKNESS_LABEL = "人の厚み";
const PRODUCTIVITY_LABEL = "1人あたり出荷額";
const STEP_LABELS = ["下位と3番目", "3番目と2番目", "2番目と上位"];
const BOOTSTRAP_ROUNDS = 2000;
const BOOTSTRAP_SEED = 47;
const TOKYO_WARD_PREFIX = "131";

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
  // 人口 1 万人あたりの従業者数 (人の厚み)。事業所数を通らないので、工場の数と 1 工場の人数の配分より裾切りに左右されにくい
  thickness: (r.employees_2024 / population(r)) * 1e4,
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

/** log(人口あたり出荷額) の分散を、人の厚みと 1 人あたり出荷額、2 つの重なりへ分ける。 */
function wholeShares(group: Town[]) {
  const thickness = group.map((t) => Math.log(t.thickness));
  const productivity = group.map((t) => Math.log(t.productivity));
  const total = group.map((_, i) => thickness[i] + productivity[i]);
  const whole = covariance(total, total);
  return {
    thickness: percent(covariance(thickness, thickness) / whole),
    productivity: percent(covariance(productivity, productivity) / whole),
    overlap: percent((2 * covariance(thickness, productivity)) / whole),
  };
}

/**
 * 4 段の隣どうしの差を 3 要素へ分ける。対数の平均の差は足すと全体の差に一致するので割合として読める。
 * 分散の分解を上位の町だけで行うと打ち消し合うが、段の間の差ならその問題は起きない。
 */
function stepShares(group: Town[], trimTop = 0, pieces = 4, trimKey: "productivity" | "thickness" = "productivity") {
  const sorted = [...group].sort((a, b) => a.perCapita - b.perCapita);
  const means = Array.from({ length: pieces }, (_, i) => {
    const slice = sorted.slice(Math.floor((i * sorted.length) / pieces), Math.floor(((i + 1) * sorted.length) / pieces));
    // 最上段からどちらかの要素の高い町を抜き、最上段の形が端の町にどれだけ頼るかを両方で比べる
    const part = i === pieces - 1 ? [...slice].sort((a, b) => b[trimKey] - a[trimKey]).slice(Math.floor(slice.length * trimTop)) : slice;
    const mean = (pick: (t: Town) => number) => part.reduce((sum, t) => sum + Math.log(pick(t)), 0) / part.length;
    return [mean((t) => t.density), mean((t) => t.people), mean((t) => t.productivity)];
  });
  return means.slice(1).map((_, i) => {
    const label = STEP_LABELS[i] ?? `${i + 1}段目`;
    const gaps = means[i + 1].map((value, j) => value - means[i][j]);
    const whole = gaps.reduce((sum, gap) => sum + gap, 0);
    return { label, ratio: Math.exp(whole), density: gaps[0] / whole, people: gaps[1] / whole, productivity: gaps[2] / whole, thickness: (gaps[0] + gaps[1]) / whole };
  });
}
const FACTOR_KEYS = ["density", "people", "productivity", "thickness"] as const;
const steps = stepShares(towns);
const stepResult = (group: Town[], trimTop = 0, pieces = 4, trimKey: "productivity" | "thickness" = "productivity") => stepShares(group, trimTop, pieces, trimKey).map((step) => ({
  label: step.label,
  ratio: Number(step.ratio.toFixed(2)),
  density: percent(step.density),
  people: percent(step.people),
  productivity: percent(step.productivity),
  thickness: percent(step.thickness),
}));
const daytimeTowns: Town[] = rows.filter((r) => complete(r) && r.daytime_2020 >= MIN_POPULATION).map((r) => {
  const m = measures(r);
  return { ...r, ...m, perCapita: r.shipment_2023 / r.daytime_2020, thickness: (r.employees_2024 / r.daytime_2020) * 1e4, density: (r.establishments_2024 / r.daytime_2020) * 1e4 };
});
const stepRobustness = [
  ...ROBUSTNESS_POPULATIONS.map((minimum) => ({ label: `人口${minimum / 10_000}万人以上`, group: townsOver(minimum) })),
  { label: "人口3万人以上で東京23区を除く", group: towns.filter((t) => !t.code.startsWith(TOKYO_WARD_PREFIX)) },
].map(({ label, group }) => ({ label, towns: group.length, steps: stepResult(group) }));

/** 同じ乱数で再現できる復元抽出。95% の幅を出す */
function bootstrapSteps() {
  let state = BOOTSTRAP_SEED;
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rounds = Array.from({ length: BOOTSTRAP_ROUNDS }, () =>
    stepShares(towns.map(() => towns[Math.floor(random() * towns.length)])));
  return STEP_LABELS.map((label, i) => ({
    label,
    ...Object.fromEntries(FACTOR_KEYS.map((key) => {
      const values = rounds.map((round) => round[i][key]).sort((a, b) => a - b);
      return [key, [percent(values[Math.floor(values.length * 0.025)]), percent(values[Math.floor(values.length * 0.975)])]];
    })),
  }));
}

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
    thickness: median(group.map((t) => t.thickness)),
  };
});
const base = quarterMedians[3];
const quarters = quarterMedians.map((q) => ({
  ...q,
  density: Number(q.density.toFixed(1)),
  people: Number(q.people.toFixed(1)),
  productivity: Number(q.productivity.toFixed(2)),
  thickness: Math.round(q.thickness),
  densityRatio: Number((q.density / base.density).toFixed(2)),
  peopleRatio: Number((q.people / base.people).toFixed(2)),
  productivityRatio: Number((q.productivity / base.productivity).toFixed(2)),
}));

const round = (t: Town) => ({
  rank: ranked.indexOf(t) + 1,
  name: t.name,
  perCapitaManYen: Math.round(t.perCapita * 100),
  thickness: Math.round(t.thickness),
  people: Math.round(t.people),
  productivityOkuYen: Number(t.productivity.toFixed(2)),
});

const logCorrelation = (a: (t: Town) => number, b: (t: Town) => number) =>
  Number((correlation(towns.map((t) => Math.log(a(t))), towns.map((t) => Math.log(b(t)))) ?? Number.NaN).toFixed(2));

const prefectureCounts = new Map<string, number>();
for (const t of top) prefectureCounts.set(t.name.split(" ")[0], (prefectureCounts.get(t.name.split(" ")[0]) ?? 0) + 1);

const whole = wholeShares(towns);
const shareChart: GroupedBarChart = {
  title: "全体の差の内訳",
  meta: `人口3万人以上の${towns.length}市区町村。対数の分散に占める割合（%）`,
  source: SOURCE,
  groups: [THICKNESS_LABEL, "1人あたり", "重なり"],
  series: [{ label: "差に占める割合", values: [whole.thickness, whole.productivity, whole.overlap] }],
};
const stepChart: GroupedBarChart = {
  title: "段ごとの差の内訳",
  meta: `人口3万人以上の${towns.length}市区町村を4段に分けた隣どうしの差（%）`,
  source: SOURCE,
  groups: STEP_LABELS,
  series: [
    { label: THICKNESS_LABEL, values: steps.map((step) => percent(step.thickness)) },
    { label: PRODUCTIVITY_LABEL, values: steps.map((step) => percent(step.productivity)) },
  ],
};
const leafName = (t: Town) => t.name.split(" ").at(-1) ?? t.name;
const SCATTER_NAMES = ["苅田町", "黒部市", "知多市"];
const scatterChart: ScatterChart = {
  title: "人の厚みと1人あたり出荷額",
  meta: "2024年の調査（出荷額は2023年の実績）",
  note: "両軸は対数。破線は傾向",
  logAxes: true,
  source: SOURCE,
  level: "municipality",
  xLabel: "人口1万人あたりの従業者数（人）",
  yLabel: "1人あたり出荷額（億円）",
  points: towns.map((t) => ({ code: t.code, name: leafName(t), x: t.thickness, y: t.productivity })),
  labelNames: SCATTER_NAMES,
};

const images: Record<string, (theme: ChartTheme) => string> = {
  "gap-steps-bars": (theme) => renderGroupedBarsChart(stepChart, theme),
  "factor-shares-bars": (theme) => renderGroupedBarsChart(shareChart, theme),
  "workforce-productivity-scatter": (theme) => renderRelationshipScatterChart(scatterChart, theme),
};
const charts: Record<string, unknown> = {
  "gap-steps-bars": stepChart,
  "factor-shares-bars": shareChart,
  "workforce-productivity-scatter": scatterChart,
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
    wholeShares: whole,
    robustness,
    center: { thickness: Math.round(median(towns.map((t) => t.thickness))), productivity: Number(median(towns.map((t) => t.productivity)).toFixed(2)) },
    // 人口あたり出荷額の上位 20 町のうち、2 つの要素がどちらも全町の上位 4 分の 1 に入る町の数
    bothHighInTop20: ranked.slice(0, 20).filter((t) => [...towns].sort((a, b) => b.thickness - a.thickness).indexOf(t) < towns.length / 4 && [...towns].sort((a, b) => b.productivity - a.productivity).indexOf(t) < towns.length / 4).length,
    stepsFivePieces: stepResult(towns, 0, 5),
    stepTrim: [0.1, 0.2].map((rate) => ({ rate, steps: stepResult(towns, rate) })),
    stepTrimThickness: [0.1, 0.2].map((rate) => ({ rate, steps: stepResult(towns, rate, 4, "thickness") })),
    // 分母を昼間人口にした確認。工場へ通う人を町の人口に含めても形が残るか
    stepsDaytime: stepResult(daytimeTowns),
    steps: stepResult(towns),
    stepIntervals: bootstrapSteps(),
    stepRobustness,
    bottomTowns: [...ranked].reverse().slice(0, 4).map((t) => t.name),
    quarters,
    correlations: {
      thicknessProductivity: logCorrelation((t) => t.thickness, (t) => t.productivity),
    },
    usableTowns: rows.filter(complete).length,
    townsUnderFourPeople: rows.filter(complete).filter((r) => r.employees_2024 / r.establishments_2024 < 4).length,
    named: ["福岡県 苅田町", "愛知県 豊田市", "愛知県 田原市", "愛知県 知多市", "富山県 黒部市", "千葉県 市原市"].flatMap((name) => towns.filter((t) => t.name === name).map(round)),
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
