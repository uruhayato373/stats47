import assert from "node:assert/strict";
import test from "node:test";
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

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

test("CLIはR2指標の部分監査をJSONへ出力し、未検査の指標を成功扱いにしない", async () => {
  const mirror = JSON.parse(readFileSync(new URL("../theme-chart-dependencies.generated.json", import.meta.url), "utf8"));
  const metric = mirror.metrics[0];
  const payload = {
    metricKey: metric.metricKey,
    entityKind: "prefecture",
    rows: Array.from({ length: 47 }, (_, index) => ({
      areaCode: String(index + 1).padStart(2, "0") + "000",
      yearCode: "2024",
      value: index + 1,
      unit: metric.expectedUnit,
    })),
    meta: { areaCount: 47, recipe: { configHash: metric.expectedConfigHash } },
  };
  const server = createServer((request, response) => {
    assert.equal(request.url, `/app/stats/${metric.metricKey}/values.json`);
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(payload));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const directory = mkdtempSync(path.join(tmpdir(), "stats47-theme-audit-"));
  const output = path.join(directory, "audit.json");
  try {
    await assert.rejects(promisify(execFile)(process.execPath, [
      fileURLToPath(new URL("../theme-chart-live-audit.mjs", import.meta.url)),
      "--limit", "1", "--json", output,
    ], {
      env: {
        ...process.env,
        R2_PUBLIC_FETCH_URL: `http://127.0.0.1:${server.address().port}`,
        HTTPS_PROXY: "", https_proxy: "", HTTP_PROXY: "", http_proxy: "",
      },
      timeout: 15000,
    }), (error) => error.code === 1 && /期待集合と実集合が一致しません/.test(error.stderr));
    const report = JSON.parse(readFileSync(output, "utf8"));
    assert.equal(report.r2MetricExpected, mirror.metrics.length);
    assert.equal(report.status, "partial");
    assert.equal(report.coverageOk, false);
    assert.equal(report.errorCount, 0);
    assert.equal(report.audited, 1);
    assert.equal(report.results[0].metricKey, metric.metricKey);
    assert.equal(report.results[0].status, "ok");
    assert.equal("legacyEstatExpected" in report, false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (path.dirname(directory) !== path.resolve(tmpdir())) throw new Error("Unexpected temporary directory");
    rmSync(directory, { recursive: true, force: true });
  }
});

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

test("依存mirrorは登録metric参照だけを受理する", () => {
 const parsed=parseDependencyMirror({distinctMetricRefs:1,metrics:[mirrorMetric]});
 assert.equal(parsed.distinctExpected,1);assert.equal(parsed.metrics[0].key,"r2:total-population");
 assert.throws(()=>parseDependencyMirror({distinctMetricRefs:1,metrics:[mirrorMetric],requests:[mirrorRequest]}),/metrics\[\] only/);
 assert.throws(()=>parseDependencyMirror({distinctMetricRefs:2,metrics:[mirrorMetric]}),/metric count mismatch/);
 assert.throws(()=>parseDependencyMirror({distinctMetricRefs:2,metrics:[mirrorMetric,mirrorMetric]}),/duplicate metric key/);
 assert.throws(()=>parseDependencyMirror({distinctMetricRefs:1,metrics:[{...mirrorMetric,expectedConfigHash:"broken"}]}),/expectedConfigHash is invalid/);
 assert.equal(requestKey("2",{cdCat02:"B",cdCat01:"A"}),"2?cdCat01=A&cdCat02=B");
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
