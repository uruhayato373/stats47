#!/usr/bin/env tsx
/**
 * H01 の分析: 空き家が増えているのは、人口が減った町だけか。
 * 台帳 data/content/analyses.json の結論の数字をここから再現する。図と記事の下書きは npm run analysis:draft が結果の JSON から作る。
 *
 *   npm run analysis:frame -- --spec .claude/scripts/analysis/examples/h01-vacancy.json --out .local/analysis/h01/frame.json
 *   npx tsx .claude/scripts/analysis/h01-vacancy-population.ts .local/analysis/h01/frame.json .local/analysis/h01
 *
 * 市ごとの 5 年変化は標本の揺れが大きく順位にできないので、人口の増減で 3 つに分けた集団の傾向で読む。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { correlation } from "./analysis-frame-core.mjs";

interface FrameRow {
  code: string;
  name: string;
  vacancy_2013: number;
  vacancy_2018: number;
  vacancy_2023: number;
  vacant_2013: number;
  vacant_2023: number;
  abandoned_2023: number;
  rental_2023: number;
  population_2010: number;
  population_2020: number;
}

const [framePath, outDir] = process.argv.slice(2);
if (!framePath || !outDir) {
  console.error("引数: <frame.json> <出力先>");
  process.exit(2);
}
const frame = JSON.parse(readFileSync(framePath, "utf8"));
const rows: FrameRow[] = frame.rows;
const round = (v: number, digits = 2) => Number(v.toFixed(digits));
const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  const m = s.length / 2;
  return Number.isInteger(m) ? (s[m - 1] + s[m]) / 2 : s[Math.floor(m)];
};
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

const towns = rows.map((r) => ({
  ...r,
  populationChange: (r.population_2020 / r.population_2010 - 1) * 100,
  vacancyChange: r.vacancy_2023 - r.vacancy_2013,
  vacantIncrease: r.vacant_2023 - r.vacant_2013,
  // 空き家数と空き家率から逆算した総住宅数
  housing2013: (r.vacant_2013 / r.vacancy_2013) * 100,
  housing2023: (r.vacant_2023 / r.vacancy_2023) * 100,
}));
type Town = (typeof towns)[number];

const GROUPS: Array<{ label: string; test: (t: Town) => boolean }> = [
  { label: "人口増", test: (t) => t.populationChange >= 0 },
  { label: "人口減0〜5%", test: (t) => t.populationChange < 0 && t.populationChange >= -5 },
  { label: "人口減5%超", test: (t) => t.populationChange < -5 },
];
const MAN = 10_000;
const totalIncrease = sum(towns.map((t) => t.vacantIncrease));
const totalStock = sum(towns.map((t) => t.vacant_2013));
const groups = GROUPS.map(({ label, test }) => {
  const members = towns.filter(test);
  const increase = sum(members.map((t) => t.vacantIncrease));
  return {
    label,
    towns: members.length,
    medianChange: round(median(members.map((t) => t.vacancyChange))),
    risingShare: round((members.filter((t) => t.vacancyChange > 0).length / members.length) * 100, 1),
    increase,
    increaseShare: round((increase / totalIncrease) * 100, 1),
    stock2013Share: round((sum(members.map((t) => t.vacant_2013)) / totalStock) * 100, 1),
    grossIncrease: sum(members.map((t) => Math.max(t.vacantIncrease, 0))),
    grossDecrease: sum(members.map((t) => Math.min(t.vacantIncrease, 0))),
    townsWithIncrease: members.filter((t) => t.vacantIncrease > 0).length,
    vacancyRate2013: round((sum(members.map((t) => t.vacant_2013)) / sum(members.map((t) => t.housing2013))) * 100, 1),
    housingGrowth: round((sum(members.map((t) => t.housing2023)) / sum(members.map((t) => t.housing2013)) - 1) * 100, 1),
    // 空き家の増減 = 率の変化 × 平均の住宅数 + 住宅数の増減 × 平均の率
    rateEffectMan: round(sum(members.map((t) => ((t.vacancyChange / 100) * (t.housing2013 + t.housing2023)) / 2)) / MAN, 1),
    housingEffectMan: round(sum(members.map((t) => ((t.housing2023 - t.housing2013) * (t.vacancy_2013 + t.vacancy_2023)) / 200)) / MAN, 1),
    medianChange2013to2018: round(median(members.map((t) => t.vacancy_2018 - t.vacancy_2013))),
    medianChange2018to2023: round(median(members.map((t) => t.vacancy_2023 - t.vacancy_2018))),
    medianAbandoned2023: round(median(members.map((t) => t.abandoned_2023))),
    medianRental2023: round(median(members.map((t) => t.rental_2023))),
  };
});

// 表から抜けた町が人口の減り方で偏っていないかを読む
const droppedChanges = (frame.droppedRows as Partial<FrameRow>[])
  .filter((d) => (d.population_2010 ?? 0) > 0 && (d.population_2020 ?? 0) > 0)
  .map((d) => (d.population_2020! / d.population_2010! - 1) * 100);

const r = (a: number[], b: number[]) => round(correlation(a, b) ?? Number.NaN);
const populationChanges = towns.map((t) => t.populationChange);

// 県の中でも同じ向きか。大都市圏と地方の差だけで出た相関なら、県の中では消える
const byPrefecture = new Map<string, Town[]>();
for (const t of towns) byPrefecture.set(t.code.slice(0, 2), [...(byPrefecture.get(t.code.slice(0, 2)) ?? []), t]);
const withinPrefecture = [...byPrefecture.values()]
  .filter((members) => members.length >= 10)
  .map((members) => correlation(members.map((t) => t.populationChange), members.map((t) => t.vacancyChange)) ?? 0);

// 線引きを変えたとき、その線より人口が増えた側の町が増加分に占める割合
const populationLines = [0, -2, -5, -10].map((line) => {
  const members = towns.filter((t) => t.populationChange >= line);
  return { line, towns: members.length, netShare: round((sum(members.map((t) => t.vacantIncrease)) / totalIncrease) * 100, 1) };
});
// 町の規模で分けても同じ向きか
const populationSizes = [[0, 20_000], [20_000, 50_000], [50_000, 100_000], [100_000, Infinity]].map(([from, to]) => {
  const members = towns.filter((t) => t.population_2020 >= from && t.population_2020 < to);
  return { from, towns: members.length, correlation: r(members.map((t) => t.populationChange), members.map((t) => t.vacancyChange)) };
});
// 町の取り方による 97.2% の幅。町を選び直して計算する (乱数は固定して結果を再現できるようにする)
const BOOTSTRAP_ROUNDS = 5_000;
const BOOTSTRAP_SEED = 47;
function declineShareInterval() {
  let state = BOOTSTRAP_SEED;
  const next = () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
  const shares: number[] = [];
  for (let round = 0; round < BOOTSTRAP_ROUNDS; round++) {
    let growth = 0, total = 0;
    for (let i = 0; i < towns.length; i++) {
      const town = towns[Math.floor(next() * towns.length)];
      total += town.vacantIncrease;
      if (town.populationChange >= 0) growth += town.vacantIncrease;
    }
    shares.push((1 - growth / total) * 100);
  }
  shares.sort((a, b) => a - b);
  return { low: round(shares[Math.floor(BOOTSTRAP_ROUNDS * 0.025)], 1), high: round(shares[Math.floor(BOOTSTRAP_ROUNDS * 0.975)], 1) };
}

// 別荘地: 賃貸用と「賃貸・売却・二次的以外」を除いた残りの率が大きい町
const RESORT_RATE = 15;
const nonResort = towns.filter((t) => t.vacancy_2023 - t.abandoned_2023 - t.rental_2023 <= RESORT_RATE);
const totalGrossIncrease = sum(groups.map((g) => g.grossIncrease));
// 折れ線: 区分ごとの空き家率の中央値を 3 時点で並べる
const VACANCY_YEARS = [2013, 2018, 2023] as const;
const trendSeries = GROUPS.map(({ label, test }) => ({
  label,
  points: VACANCY_YEARS.map((year) => ({ x: `${year}年`, value: round(median(towns.filter(test).map((t) => t[`vacancy_${year}`]))) })),
}));
// 散布図: 町の値は点としてだけ描き、名前は出さない
const pointsOf = (value: (t: Town) => number) => towns.map((t) => ({ code: t.code, name: t.name, x: round(t.populationChange), y: value(t) }));

mkdirSync(outDir, { recursive: true });
main();

function main() {
  const result = {
    towns: towns.length,
    correlationChange: r(populationChanges, towns.map((t) => t.vacancyChange)),
    fiveYearReliability: r(towns.map((t) => t.vacancy_2018 - t.vacancy_2013), towns.map((t) => t.vacancy_2023 - t.vacancy_2018)),
    declineShareOfIncrease: round((1 - groups[0].increase / totalIncrease) * 100, 1),
    droppedTowns: frame.droppedRows.length,
    medianPopulationChange: round(median(populationChanges), 1),
    medianPopulationChangeDropped: round(median(droppedChanges), 1),
    totalIncrease,
    groups,
    withinPrefecture: {
      prefectures: withinPrefecture.length,
      negative: withinPrefecture.filter((v) => v < 0).length,
      median: round(median(withinPrefecture)),
    },
    correlationAbandoned2023: r(populationChanges, towns.map((t) => t.abandoned_2023)),
    correlationRental2023: r(populationChanges, towns.map((t) => t.rental_2023)),
    // 差し引きの増加全体を、率の変化の分と住宅の増減の分へ分ける
    changeShares: {
      rate: round((sum(groups.map((g) => g.rateEffectMan)) / sum(groups.map((g) => g.rateEffectMan + g.housingEffectMan))) * 100, 1),
      housing: round((sum(groups.map((g) => g.housingEffectMan)) / sum(groups.map((g) => g.rateEffectMan + g.housingEffectMan))) * 100, 1),
    },
    declineShareInterval: declineShareInterval(),
    totalGrossIncrease,
    growthShareOfGrossIncrease: round((groups[0].grossIncrease / totalGrossIncrease) * 100, 1),
    trendSeries,
    abandonedPoints: pointsOf((t) => t.abandoned_2023),
    rentalPoints: pointsOf((t) => t.rental_2023),
    populationLines,
    populationSizes,
    resort: { towns: towns.length - nonResort.length, correlationWithout: r(nonResort.map((t) => t.populationChange), nonResort.map((t) => t.vacancyChange)) },
  };
  writeFileSync(join(outDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}
