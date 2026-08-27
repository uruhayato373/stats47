import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyNational,
  isFiniteEstatValue,
} from "../theme-chart-live-audit.mjs";
import {
  findWrongFilterRows,
  inspectEstatPayload,
  inspectStatsPayload,
  parseAuditLimit,
  parseDependencyMirror,
  requestKey,
  summarizeAudit,
} from "../theme-chart-live-audit-core.mjs";

/**
 * 全国行判定のテスト (THEME-AUDIT-NATIONAL-VALUE-GAP-01)。
 *
 * ★両方向を固定する。「全 PASS」は「何も見ていない」と区別がつかないため、
 *   ①プレースホルダを実データと誤認しないこと ②実データを誤って捨てないこと の
 *   両方を assert する。①だけ入れると「常に false を返す」実装が通ってしまい、
 *   ②だけ入れると元の「行の存在だけを見る」実装が通ってしまう。
 */

const row = (area, value) => ({ "@area": area, $: value });

test("実データの値は有限数として受け入れる", () => {
  for (const v of ["1234", "0", "12.5", "1,234,567", "-3.2", 42]) {
    assert.equal(isFiniteEstatValue(v), true, `${v} は実データのはず`);
  }
});

test("e-Stat のプレースホルダは実データとして扱わない", () => {
  // '-' (ASCII hyphen) と '‐' (U+2010) の両方が実データに出る。
  for (const v of ["-", "‐", "***", "X", "", "   ", undefined, null]) {
    assert.equal(isFiniteEstatValue(v), false, `${String(v)} はプレースホルダのはず`);
  }
});

test("00000 行が無ければ hasNationalRow も hasNational も false", () => {
  const r = classifyNational([row("01000", "10"), row("13000", "20")]);
  assert.deepEqual(r, { hasNationalRow: false, hasNational: false });
});

test("00000 行があり値が実データなら両方 true", () => {
  const r = classifyNational([row("00000", "5,000"), row("01000", "10")]);
  assert.deepEqual(r, { hasNationalRow: true, hasNational: true });
});

test("★00000 行はあるが全てプレースホルダなら hasNational は false (旧実装はここで true を返していた)", () => {
  // 実測: in-pref-university-entrance-ratio-by-highschool-origin (0000010205 #E0940302) は
  // 1980-2024 の全 42 時点が '-'。行の存在だけを見ると「全国値あり」と誤判定する。
  const r = classifyNational([row("00000", "-"), row("00000", "‐"), row("01000", "12.3")]);
  assert.deepEqual(r, { hasNationalRow: true, hasNational: false });
});

test("00000 行が混在するなら 1 つでも実データがあれば hasNational は true", () => {
  const r = classifyNational([row("00000", "-"), row("00000", "3.4")]);
  assert.deepEqual(r, { hasNationalRow: true, hasNational: true });
});

const mirrorRequest = {
  key: "0000000001?cdCat01=A",
  statsDataId: "0000000001",
  filters: { cdCat01: "A" },
  themeKey: "population",
  componentKey: "trend",
  componentType: "line-chart",
};

const mirrorMetric = {
  metricKey: "total-population",
  expectedUnit: "人",
  expectedConfigHash: "0123456789abcdef",
  themeKey: "population",
  componentKey: "trend",
  componentType: "line-chart",
};

const payload = (values, status = 0) => ({
  GET_STATS_DATA: {
    RESULT: { STATUS: status, ERROR_MSG: status === 0 ? undefined : "bad request" },
    STATISTICAL_DATA: {
      TABLE_INF: { TITLE: { $: "fixture" } },
      DATA_INF: { VALUE: values },
    },
  },
});

test("--limit は正の整数だけを受理し、0・負数・NaN・小数を拒否する", () => {
  assert.equal(parseAuditLimit(undefined), null);
  assert.equal(parseAuditLimit("1"), 1);
  for (const value of ["0", "-1", "NaN", "1.5", "Infinity"]) {
    assert.throws(() => parseAuditLimit(value), /positive integer/);
  }
});

test("依存mirrorのe-Stat/R2 schema・key・件数を検証する", () => {
  assert.deepEqual(
    parseDependencyMirror({
      distinctRequests: 1,
      requests: [mirrorRequest],
      distinctMetricRefs: 1,
      metrics: [mirrorMetric],
    }),
    {
      distinctExpected: 2,
      requests: [
        {
          key: mirrorRequest.key,
          theme: "population",
          componentKey: "trend",
          componentType: "line-chart",
          params: { statsDataId: "0000000001", cdCat01: "A" },
        },
      ],
      metrics: [
        {
          key: "r2:total-population",
          metricKey: "total-population",
          expectedUnit: "人",
          expectedConfigHash: "0123456789abcdef",
          theme: "population",
          componentKey: "trend",
          componentType: "line-chart",
        },
      ],
    },
  );
  assert.throws(
    () => parseDependencyMirror({ distinctRequests: 2, requests: [mirrorRequest] }),
    /count mismatch/,
  );
  assert.throws(
    () =>
      parseDependencyMirror({
        distinctRequests: 2,
        requests: [mirrorRequest, { ...mirrorRequest, themeKey: "other" }],
      }),
    /duplicate request key/,
  );
  assert.throws(
    () => parseDependencyMirror({ distinctRequests: 1, requests: [{ ...mirrorRequest, key: "wrong" }] }),
    /key does not match/,
  );
  assert.throws(
    () =>
      parseDependencyMirror({
        distinctRequests: 0,
        requests: [],
        distinctMetricRefs: 2,
        metrics: [mirrorMetric],
      }),
    /metric count mismatch/,
  );
  assert.equal(requestKey("2", { cdCat02: "B", cdCat01: "A" }), "2?cdCat01=A&cdCat02=B");
});

test("R2 stats payloadはunit・area meta・recipe hashを同時に検証する", () => {
  const rows = Array.from({ length: 47 }, (_, index) => ({
    areaCode: String(index + 1).padStart(2, "0") + "000",
    yearCode: "2024",
    value: index + 1,
    unit: "人",
  }));
  const fixture = {
    metricKey: mirrorMetric.metricKey,
    entityKind: "prefecture",
    rows,
    meta: { areaCount: 47, recipe: { configHash: mirrorMetric.expectedConfigHash } },
  };
  assert.deepEqual(inspectStatsPayload(fixture, mirrorMetric), {
    status: "ok",
    rows: 47,
    areaCount: 47,
    yearCount: 1,
    unit: "人",
  });
  assert.equal(
    inspectStatsPayload(
      { ...fixture, rows: rows.map((row) => ({ ...row, unit: "千人" })) },
      mirrorMetric,
    ).status,
    "unit-mismatch",
  );
  assert.equal(
    inspectStatsPayload({ ...fixture, rows: rows.slice(0, 46) }, mirrorMetric).status,
    "area-meta-mismatch",
  );
  assert.equal(
    inspectStatsPayload({ ...fixture, meta: { recipe: fixture.meta.recipe } }, mirrorMetric).status,
    "area-meta-missing",
  );
  assert.equal(
    inspectStatsPayload(
      {
        ...fixture,
        meta: { areaCount: 47, recipe: { configHash: "fedcba9876543210" } },
      },
      mirrorMetric,
    ).status,
    "recipe-drift",
  );
});

test("47県未満の正当な部分集計はshape-gate SSOTと同じwarn-onlyにする", () => {
  const rows = Array.from({ length: 39 }, (_, index) => ({
    areaCode: String(index + 1).padStart(2, "0") + "000",
    yearCode: "2024",
    value: index + 1,
    unit: "人",
  }));
  const result = inspectStatsPayload(
    {
      metricKey: mirrorMetric.metricKey,
      entityKind: "prefecture",
      rows,
      meta: { areaCount: 39, recipe: { configHash: mirrorMetric.expectedConfigHash } },
    },
    mirrorMetric,
  );
  assert.equal(result.status, "ok");
  assert.equal(result.areaCount, 39);
  assert.match(result.areaCoverageWarning, /warn-only by shape-gate SSOT/);
});

test("API status・malformed JSON・空行を別状態へ分類する", () => {
  const params = { statsDataId: "1", cdCat01: "A" };
  assert.equal(inspectEstatPayload(null, params).status, "malformed-json");
  assert.equal(inspectEstatPayload({}, params).status, "malformed-json");
  assert.equal(inspectEstatPayload(payload([], 100), params).status, "api-error");
  assert.equal(inspectEstatPayload(payload([]), params).status, "no-rows");
  assert.equal(inspectEstatPayload(payload(["bad-row"]), params).status, "malformed-json");
});

test("返却行が要求filterと違えばwrong-filterになる", () => {
  const params = { statsDataId: "1", cdCat01: "A", cdCat02: "B" };
  const correct = { "@cat01": "A", "@cat02": "B", "@area": "00000", $: "10" };
  const wrong = { ...correct, "@cat02": "OTHER" };
  assert.deepEqual(findWrongFilterRows([correct], params), []);
  assert.deepEqual(findWrongFilterRows([correct, wrong], params), [wrong]);
  assert.equal(inspectEstatPayload(payload([correct]), params).status, "ok");
  assert.equal(inspectEstatPayload(payload([correct, wrong]), params).status, "wrong-filter");
});

test("partialと件数不一致はcoverage成功へ化けない", () => {
  const ok = { key: "1", status: "ok" };
  assert.deepEqual(
    summarizeAudit({ distinctExpected: 2, requested: 1, results: [ok], isPartial: true }),
    { status: "partial", coverageOk: false, errorCount: 0, audited: 1 },
  );
  assert.equal(
    summarizeAudit({ distinctExpected: 2, requested: 2, results: [ok], isPartial: false }).coverageOk,
    false,
  );
  assert.deepEqual(
    summarizeAudit({
      distinctExpected: 2,
      requested: 2,
      results: [ok, { key: "2", status: "ok" }],
      isPartial: false,
    }),
    { status: "complete", coverageOk: true, errorCount: 0, audited: 2 },
  );
});
