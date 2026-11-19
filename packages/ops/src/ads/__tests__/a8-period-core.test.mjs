import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateOutcomeGate,
  formatA8Month,
  validatePeriodFormProbe,
  verifyRequestedPeriod,
} from "../lib/a8-period-core.mjs";

const PERIOD_FORM = {
  startPlaceholder: "開始月",
  endPlaceholder: "終了月",
  applyButtonLabel: "適用",
};

test("probe: program-detail の月・日レンジが併存しても placeholder で月レンジを一意化する", () => {
  const result = validatePeriodFormProbe(
    {
      reportKey: "program-detail",
      fields: [
        { name: "start", placeholder: "開始月", visible: true },
        { name: "end", placeholder: "終了月", visible: true },
        { name: "start", placeholder: "開始日", visible: false },
        { name: "end", placeholder: "終了日", visible: false },
      ],
      buttons: [{ text: "適用", visible: true }],
    },
    PERIOD_FORM,
  );

  assert.equal(result.status, "ready");
  assert.deepEqual(result.selectors, {
    start: 'input[placeholder="開始月"]:visible',
    end: 'input[placeholder="終了月"]:visible',
    applyButtonLabel: "適用",
  });
});

test("probe: 月入力が複数 visible なら推測せず blocked", () => {
  const result = validatePeriodFormProbe(
    {
      fields: [
        { placeholder: "開始月", visible: true },
        { placeholder: "開始月", visible: true },
        { placeholder: "終了月", visible: true },
      ],
      buttons: [{ text: "適用", visible: true }],
    },
    PERIOD_FORM,
  );
  assert.equal(result.status, "blocked");
  assert.ok(result.reasons.includes("a8-period-start-not-unique(2)"));
});

test("要求月と CSV ファイル名の単月期間が一致した場合だけ ready", () => {
  assert.equal(formatA8Month("2026-07"), "2026年07月");
  assert.deepEqual(
    verifyRequestedPeriod({
      requestedMonth: "2026-07",
      actualPeriod: { raw: "202607-202607", singleMonth: "2026-07" },
    }),
    { status: "ready", reasons: [] },
  );

  const cumulative = verifyRequestedPeriod({
    requestedMonth: "2026-07",
    actualPeriod: { raw: "202601-202607", singleMonth: null },
  });
  assert.equal(cumulative.status, "blocked");
  assert.ok(cumulative.reasons.includes("a8-csv-period-not-single-month(202601-202607)"));

  const mismatch = verifyRequestedPeriod({
    requestedMonth: "2026-07",
    actualPeriod: { raw: "202606-202606", singleMonth: "2026-06" },
  });
  assert.ok(mismatch.reasons.includes("a8-csv-period-mismatch(2026-07!=2026-06)"));
});

test("outcome gate: SSOT 未生成は 0 件にせず blocked 理由を保持する", () => {
  const gate = evaluateOutcomeGate({ results: null, reportLog: null, nowIso: "2026-08-27T00:00:00Z" });
  assert.equal(gate.status, "blocked");
  assert.deepEqual(gate.reasons, ["a8-results-missing", "a8-report-log-missing"]);
});

test("outcome gate: 累計期間は records があっても blocked", () => {
  const gate = evaluateOutcomeGate({
    results: { updatedAt: "2026-08-26T00:00:00Z", records: [{ month: "2026-07" }] },
    reportLog: {
      updatedAt: "2026-08-26T00:00:00Z",
      period: { raw: "202601-202608", singleMonth: null },
    },
    nowIso: "2026-08-27T00:00:00Z",
  });
  assert.equal(gate.status, "blocked");
  assert.ok(gate.reasons.includes("a8-report-period-not-single-month(202601-202608)"));
});

test("outcome gate: 新鮮な単月 report と対応 record が揃えば ready", () => {
  const gate = evaluateOutcomeGate({
    results: { updatedAt: "2026-08-26T00:00:00Z", records: [{ month: "2026-08" }] },
    reportLog: {
      updatedAt: "2026-08-26T00:00:00Z",
      period: { raw: "202608-202608", singleMonth: "2026-08" },
    },
    nowIso: "2026-08-27T00:00:00Z",
  });
  assert.equal(gate.status, "ready");
  assert.deepEqual(gate.reasons, []);
  assert.deepEqual(gate.freshness, { resultDays: 1, reportDays: 1 });
});
