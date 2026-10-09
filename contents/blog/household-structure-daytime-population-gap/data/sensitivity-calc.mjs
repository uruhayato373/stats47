// 本文の追加計算 (除外感度・偏相関・順位相関・無作為除外) を散布図と同じ47点から再現する。
// 実行: node sensitivity-calc.mjs  (結果は nuclear-family-households-ratio--day-time-population-ratio-scatter.source.json の extraCalculations と一致)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const SEED = 47;
const TRIALS = 10000;
const EXCLUDE_N = 8;

const sc = JSON.parse(fs.readFileSync(path.join(dir, "nuclear-family-households-ratio--day-time-population-ratio-scatter.json"), "utf8"));
const sp = JSON.parse(fs.readFileSync(path.join(dir, "single-person-household-ratio-prefecture-rankings.json"), "utf8"));
const spMap = new Map(sp.data.map((r) => [r.areaName, r.value]));
const pop = await (await fetch("https://storage.stats47.jp/app/ranking/total-population/values.json")).json();
const pop2025 = new Map(pop.partitions.find((p) => p.yearCode === "2025").values.map((v) => [v.areaName, v.value]));

const pearson = (a, b) => {
  const n = a.length, ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; }
  return sab / Math.sqrt(saa * sbb);
};
const partial = (ab, az, bz) => (ab - az * bz) / Math.sqrt((1 - az * az) * (1 - bz * bz));
const ranks = (a) => {
  const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]);
  const r = new Array(a.length);
  for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2 + 1; i = j + 1; }
  return r;
};
const rOf = (pts) => pearson(pts.map((p) => p.x), pts.map((p) => p.y));
const without = (names) => sc.points.filter((p) => !names.includes(p.label));
const rd = (v) => Math.round(v * 100) / 100;

const tokyoArea = ["東京都", "埼玉県", "千葉県", "神奈川県"];
const kinki = ["大阪府", "京都府", "兵庫県", "奈良県", "滋賀県", "和歌山県"];
const eight = [...tokyoArea, "大阪府", "京都府", "兵庫県", "奈良県"];
const far8 = [...sc.points].sort((a, b) => Math.abs(b.y - 100) - Math.abs(a.y - 100)).slice(0, EXCLUDE_N).map((p) => p.label);

const x = sc.points.map((p) => p.x), y = sc.points.map((p) => p.y);
const s = sc.points.map((p) => spMap.get(p.label)), z = sc.points.map((p) => pop2025.get(p.label));
const noTokyo = sc.points.map((p, i) => i).filter((i) => sc.points[i].label !== "東京都");

function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(SEED);
const rs = [];
for (let t = 0; t < TRIALS; t++) {
  const pool = [...sc.points];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  rs.push(rOf(pool.slice(EXCLUDE_N)));
}
rs.sort((a, b) => a - b);
const median = (rs[TRIALS / 2 - 1] + rs[TRIALS / 2]) / 2;
const shareAtLeast = rs.filter((r) => r >= -0.46).length / TRIALS;

const rxy = pearson(x, y);
const out = {
  n: sc.points.length,
  pearsonAll: rd(rxy),
  pearsonWithoutTokyo: rd(rOf(without(["東京都"]))),
  spearman: rd(pearson(ranks(x), ranks(y))),
  withoutTokyoArea4: { excluded: tokyoArea, n: 47 - tokyoArea.length, r: rd(rOf(without(tokyoArea))) },
  without8Prefectures: { excluded: eight, n: 47 - eight.length, r: rd(rOf(without(eight))) },
  withoutKinki6Only: { excluded: kinki, n: 47 - kinki.length, r: rd(rOf(without(kinki))) },
  withoutTokyoArea4AndKinki6: { excluded: [...tokyoArea, ...kinki], n: 47 - tokyoArea.length - kinki.length, r: rd(rOf(without([...tokyoArea, ...kinki]))) },
  withoutFarthestFrom100: { excluded: far8, n: 47 - EXCLUDE_N, r: rd(rOf(without(far8))) },
  randomExclusion: { seed: SEED, prng: "mulberry32", trials: TRIALS, excludedPerTrial: EXCLUDE_N, medianR: rd(median), shareAtOrAbove_minus0_46: Math.round(shareAtLeast * 1000) / 10 + "%" },
  singlePerson: {
    sourceKey: "single-person-household-ratio", year: "2020",
    pearsonWithDaytimeRatio: rd(pearson(s, y)),
    pearsonWithDaytimeRatioWithoutTokyo: rd(pearson(noTokyo.map((i) => s[i]), noTokyo.map((i) => y[i]))),
    partialNuclearVsDaytimeControllingSinglePerson: rd(partial(rxy, pearson(x, s), pearson(y, s))),
  },
  partialPopulationRecomputed: { controlKey: "total-population", year: "2025", r: rd(partial(rxy, pearson(x, z), pearson(y, z))) },
};
console.log(JSON.stringify(out, null, 2));
