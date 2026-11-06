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
}));
type Town = (typeof towns)[number];

const GROUPS: Array<{ label: string; test: (t: Town) => boolean }> = [
  { label: "人口増", test: (t) => t.populationChange >= 0 },
  { label: "人口減0〜5%", test: (t) => t.populationChange < 0 && t.populationChange >= -5 },
  { label: "人口減5%超", test: (t) => t.populationChange < -5 },
];
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
  };
  writeFileSync(join(outDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}
