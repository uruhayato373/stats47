import assert from "node:assert/strict";
import test from "node:test";

import { crossCheckAgainstSite, parsePeriodFromFilename, toResultsRecords } from "../lib/a8-report-csv.mjs";
import {
  buildA8PeriodContract,
  compareA8Period,
  currentJstDate,
  evaluateA8OutcomeGate,
  parseRequestedMonth,
} from "../lib/a8-report-period-core.mjs";

const NOW = "2026-08-28T03:00:00.000Z";
const SITE = "統計で見る都道府県";

test("要求月は YYYY-MM だけを受け入れ、未来月を拒否する", () => {
  assert.deepEqual(parseRequestedMonth("2026-08"), {
    raw: "2026-08",
    year: 2026,
    month: 8,
    compact: "202608",
  });
  assert.throws(() => parseRequestedMonth("2026-8"), /YYYY-MM/);
  assert.throws(
    () => buildA8PeriodContract({ requestedMonth: "2026-09", kind: "month", today: "2026-08-28" }),
    /未来月/,
  );
});

test("A8期間の当日はUTCではなく日本時間で決める", () => {
  assert.equal(currentJstDate(new Date("2026-08-27T15:30:00.000Z")), "2026-08-28");
});

test("月レンジは start=end の単月契約になる", () => {
  const contract = buildA8PeriodContract({ requestedMonth: "2026-08", kind: "month", today: "2026-08-28" });
  assert.equal(contract.startValue, "2026年08月");
  assert.equal(contract.endValue, "2026年08月");
  assert.equal(contract.expectedPeriod.raw, "202608-202608");
  assert.equal(contract.expectedPeriod.singleMonth, "2026-08");
});

test("日レンジは過去月末、当月は観測日までに閉じる", () => {
  const past = buildA8PeriodContract({ requestedMonth: "2026-02", kind: "day", today: "2026-08-28" });
  assert.equal(past.endValue, "2026年02月28日");
  assert.equal(past.expectedPeriod.raw, "20260201-20260228");
  const current = buildA8PeriodContract({ requestedMonth: "2026-08", kind: "day", today: "2026-08-28" });
  assert.equal(current.endValue, "2026年08月28日");
  assert.equal(current.expectedPeriod.raw, "20260801-20260828");
});

test("CSV ファイル名の実期間が要求期間と完全一致した場合だけ通す", () => {
  const contract = buildA8PeriodContract({ requestedMonth: "2026-08", kind: "month", today: "2026-08-28" });
  const actual = parsePeriodFromFilename("site_202608-202608_20260828120000.csv");
  assert.equal(compareA8Period(contract, actual).ok, true);
  assert.match(
    compareA8Period(contract, parsePeriodFromFilename("site_202601-202608_20260828120000.csv")).reason,
    /csv-period-mismatch/,
  );
  assert.equal(compareA8Period(contract, null).reason, "csv-period-missing");
});

test("8桁の日レンジを6桁月レンジとして誤読しない", () => {
  const actual = parsePeriodFromFilename("period_20260801-20260828_20260828120000.csv");
  assert.equal(actual.granularity, "day");
  assert.equal(actual.singleMonth, "2026-08");
});

test("成果SSOT欠損と累計期間は outcome gate を blocked にする", () => {
  const missing = evaluateA8OutcomeGate({ reportLog: null, results: null, nowIso: NOW, expectedSite: SITE });
  assert.equal(missing.status, "blocked");
  assert.ok(missing.reasons.includes("a8-report-log-missing"));
  assert.ok(missing.reasons.includes("a8-results-missing"));

  const cumulative = evaluateA8OutcomeGate({
    reportLog: {
      updatedAt: NOW,
      site: SITE,
      period: { raw: "202601-202608", singleMonth: null },
      siteSummary: [{ site: SITE, period: "202601-202608" }],
      crossCheck: { comparable: true, exceeded: false },
    },
    results: { updatedAt: NOW, records: [] },
    nowIso: NOW,
    expectedSite: SITE,
  });
  assert.ok(cumulative.reasons.includes("a8-period-not-single-month"));
  assert.notEqual(cumulative.status, "ready");
});

test("単月・サイト分離・検算・鮮度が揃えばゼロ成果でも ready", () => {
  const gate = evaluateA8OutcomeGate({
    reportLog: {
      updatedAt: "2026-08-27T00:00:00.000Z",
      site: SITE,
      period: { raw: "202608-202608", singleMonth: "2026-08" },
      siteSummary: [{ site: SITE, period: "202608-202608", conversions: 0, revenueYen: 0 }],
      crossCheck: { comparable: true, exceeded: false },
    },
    results: {
      updatedAt: "2026-08-27T00:00:00.000Z",
      records: [{ month: "2026-08", program: "example", conversions: 0, revenueYen: 0 }],
    },
    nowIso: NOW,
    expectedSite: SITE,
  });
  assert.deepEqual(gate.reasons, []);
  assert.equal(gate.status, "ready");
});

test("単月でも stale source は ready にしない", () => {
  const gate = evaluateA8OutcomeGate({
    reportLog: {
      updatedAt: "2026-06-01T00:00:00.000Z",
      site: SITE,
      period: { raw: "202606-202606", singleMonth: "2026-06" },
      siteSummary: [{ site: SITE, period: "202606-202606" }],
      crossCheck: { comparable: true, exceeded: false },
    },
    results: { updatedAt: "2026-06-01T00:00:00.000Z", records: [{ month: "2026-06", program: "x" }] },
    nowIso: NOW,
    expectedSite: SITE,
  });
  assert.ok(gate.reasons.some((reason) => reason.startsWith("a8-report-log-stale")));
  assert.equal(gate.status, "blocked");
});

test("サイト別との超過・不足は成果を0へ丸めず blocked にする", () => {
  const base = {
    updatedAt: NOW,
    site: SITE,
    period: { raw: "202608-202608", singleMonth: "2026-08" },
    siteSummary: [{ site: SITE, period: "202608-202608" }],
  };
  const results = { updatedAt: NOW, records: [{ month: "2026-08", program: "x" }] };
  const exceeded = evaluateA8OutcomeGate({
    reportLog: { ...base, crossCheck: { comparable: true, exceeded: true, hasShortfall: false } },
    results,
    nowIso: NOW,
    expectedSite: SITE,
  });
  assert.ok(exceeded.reasons.includes("a8-cross-check-exceeded"));

  const shortfall = evaluateA8OutcomeGate({
    reportLog: { ...base, crossCheck: { comparable: true, exceeded: false, hasShortfall: true } },
    results,
    nowIso: NOW,
    expectedSite: SITE,
  });
  assert.ok(shortfall.reasons.includes("a8-cross-check-shortfall"));
});

test("共用案件を含む口座横断値は専用分を下限・共用込みを上限として検算する", () => {
  const siteRow = { clicks: 294, conversions: 2, grossRevenueYen: 1200, approved: 1, revenueYen: 500 };
  const rows = [
    {
      programId: "s-exclusive",
      clicks: 280,
      conversions: 2,
      grossRevenueYen: 1200,
      approved: 1,
      revenueYen: 500,
    },
    {
      programId: "s-shared",
      clicks: 46,
      conversions: 0,
      grossRevenueYen: 0,
      approved: 0,
      revenueYen: 0,
    },
  ];

  const bounded = crossCheckAgainstSite(siteRow, rows, { sharedProgramIds: ["s-shared"] });
  assert.equal(bounded.exceeded, false);
  assert.equal(bounded.hasShortfall, false);
  assert.equal(bounded.withinBounds, true);
  assert.deepEqual(bounded.deltas.clicks, {
    site: 294,
    picked: 326,
    exclusive: 280,
    shared: 46,
    lowerBound: 280,
    upperBound: 326,
    delta: 32,
  });

  const exclusiveOverflow = crossCheckAgainstSite(
    siteRow,
    [{ ...rows[0], clicks: 295 }, rows[1]],
    { sharedProgramIds: ["s-shared"] },
  );
  assert.equal(exclusiveOverflow.exceeded, true);

  const unexplainedShortfall = crossCheckAgainstSite(
    siteRow,
    [{ ...rows[0], clicks: 200 }, { ...rows[1], clicks: 20 }],
    { sharedProgramIds: ["s-shared"] },
  );
  assert.equal(unexplainedShortfall.hasShortfall, true);
});

test("共用案件の口座横断成果をstats47月次recordsへ写さない", () => {
  const result = toResultsRecords(
    [
      { programId: "s-exclusive", program: "ad-exclusive", programRaw: "専用", clicks: 3, revenueYen: 100 },
      { programId: "s-shared", program: "ad-shared", programRaw: "共用", clicks: 8, revenueYen: 500 },
    ],
    { singleMonth: "2026-08", sharedProgramIds: ["s-shared"] },
  );
  assert.deepEqual(result.records.map((record) => record.programId), ["s-exclusive"]);
  assert.equal(result.notAttributable.length, 1);
  assert.equal(result.notAttributable[0].programId, "s-shared");
  assert.equal(result.notAttributable[0].reason, "両サイト共用プログラムのためstats47単独成果へ配賦できない");
});
