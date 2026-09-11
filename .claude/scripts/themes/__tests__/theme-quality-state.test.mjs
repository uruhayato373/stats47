import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readThemeQualityState, writeThemeQualityState } from "../theme-quality-state.mjs";
import { selectLastGoodObservations } from "../theme-quality-core.mjs";

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "theme-quality-state-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return path.join(dir, "quality.json");
}

test("expanded audits retain every observation and definition below the tracked file limit", (t) => {
  const file = fixture(t);
  const rows = Array.from({ length: 1300 }, (_, i) => ({ key: `metric-${i}`, evidence: "x".repeat(450) }));
  const source = { schemaVersion: 1, observedAt: "2026-09-11", summary: { errors: 0 }, definitions: rows, observations: rows, lastGoodObservations: rows, findings: [] };
  assert.ok(Buffer.byteLength(JSON.stringify(source)) > 1_048_576);
  writeThemeQualityState(file, source);
  assert.deepEqual(readThemeQualityState(file), source);
  for (const name of fs.readdirSync(path.dirname(file))) assert.ok(fs.statSync(path.join(path.dirname(file), name)).size <= 1_048_576);
  const before = fs.readFileSync(file, "utf8");
  assert.throws(() => writeThemeQualityState(file, { ...source, observations: [...rows, ...rows] }), /exceeds 1 MiB/);
  assert.equal(fs.readFileSync(file, "utf8"), before);
  assert.deepEqual(readThemeQualityState(file), source);
});

test("migration preserves the last good baseline after a current payload failure", (t) => {
  const file = fixture(t);
  const good = { key: "population", namespace: "ranking", status: "ok", latestCoverage: 47, years: ["2024"] };
  const source = { schemaVersion: 1, definitions: [], observations: [{ ...good, status: "error" }], lastGoodObservations: [good], findings: [] };
  fs.writeFileSync(file, JSON.stringify(source));
  writeThemeQualityState(file, readThemeQualityState(file));
  assert.deepEqual(selectLastGoodObservations(readThemeQualityState(file)), [good]);
  fs.writeFileSync(file.replace(".json", ".lastGoodObservations.json"), "[]\n");
  assert.throws(() => readThemeQualityState(file), /checksum mismatch/);
  fs.unlinkSync(file.replace(".json", ".observations.json"));
  assert.throws(() => readThemeQualityState(file), /ENOENT/);
});
