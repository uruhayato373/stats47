import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { PREF_NAMES, resolveMetricRecipe, resolveMetricYearFormat, writeStatsValues } from "../lib/stats-values-writer.mjs";

const rows = PREF_NAMES.map((areaName, i) => ({ areaName, yearCode: "2024", value: i + 1 }));

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "stats-values-writer-"));
}

test("書き出す values.json の meta に recipe を焼く (焼かないと週次監査がレシピ未焼き込みとして残数に積む)", () => {
  const outDir = tmpDir();
  const recipe = { kind: "external", configHash: "abc123" };
  writeStatsValues({ metricKey: "example-metric", unit: "人", rows, recipe, outDir, yearFormat: "calendar" });
  const payload = JSON.parse(fs.readFileSync(path.join(outDir, "example-metric", "values.json"), "utf8"));
  assert.deepEqual(payload.meta.recipe, recipe);
  assert.equal(payload.meta.rowCount, 47);
});

test("configHash の無い recipe では書かずに止まる", () => {
  const outDir = tmpDir();
  assert.throws(
    () => writeStatsValues({ metricKey: "example-metric", unit: "人", rows, recipe: { kind: "external" }, outDir, yearFormat: "calendar" }),
    /configHash/,
  );
  assert.equal(fs.existsSync(path.join(outDir, "example-metric")), false);
});

test("正典の buildRecipe から実在 metric の recipe を取り、存在しない key では止まる", () => {
  const recipe = resolveMetricRecipe("heatstroke-deaths");
  assert.equal(recipe.kind, "external");
  assert.match(recipe.configHash, /^[0-9a-f]+$/);
  assert.throws(() => resolveMetricRecipe("no-such-metric-key-for-test"));
});

test("yearName は指標の yearFormat から「YYYY年」「YYYY年度」にする (年だけにしない)", () => {
  for (const [yearFormat, expected] of [["calendar", "2024年"], ["fiscal", "2024年度"], [null, "2024年"]]) {
    const outDir = tmpDir();
    writeStatsValues({ metricKey: "example-metric", unit: "人", rows, recipe: { kind: "external", configHash: "abc" }, outDir, yearFormat });
    const payload = JSON.parse(fs.readFileSync(path.join(outDir, "example-metric", "values.json"), "utf8"));
    assert.equal(payload.rows?.[0]?.yearName ?? payload.values?.[0]?.yearName, expected);
  }
  assert.equal(resolveMetricYearFormat("students-requiring-japanese-instruction"), "fiscal");
});
