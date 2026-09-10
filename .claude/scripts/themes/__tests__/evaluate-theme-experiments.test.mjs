import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { assessCheckpoint, observeCheckpoint, recordCheckpoint, launchBaselineCandidate } from "../evaluate-theme-experiments.mjs";

const SCRIPT = fileURLToPath(new URL("../evaluate-theme-experiments.mjs", import.meta.url));
const NOW = "2026-09-08";

function experiment() {
  return {
    experimentId: "THEME-EXP-TEST", themeKey: "climate", verdict: "pending",
    changeType: "structure", hypothesis: "章の構成を改善する", primaryKpi: "ga4.pageViews",
    startedAt: "2026-07-14", evaluateAt: { d7: "2026-07-21", d28: "2026-08-11", d56: "2026-09-08" },
    baselinePeriod: { from: "2026-05-19", to: "2026-07-13" },
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
  const start = e.startedAt;
  e.startedAt = null;
  e.evaluateAt = null;
  assert.equal(fixture.run("--register", JSON.stringify(e)).status, 0);
  assert.equal(fixture.run("--schedule", e.experimentId, start).status, 0);
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

function launch() {
  return { ...experiment(), changeType: "launch", baseline: null, baselineStatus: "not-applicable-new-url",
    baselinePeriod: null, baselineScopes: {}, baselineStatuses: {} };
}

test("new URL observations need no fabricated baseline and can never qualify as effect", () => {
  const e = launch();
  const observation = observeCheckpoint(e, "d56", theme(), NOW);
  assert.equal(observation.status, "launch-observed");
  assert.ok(observation.constraints.includes("new-url-has-no-pre-publication-baseline"));
  assert.equal(observeCheckpoint(e, "d28", theme({ windowDays: 28, periodEnd: "2026-08-10" }), NOW).status, "launch-provisional");
  const before = structuredClone(e);
  const candidate = launchBaselineCandidate(e, observation);
  assert.deepEqual(candidate.baselinePeriod, { from: "2026-07-14", to: "2026-09-07" });
  assert.equal(candidate.baseline["ga4.pageViews"], 400);
  assert.equal(candidate.sourceExperimentId, e.experimentId);
  assert.deepEqual(e, before);
});

test("launch retains real low counts as constraints, while missing rows are not zero and cannot seed baseline", () => {
  const e = launch();
  const low = observeCheckpoint(e, "d56", theme({ status: "measured-low", pageViews: 0 }), NOW);
  assert.equal(low.status, "launch-observed");
  assert.equal(low.values["ga4.pageViews"].value, 0);
  assert.ok(low.constraints.includes("primary-low-sample-count-only"));
  assert.equal(launchBaselineCandidate(e, low), null);
  const missing = observeCheckpoint(e, "d56", theme({ status: "insufficient-data", pageViews: null }), NOW);
  assert.equal(missing.status, "insufficient-data");
  assert.equal(missing.values["ga4.pageViews"].value, null);
  assert.equal(launchBaselineCandidate(e, missing), null);
  e.primaryKpi = "ga4.engagementRatePvWeighted";
  assert.equal(observeCheckpoint(e, "d56", theme({ status: "measured-low", engagementRatePvWeighted: 0.8 }), NOW).status, "insufficient-data");
});

test("CLI launch registration remains unscheduled until actual publication; rejects fake baseline and duplicates atomically", (t) => {
  const fixture = cliFixture(t, []);
  const e = { ...launch(), startedAt: null, evaluateAt: null };
  const invalid = [null, [], { ...e, baseline: { "ga4.pageViews": 0 } }, { ...e, baselineStatus: undefined },
    { ...e, result: { d56: {} } }, { ...e, verdict: "effect-full" }, { ...e, changeType: "invalid" },
    { ...e, startedAt: "2026-07-14" }, { ...e, primaryKpi: "missing" }];
  for (const spec of invalid) {
    const before = fixture.read();
    assert.equal(fixture.run("--register", JSON.stringify(spec)).status, 1, JSON.stringify(spec));
    assert.deepEqual(fixture.read(), before);
  }
  assert.equal(fixture.run("--register", JSON.stringify(e)).status, 0);
  assert.equal(fixture.run("--check").status, 0);
  assert.equal(fixture.read().experiments[0].result, null);
  assert.equal(fixture.run("--register", JSON.stringify({ ...e, experimentId: "DUPLICATE" })).status, 1);
  assert.equal(fixture.read().experiments.length, 1);
  assert.equal(fixture.run("--schedule", e.experimentId, "2026-09-09").status, 1);
  assert.equal(fixture.run("--schedule", e.experimentId, "2026-02-30").status, 1);
  assert.equal(fixture.run("--schedule", e.experimentId, "2026-07-14").status, 0);
  assert.equal(fixture.run("--check").status, 0);
  const before = fixture.read();
  assert.equal(fixture.run("--schedule", e.experimentId, "2026-07-14").status, 0);
  assert.equal(fixture.run("--schedule", e.experimentId, "2026-07-15").status, 1);
  assert.deepEqual(fixture.read(), before);
  assert.equal(fixture.run("--verdict", e.experimentId, "effect-full", "--evidence", "real.csv").status, 1);
  assert.deepEqual(fixture.read(), before);
});

test("launch review records the decision and a reusable observed baseline without declaring effect", (t) => {
  const e = launch();
  const fixture = cliFixture(t, [e]);
  assert.equal(fixture.run("--launch-review", e.experimentId, "continue", "--evidence", "source.csv", "--note", "継続").status, 1);
  assert.equal(fixture.run("--check").status, 0);
  assert.equal(fixture.run("--launch-review", e.experimentId, "continue", "--evidence", "source.csv").status, 1);
  assert.equal(fixture.run("--launch-review", e.experimentId, "continue", "--evidence", "source.csv", "--note", "品質確認済み。観測窓の閲覧数を記録して継続する。").status, 0);
  const saved = fixture.read().experiments[0];
  assert.equal(saved.verdict, "launch-reviewed");
  assert.equal(saved.baseline, null);
  assert.equal(saved.result.launchReview.decision, "continue");
  assert.equal(saved.result.baselineCandidate.baseline["ga4.pageViews"], 400);
  assert.equal(fixture.run("--launch-review", e.experimentId, "hold", "--evidence", "source.csv", "--note", "改変").status, 1);
  assert.deepEqual(fixture.read().experiments[0], saved);
});

test("launch lacking a complete window may record the measurement fix, but not a continue decision", (t) => {
  const e = launch();
  const fixture = cliFixture(t, [e], theme({ pageViews: null, status: "insufficient-data" }));
  assert.equal(fixture.run("--check").status, 0);
  assert.equal(fixture.run("--launch-review", e.experimentId, "continue", "--evidence", "source.csv", "--note", "継続").status, 1);
  assert.equal(fixture.run("--launch-review", e.experimentId, "improve", "--evidence", "source.csv", "--note", "計測の欠落を調査する。次回週次確認で再取得する。").status, 0);
  assert.equal(fixture.read().experiments[0].result.baselineCandidate, null);
});

test("a later improvement cannot use a baseline that includes its own publication or has unknown duration", () => {
  for (const period of [null, { from: "2026-07-14", to: "2026-09-07" }, { from: "2026-06-01", to: "2026-07-13" }]) {
    const e = { ...experiment(), baselinePeriod: period };
    assert.equal(observeCheckpoint(e, "d56", theme(), NOW).status, "insufficient-data");
  }
});

test("CLI refuses mixed operations instead of silently choosing one", (t) => {
  const f = cliFixture(t);
  const before = f.read();
  assert.equal(f.run("--schedule", "THEME-EXP-TEST", "2026-07-14", "--check").status, 1);
  assert.equal(f.run("--unknown").status, 1);
  assert.deepEqual(f.read(), before);
});


test("CLI corrects only an unpublished improvement baseline and preserves identity", (t) => {
  const e = { ...experiment(), startedAt: null, evaluateAt: null, result: null };
  const f = cliFixture(t, [e]);
  const patch = { baseline: { "ga4.pageViews": 310 }, baselinePeriod: e.baselinePeriod,
    baselineScopes: { ga4: "Japan" }, baselineStatuses: { "ga4.pageViews": "measured" }, evidenceRefs: ["corrected-official-window.json"] };
  assert.equal(f.run("--update-baseline", e.experimentId, JSON.stringify(patch)).status, 0);
  const saved = f.read().experiments[0];
  assert.deepEqual(saved, { ...e, ...patch });
  assert.equal(saved.startedAt, null);
  assert.equal(saved.result, null);
});

test("baseline correction cannot alter scheduled, observed or decided history", (t) => {
  for (const state of [{ startedAt: "2026-07-14" }, { evaluateAt: { d7: "2026-07-21" } },
    { result: { d7: {} } }, { verdict: "insufficient-data" }, { verdict: "aborted" }]) {
    const e = { ...experiment(), startedAt: null, evaluateAt: null, result: null, ...state };
    const f = cliFixture(t, [e]); const before = f.read();
    assert.equal(f.run("--update-baseline", e.experimentId, JSON.stringify({ baseline: { "ga4.pageViews": 310 } })).status, 1, JSON.stringify(state));
    assert.deepEqual(f.read(), before);
  }
});

test("launch baseline and fields outside the correction whitelist are rejected atomically", (t) => {
  const e = { ...experiment(), startedAt: null, evaluateAt: null, result: null };
  const f = cliFixture(t, [e, { ...launch(), experimentId: "THEME-LAUNCH-TEST", startedAt: null, evaluateAt: null }]);
  const before = f.read();
  for (const patch of [null, [], {}, { baseline: null }, { baseline: {} }, { startedAt: "2026-07-14" },
    { evaluateAt: null }, { result: null }, { verdict: "pending" }, { themeKey: "tourism" }, { hypothesis: "changed" },
    { baseline: { "ga4.pageViews": 310 }, evidenceRefs: [] }]) {
    assert.equal(f.run("--update-baseline", e.experimentId, JSON.stringify(patch)).status, 1, JSON.stringify(patch));
    assert.deepEqual(f.read(), before);
  }
  assert.equal(f.run("--update-baseline", "THEME-LAUNCH-TEST", JSON.stringify({ baseline: { "ga4.pageViews": 310 } })).status, 1);
  assert.deepEqual(f.read(), before);
  assert.equal(f.run("--update-baseline", e.experimentId, "{broken").status, 1);
  assert.equal(f.run("--update-baseline", "MISSING", "{}").status, 1);
  assert.deepEqual(f.read(), before);
});
