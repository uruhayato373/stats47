import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  computeRanks,
  computeVerdict,
  pickDominant,
} from "../build-kakei-note-evidence-data.mjs";

const NOTE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(NOTE_DIR, "..", "..", "..");
const SSOT_PATH = join(
  ROOT,
  "packages/data-configs/src/evidence-inventory/kakei-note/expense-evidence.json",
);
const KNOWN_RANKING_KEYS_SRC = readFileSync(
  join(ROOT, "packages/ranking/src/config/known-ranking-keys.ts"),
  "utf8",
);
const METRICS_DIR = join(ROOT, "packages/data-configs/src/metrics");

const CHART_DATA_CAT_NAMES = [
  "食料",
  "住居",
  "光熱・水道",
  "家具・家事用品",
  "被服及び履物",
  "保健医療",
  "交通・通信",
  "教育",
  "教養娯楽",
  "その他の消費支出",
];

function loadSsot() {
  return JSON.parse(readFileSync(SSOT_PATH, "utf8"));
}

test("SSOT has exactly the 10 chart-data.json catNames, each with >=2 evidence", () => {
  const ssot = loadSsot();
  assert.deepEqual(
    ssot.entries.map((e) => e.catName).sort(),
    [...CHART_DATA_CAT_NAMES].sort(),
  );
  for (const entry of ssot.entries) {
    assert.ok(entry.evidence.length >= 2, `${entry.catName}: evidence must be >= 2`);
  }
});

test("SSOT thresholds have strong < weak", () => {
  const ssot = loadSsot();
  assert.ok(ssot.thresholds.strong < ssot.thresholds.weak);
});

test("every shareMetricKey is in KNOWN_RANKING_KEYS", () => {
  const ssot = loadSsot();
  for (const entry of ssot.entries) {
    assert.match(
      KNOWN_RANKING_KEYS_SRC,
      new RegExp(`"${entry.shareMetricKey}"`),
      `${entry.shareMetricKey} not in KNOWN_RANKING_KEYS`,
    );
  }
});

test("every evidence metricKey has an isActive:true config file", () => {
  const ssot = loadSsot();
  for (const entry of ssot.entries) {
    for (const ev of entry.evidence) {
      const configPath = join(METRICS_DIR, `${ev.metricKey}.ts`);
      let src;
      try {
        src = readFileSync(configPath, "utf8");
      } catch {
        assert.fail(`${ev.metricKey}: config file does not exist`);
      }
      assert.match(src, /"isActive":\s*true/, `${ev.metricKey}: isActive must be true`);
      assert.match(
        ev.direction,
        /^(same|inverse)$/,
        `${ev.metricKey}: direction must be "same" or "inverse"`,
      );
    }
  }
});

test("pickDominant picks the max |ratio-1|, first wins ties", () => {
  const breakdown = [
    { catName: "食料", ratio: 1.05 },
    { catName: "教育", ratio: 1.44 },
    { catName: "住居", ratio: 0.7 },
  ];
  assert.equal(pickDominant(breakdown).catName, "教育");

  const tied = [
    { catName: "A", ratio: 1.5 },
    { catName: "B", ratio: 0.5 },
  ];
  assert.equal(pickDominant(tied).catName, "A");
});

test("computeRanks sorts descending and gives ties the smaller (competition) rank", () => {
  const ranked = computeRanks([
    { areaCode: "01000", areaName: "北海道", value: 10 },
    { areaCode: "02000", areaName: "青森県", value: 10 },
    { areaCode: "03000", areaName: "岩手県", value: 8 },
  ]);
  assert.deepEqual(
    ranked.map((r) => r.rank),
    [1, 1, 3],
  );
});

test("computeRanks drops non-finite/null values", () => {
  const ranked = computeRanks([
    { areaCode: "01000", areaName: "北海道", value: 10 },
    { areaCode: "02000", areaName: "青森県", value: null },
    { areaCode: "03000", areaName: "岩手県", value: NaN },
  ]);
  assert.equal(ranked.length, 1);
});

test("computeVerdict: same-direction high rank (near #1) is strong", () => {
  const thresholds = { strong: 15, weak: 31 };
  const v = computeVerdict({ side: "above", direction: "same", rank: 1, thresholds });
  assert.equal(v.expectedHigh, true);
  assert.equal(v.effectiveRank, 1);
  assert.equal(v.verdict, "strong");
});

test("computeVerdict: inverse direction flips expectedHigh and effectiveRank", () => {
  const thresholds = { strong: 15, weak: 31 };
  // side=above + direction=inverse => expectedHigh=false => a low rank (near #1) is a BAD sign,
  // so effectiveRank = 48-rank should be large (contrary), and a high rank (near #47) should be strong.
  const nearTop = computeVerdict({ side: "above", direction: "inverse", rank: 1, thresholds });
  assert.equal(nearTop.expectedHigh, false);
  assert.equal(nearTop.effectiveRank, 47);
  assert.equal(nearTop.verdict, "contrary");

  const nearBottom = computeVerdict({ side: "above", direction: "inverse", rank: 47, thresholds });
  assert.equal(nearBottom.effectiveRank, 1);
  assert.equal(nearBottom.verdict, "strong");
});

test("computeVerdict: effectiveRank exactly at threshold boundaries", () => {
  const thresholds = { strong: 15, weak: 31 };
  assert.equal(
    computeVerdict({ side: "above", direction: "same", rank: 15, thresholds }).verdict,
    "strong",
  );
  assert.equal(
    computeVerdict({ side: "above", direction: "same", rank: 16, thresholds }).verdict,
    "weak",
  );
  assert.equal(
    computeVerdict({ side: "above", direction: "same", rank: 31, thresholds }).verdict,
    "weak",
  );
  assert.equal(
    computeVerdict({ side: "above", direction: "same", rank: 32, thresholds }).verdict,
    "contrary",
  );
});

test("kumamoto fixture reproduces the known dominant + evidence shape (regression)", () => {
  const chartData = JSON.parse(
    readFileSync(join(ROOT, "docs/31_note記事原稿/a-kakei-kumamoto/chart-data.json"), "utf8"),
  );
  const dominant = pickDominant(chartData.categoryBreakdown);
  assert.equal(dominant.catName, "教育");
  assert.ok(dominant.ratio > 1.4 && dominant.ratio < 1.45);
});
