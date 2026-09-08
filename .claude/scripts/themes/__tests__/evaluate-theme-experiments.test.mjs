import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { assessCheckpoint, observeCheckpoint, recordCheckpoint } from "../evaluate-theme-experiments.mjs";

const SCRIPT = fileURLToPath(new URL("../evaluate-theme-experiments.mjs", import.meta.url));
const NOW = "2026-09-08";

function experiment() {
  return {
    experimentId: "THEME-EXP-TEST", themeKey: "climate", verdict: "pending",
    changeType: "structure", hypothesis: "章の構成を改善する", primaryKpi: "ga4.pageViews",
    startedAt: "2026-07-14", evaluateAt: { d7: "2026-07-21", d28: "2026-08-11", d56: "2026-09-08" },
    baseline: { "ga4.pageViews": 300 }, baselineScopes: { ga4: "Japan" },
    baselineStatuses: { "ga4.pageViews": "measured" }, guardrailKpis: [], evidenceRefs: ["snapshot.csv"], result: null,
  };
}

function theme(overrides = {}) {
  return {
    themeKey: "climate", dataQualityStatus: "ok", dataQuality: { observedAt: NOW, keysChecked: 4 },
    metrics: { ga4: {
      status: "measured", pageViews: 400, scope: "Japan", windowDays: 56,
      periodStart: "2026-07-14", periodEnd: "2026-09-07", weeks: ["2026-W32", "2026-W36"], ...overrides,
    } },
  };
}

test("d7 records quality, without presenting rolling traffic as post-publication effect", () => {
  const record = observeCheckpoint(experiment(), "d7", theme(), NOW);
  assert.equal(record.status, "quality-only");
  assert.deepEqual(record.values, {});
  assert.equal(record.quality.keysChecked, 4);
});

test("d28 cannot reuse the portfolio's 56-day rolling total", () => {
  const record = observeCheckpoint(experiment(), "d28", theme(), NOW);
  assert.equal(record.status, "insufficient-data");
  assert.ok(record.reasons.includes("complete-window-unavailable"));
});

test("a fully post-publication 28-day window is provisional, never eligible", () => {
  const record = observeCheckpoint(experiment(), "d28", theme({ windowDays: 28, periodEnd: "2026-08-10", weeks: ["2026-W32"] }), "2026-08-11");
  assert.equal(record.status, "provisional");
});

test("d56 delayed acquisition must not include even one pre-publication day", () => {
  const record = observeCheckpoint(experiment(), "d56", theme({ periodStart: "2026-07-13", periodEnd: "2026-09-06" }), NOW);
  assert.equal(record.status, "insufficient-data");
  assert.ok(record.reasons.includes("window-includes-pre-publication"));
});

test("d56 accepts a complete 56-day Japan window beginning on the publication date", () => {
  assert.equal(observeCheckpoint(experiment(), "d56", theme(), NOW).status, "eligible");
});

test("overlapping/incomplete date spans, duplicate report references and unknown scope cannot qualify", () => {
  for (const patch of [
    { periodEnd: "2026-08-31" }, { weeks: ["2026-W36", "2026-W36"] },
    { weeks: [] }, { scope: null }, { scope: "all" }, { status: "measured-low" }, { pageViews: null },
  ]) assert.equal(observeCheckpoint(experiment(), "d56", theme(patch), NOW).status, "insufficient-data", JSON.stringify(patch));
});

test("future periods and invalid dates cannot become observed evidence", () => {
  for (const patch of [{ periodStart: "2026-07-16", periodEnd: "2026-09-09" }, { periodStart: "2026-02-30" }]) {
    assert.equal(observeCheckpoint(experiment(), "d56", theme(patch), NOW).status, "insufficient-data");
  }
});

test("a latest-28-day user count inside a 56-day aggregate is not a 56-day KPI", () => {
  const e = experiment();
  e.primaryKpi = "ga4.activeUsersLast28d";
  e.baseline[e.primaryKpi] = 300;
  e.baselineStatuses[e.primaryKpi] = "measured";
  assert.ok(observeCheckpoint(e, "d56", theme({ activeUsersLast28d: 400 }), NOW).reasons.includes("kpi-is-28-days-only"));
});

test("legacy raw GA4 and low-sample baseline cannot qualify against Japan-only traffic", () => {
  for (const patch of [{ baselineScopes: {} }, { baselineScopes: { ga4: "raw" } }, { baselineStatuses: {} }, { baselineStatuses: { "ga4.pageViews": "measured-low" } }]) {
    const e = { ...experiment(), ...patch };
    const before = structuredClone(e);
    assert.equal(observeCheckpoint(e, "d56", theme(), NOW).status, "insufficient-data");
    assert.deepEqual(e, before);
  }
});

test("GSC search-console scope is valid, without inventing a Japan country filter", () => {
  const e = experiment();
  e.primaryKpi = "gsc.impressions";
  e.baseline = { "gsc.impressions": 1000 };
  e.baselineScopes = { gsc: "search-console" };
  e.baselineStatuses = { "gsc.impressions": "measured" };
  const t = theme();
  t.metrics.gsc = { ...t.metrics.ga4, impressions: 2000, scope: "search-console" };
  assert.equal(observeCheckpoint(e, "d56", t, NOW).status, "eligible");
});

test("missing or low guardrails remain explicit constraints and do not erase measured primary evidence", () => {
  const e = experiment();
  e.guardrailKpis = ["gsc.impressions"];
  const record = observeCheckpoint(e, "d56", theme(), NOW);
  assert.equal(record.status, "eligible");
  assert.ok(record.constraints.some((reason) => reason.startsWith("gsc.impressions: missing-or-low-sample")));
});

test("retry preserves existing results, deduplicates unchanged checks and later accepts a complete window", () => {
  const e = experiment();
  const original = { observedAt: "2026-09-07", values: { "ga4.pageViews": { value: 500, status: "measured" } } };
  e.result = { d56: structuredClone(original) };
  const delayed = theme({ periodStart: "2026-07-13", periodEnd: "2026-09-06" });
  assert.equal(recordCheckpoint(e, "d56", observeCheckpoint(e, "d56", delayed, NOW)), true);
  assert.equal(recordCheckpoint(e, "d56", observeCheckpoint(e, "d56", delayed, "2026-09-09")), false);
  assert.equal(recordCheckpoint(e, "d56", observeCheckpoint(e, "d56", theme(), NOW)), true);
  assert.deepEqual(e.result.d56, original);
  assert.equal(e.result.rechecks.d56.length, 2);
  assert.equal(assessCheckpoint(e, "d56", e.result.rechecks.d56.at(-1)).status, "eligible");
});

function cliFixture(t, experiments = [experiment()], portfolioTheme = theme()) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "theme-experiment-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "experiments.json"), JSON.stringify({ schemaVersion: 1, experiments }));
  fs.writeFileSync(path.join(dir, "portfolio.json"), JSON.stringify({ themes: [portfolioTheme] }));
  const clock = path.join(dir, "clock.mjs");
  fs.writeFileSync(clock, `Date.now = () => Date.parse('${NOW}T12:00:00Z');`);
  return {
    run: (...args) => spawnSync(process.execPath, ["--import", clock, SCRIPT, ...args], { env: { ...process.env, STATE_DIR: dir }, encoding: "utf8" }),
    read: () => JSON.parse(fs.readFileSync(path.join(dir, "experiments.json"), "utf8")),
  };
}

test("CLI refuses legacy or d28-only effect verdicts without changing stored results", (t) => {
  for (const cp of ["d28", "d56"]) {
    const e = experiment();
    e.result = { [cp]: { observedAt: NOW, values: { "ga4.pageViews": { value: 400, status: "measured" } } } };
    const fixture = cliFixture(t, [e]);
    const result = fixture.run("--verdict", e.experimentId, "effect-full");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /insufficient-data/);
    assert.deepEqual(fixture.read().experiments[0], e);
  }
});

test("CLI retains registration and scheduling, and records only provisional d28/qualified d56", (t) => {
  const fixture = cliFixture(t, []);
  const e = experiment();
  delete e.evaluateAt;
  assert.equal(fixture.run("--register", JSON.stringify(e)).status, 0);
  assert.equal(fixture.run("--schedule", e.experimentId, e.startedAt).status, 0);
  assert.deepEqual(fixture.read().experiments[0].evaluateAt, { d7: "2026-07-21", d28: "2026-08-11", d56: "2026-09-08" });
  assert.equal(fixture.run("--check").status, 0);
  const result = fixture.read().experiments[0].result;
  assert.equal(result.d7.status, "quality-only");
  assert.equal(result.d28.status, "insufficient-data");
  assert.equal(result.d56.status, "eligible");
  assert.equal(fixture.run("--verdict", e.experimentId, "effect-partial").status, 0);
});

test("CLI cannot confirm effect against a raw baseline or low current primary sample", (t) => {
  for (const lowCurrent of [false, true]) {
    const e = experiment();
    if (!lowCurrent) delete e.baselineScopes;
    const fixture = cliFixture(t, [e], theme(lowCurrent ? { status: "measured-low", pageViews: 20 } : {}));
    assert.equal(fixture.run("--check").status, 0);
    const before = fixture.read();
    assert.equal(before.experiments[0].result.d56.status, "insufficient-data");
    assert.equal(fixture.run("--verdict", e.experimentId, "effect-full").status, 1);
    assert.deepEqual(fixture.read(), before);
  }
});
