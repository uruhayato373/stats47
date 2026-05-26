#!/usr/bin/env node
/**
 * Build YoY (year-over-year) population change time-series for 47 prefectures.
 *
 * Pipeline:
 *   1. Read estimated annual population from .local/r2/app/ranking/total-population/values.json
 *      (Source: e-Stat 推計人口, 1975-2024, 47 prefectures × 50 years, no gaps)
 *   2. For each prefecture × year t ∈ [1976, 2024]:
 *        yoyRatio(p, t) = P(p, t) / P(p, t-1)
 *      Range typically 0.97 ~ 1.03 (1.0 = unchanged).
 *   3. Apply 5-year centered moving average:
 *        maRatio(p, t) = mean(yoyRatio(p, t-2..t+2))
 *      Edge years (1976, 1977, 2023, 2024) use a trimmed window of whatever
 *      neighbors are available — so the very first/last years are slightly noisier.
 *   4. Compute global maxAbs = max over (p, t) of |maRatio(p, t) - 1|.
 *      This is used to normalize the diverging colormap so every frame shares
 *      the same color domain (1 - maxAbs … 1 + maxAbs).
 *
 * Output: .local/r2/video/population-yoy-47/timeseries.json
 * Key by 2-digit prefecture code (matches prefecture.topojson N03_007).
 */

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const SOURCE = path.join(
  PROJECT_ROOT,
  ".local/r2/app/ranking/total-population/values.json",
);
const OUT = path.join(
  PROJECT_ROOT,
  "apps/remotion/public/population-yoy-47/timeseries.json",
);
const MA_WINDOW = 5;

function toTwoDigit(areaCode5) {
  return areaCode5.slice(0, 2);
}

function main() {
  const raw = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
  if (raw.areaType !== "prefecture" || !Array.isArray(raw.partitions)) {
    throw new Error("Unexpected source schema");
  }

  // Step 1: index by year → prefecture(2-digit) → { name, value }
  const byYear = new Map(); // year(number) → Map<code2, { name, value }>
  const prefNames = new Map(); // code2 → name (stable across years)

  for (const part of raw.partitions) {
    const year = parseInt(part.yearCode, 10);
    const m = new Map();
    for (const v of part.values) {
      const code2 = toTwoDigit(v.areaCode);
      m.set(code2, { name: v.areaName, value: v.value });
      prefNames.set(code2, v.areaName);
    }
    if (m.size !== 47) {
      throw new Error(`Year ${year} has ${m.size} prefectures, expected 47`);
    }
    byYear.set(year, m);
  }

  const years = [...byYear.keys()].sort((a, b) => a - b);
  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const prefCodes = [...prefNames.keys()].sort();

  // Step 2: YoY ratios for years [firstYear+1 … lastYear]
  // yoy[year][code2] = P(t) / P(t-1)
  const yoy = new Map(); // year → Map<code2, ratio>
  for (let t = firstYear + 1; t <= lastYear; t++) {
    const cur = byYear.get(t);
    const prev = byYear.get(t - 1);
    const m = new Map();
    for (const code of prefCodes) {
      const a = prev.get(code).value;
      const b = cur.get(code).value;
      if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0) {
        throw new Error(`Bad value for ${code} at year ${t}`);
      }
      m.set(code, b / a);
    }
    yoy.set(t, m);
  }
  const yoyYears = [...yoy.keys()].sort((a, b) => a - b);

  // Step 3: 5-year centered moving average over the YoY series.
  // Edge trim: at year t, use available years in [t-2, t+2] ∩ yoyYears.
  const half = Math.floor(MA_WINDOW / 2); // 2
  const ma = new Map(); // year → Map<code2, ratio>
  for (const t of yoyYears) {
    const window = [];
    for (let k = t - half; k <= t + half; k++) {
      if (yoy.has(k)) window.push(k);
    }
    const m = new Map();
    for (const code of prefCodes) {
      let sum = 0;
      for (const k of window) sum += yoy.get(k).get(code);
      m.set(code, sum / window.length);
    }
    ma.set(t, m);
  }

  // Step 4: global maxAbs across all (year, prefecture)
  let maxAbs = 0;
  for (const t of yoyYears) {
    for (const code of prefCodes) {
      const d = Math.abs(ma.get(t).get(code) - 1);
      if (d > maxAbs) maxAbs = d;
    }
  }

  // Compose output
  const frames = yoyYears.map((t) => ({
    year: t,
    yoy: prefCodes.map((code) => ({
      areaCode: code,
      areaName: prefNames.get(code),
      ratio: ma.get(t).get(code),
      rawRatio: yoy.get(t).get(code),
    })),
  }));

  const out = {
    generatedAt: new Date().toISOString(),
    source: {
      file: "app/ranking/total-population/values.json",
      origin: "e-Stat 推計人口 (annual, 10月1日基準)",
      sourceGeneratedAt: raw.generatedAt,
    },
    metricKey: "total-population",
    yearRange: [yoyYears[0], yoyYears[yoyYears.length - 1]],
    movingAverageWindow: MA_WINDOW,
    edgeHandling: "trim (use available neighbors only at series ends)",
    maxAbs,
    prefectureCodes: prefCodes,
    frames,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));

  // Summary
  console.log(`✓ Wrote ${OUT}`);
  console.log(`  years: ${yoyYears[0]}-${yoyYears[yoyYears.length - 1]} (${yoyYears.length} frames)`);
  console.log(`  prefectures: ${prefCodes.length}`);
  console.log(`  global maxAbs: ${(maxAbs * 100).toFixed(2)}% (color domain ±${(maxAbs * 100).toFixed(2)}%)`);

  // Sanity checks: Tokyo growth peak + post-1990 stagnation
  const sample = (code, label) => {
    const peakYear = yoyYears.reduce((best, t) => {
      const r = ma.get(t).get(code);
      return r > (ma.get(best)?.get(code) ?? -Infinity) ? t : best;
    }, yoyYears[0]);
    const minYear = yoyYears.reduce((worst, t) => {
      const r = ma.get(t).get(code);
      return r < (ma.get(worst)?.get(code) ?? Infinity) ? t : worst;
    }, yoyYears[0]);
    console.log(`  ${label} (${code}): peak ${peakYear} (+${((ma.get(peakYear).get(code) - 1) * 100).toFixed(2)}%/yr), trough ${minYear} (${((ma.get(minYear).get(code) - 1) * 100).toFixed(2)}%/yr)`);
  };
  sample("13", "Tokyo");
  sample("01", "Hokkaido");
  sample("47", "Okinawa");
  sample("39", "Kochi");
}

main();
