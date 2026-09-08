import test from "node:test";
import assert from "node:assert/strict";
import { inspectThemePayload, compareThemeObservation, selectLastGoodObservations, inspectThemeStructure, inspectChartYears, summarizeThemeFindings } from "../theme-quality-core.mjs";

const row = (areaCode, yearCode, value = 1) => ({ areaCode, yearCode, value, unit: "人" });
const inspect = (rows) => inspectThemePayload({ rows }, "stats");

test("対象外県と欠測・ゼロを区別し、全国を県数へ加えない", () => {
  const observed = inspect([row("01000", "2024", 0), row("02000", "2024", null), row("00000", "2024", 100)]);
  assert.equal(observed.latestCoverage, 1);
  assert.equal(observed.latestMissingCodes.includes("01000"), false);
  assert.deepEqual(compareThemeObservation(observed, observed), []);
  assert.equal(inspect([row("01000", "2024", null)]).status, "empty");
});

test("同年のcoverage減少・履歴消失を検出する", () => {
  const before = inspect([row("01000", "2023"), row("01000", "2024"), row("02000", "2024")]);
  const after = inspect([row("01000", "2024")]);
  assert.deepEqual(compareThemeObservation(before, after).map((f) => f.code), ["history-loss", "coverage-regression"]);
});

test("単年の推移と、相手だけに長期系列がある場合を分ける", () => {
  const refs = [{ metricKey: "salary" }, { metricKey: "jobs" }];
  const observations = new Map([["salary", inspect([row("01000", "2022")])], ["jobs", inspect([row("01000", "2022")])]]);
  const chart = { componentType: "line-chart", title: "推移" };
  assert.equal(inspectChartYears(chart, refs, observations)[0].code, "single-year-trend");
  observations.set("jobs", inspect([row("01000", "2020"), row("01000", "2022")]));
  assert.equal(inspectChartYears(chart, refs, observations)[0].severity, "warn");
  assert.deepEqual(inspectChartYears({ ...chart, title: "2022年の比較" }, refs, observations), []);
});

test("章の欠落・未知参照・重複表示を検出する", () => {
  const catalog = { metrics: [{ rankingKey: "x" }], metricGroups: [{ key: "level", rankingKeys: ["x"] }], charts: [{ componentKey: "trend" }], sections: [{ key: "a", metricGroupKeys: ["level"], chartKeys: ["missing"] }, { key: "b", metricGroupKeys: ["level"], chartKeys: [] }] };
  assert.deepEqual(inspectThemeStructure(catalog).map((f) => f.code), ["unknown-chart", "repeated-group", "unplaced-chart"]);
});

test("同じ異常を毎週新規と数えず、復旧を検出する", () => {
  const finding = { code: "single-year-trend", severity: "error", themeKey: "salary", componentKey: "trend" };
  assert.equal(summarizeThemeFindings([finding], [finding]).actionableChange, false);
  assert.equal(summarizeThemeFindings([], [finding]).resolved.length, 1);
});

test("ranking wrapperと重複年を検査し壊れたschemaは止める", () => {
  const r = row("01000", "2024");
  assert.equal(inspectThemePayload({ partitions: { all: { values: [r, r] } } }, "ranking").duplicateAreaYears, 1);
  assert.throws(() => inspectThemePayload({ partitions: { all: {} } }, "ranking"));
});

const observation = (rows, extra = {}) => ({ ...inspect(rows), namespace: "stats", key: "population", ...extra });
const withMetric = (findings) => findings.map((finding) => ({ ...finding, namespace: "stats", metricKey: "population" }));

test("退行が再発しても正常時baselineを維持し、真の回復だけを解消と数える", () => {
  const good = observation([row("01000", "2023"), row("01000", "2024"), row("02000", "2024")], { observedAt: "first" });
  const regressed = observation([row("01000", "2024")], { observedAt: "regressed" });
  let previous = { observations: [good], lastGoodObservations: [good], findings: [] };
  for (let attempt = 0; attempt < 2; attempt++) {
    const baseline = selectLastGoodObservations(previous)[0];
    const findings = withMetric(compareThemeObservation(baseline, regressed));
    assert.deepEqual(findings.map((finding) => finding.code), ["history-loss", "coverage-regression"]);
    const summary = summarizeThemeFindings(findings, previous.findings);
    assert.equal(summary.resolved.length, 0);
    assert.equal(summary.actionableChange, attempt === 0);
    const lastGoodObservations = selectLastGoodObservations(previous, [regressed], findings);
    assert.deepEqual(lastGoodObservations, [good]);
    previous = { observations: [regressed], lastGoodObservations, findings };
  }
  const recovered = { ...good, observedAt: "recovered" };
  const findings = withMetric(compareThemeObservation(selectLastGoodObservations(previous)[0], recovered));
  assert.deepEqual(findings, []);
  assert.equal(summarizeThemeFindings(findings, previous.findings).resolved.length, 2);
  assert.deepEqual(selectLastGoodObservations(previous, [recovered], findings), [recovered]);
});

test("初回errorとその再発をbaselineに採用せず、空のlastGoodから失敗観測へ戻らない", () => {
  const bad = observation([row("01000", "2024"), row("01000", "2024")]);
  const findings = [{ severity: "error", namespace: "stats", metricKey: "population", code: "duplicate-area-year" }];
  const lastGoodObservations = selectLastGoodObservations({}, [bad], findings);
  assert.deepEqual(lastGoodObservations, []);
  const previous = { observations: [bad], lastGoodObservations, findings };
  assert.deepEqual(selectLastGoodObservations(previous), []);
  assert.deepEqual(selectLastGoodObservations(previous, [bad], findings), []);
  const good = observation([row("01000", "2024")]);
  assert.deepEqual(selectLastGoodObservations(previous, [good], []), [good]);
});

test("旧形式のobservationsでも、errorが記録されたpayloadは正常時baselineとしない", () => {
  const apparentOk = observation([row("01000", "2024")]);
  const findings = [{ severity: "error", namespace: "stats", metricKey: "population", code: "history-loss" }];
  assert.deepEqual(selectLastGoodObservations({ observations: [apparentOk], findings }), []);
  assert.deepEqual(selectLastGoodObservations({ lastGoodObservations: null, observations: [apparentOk], findings }), []);
  assert.deepEqual(selectLastGoodObservations({ observations: [apparentOk], findings: [] }), [apparentOk]);
  // A verified baseline is older than the current failure; the current finding must not erase it.
  assert.deepEqual(selectLastGoodObservations({ lastGoodObservations: [apparentOk], findings }), [apparentOk]);
});

test("取得不能・空payload・未観測でも、namespaceごとにbaselineを保持する", () => {
  const good = observation([row("01000", "2024")]);
  const ranking = { ...good, namespace: "ranking" };
  const previous = { lastGoodObservations: [good, ranking] };
  const failed = { ...good, status: "error" };
  const empty = observation([row("01000", "2024", null)]);
  const updatedRanking = { ...ranking, observedAt: "new" };
  assert.deepEqual(selectLastGoodObservations(previous, [failed, empty], []), [ranking, good]);
  assert.deepEqual(selectLastGoodObservations(previous), [ranking, good]);
  const findings = [{ severity: "error", namespace: "stats", metricKey: "population", code: "payload-unavailable" }];
  assert.deepEqual(selectLastGoodObservations(previous, [failed, updatedRanking], findings), [updatedRanking, good]);
});
