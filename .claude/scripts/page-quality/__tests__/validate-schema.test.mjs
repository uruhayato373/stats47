import test from "node:test";
import assert from "node:assert/strict";
import { validateAuditRun } from "../validate-schema.ts";

function validRun(overrides = {}) {
  return {
    schemaVersion: 1,
    mode: "representative",
    generated_at: new Date().toISOString(),
    commit_sha: "abc123",
    environment: "http://localhost:3100",
    results: [
      {
        url: "http://localhost:3100/",
        path: "/",
        template: "home",
        http_status: 200,
        fetched_at: new Date().toISOString(),
        expected_redirect_or_gone: false,
        error: null,
        metrics: { dom_nodes: 100, lcp_ms: { value: null, reason: "timeout" } },
        jsonld_type_counts: {},
        jsonld_errors: [],
      },
    ],
    violations: [],
    ...overrides,
  };
}

test("正しい形のAuditRunはvalidと判定する", () => {
  assert.deepEqual(validateAuditRun(validRun()), []);
});

test("schemaVersionが不正なら検出する", () => {
  const errors = validateAuditRun(validRun({ schemaVersion: 2 }));
  assert.ok(errors.some((e) => e.path === "schemaVersion"));
});

test("resultsが配列でないなら検出する", () => {
  const errors = validateAuditRun(validRun({ results: "not-an-array" }));
  assert.ok(errors.some((e) => e.path === "results"));
});

test("metricsの値がobject/number/boolean以外なら検出する", () => {
  const run = validRun();
  run.results[0].metrics.bad = "string-is-invalid";
  const errors = validateAuditRun(run);
  assert.ok(errors.some((e) => e.path.includes("metrics.bad")));
});

test("violationsのseverityが不正な値なら検出する", () => {
  const run = validRun({
    violations: [
      { url: "http://localhost:3100/", metric_key: "dom_nodes", severity: "critical", actual: 1 },
    ],
  });
  const errors = validateAuditRun(run);
  assert.ok(errors.some((e) => e.path.includes("severity")));
});

test("トップレベルがobjectでなければ即エラーを返す", () => {
  assert.deepEqual(validateAuditRun(null), [{ path: "$", message: "not an object" }]);
});
