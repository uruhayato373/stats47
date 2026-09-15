import test from "node:test";
import assert from "node:assert/strict";
import { evaluateResult } from "../lib/thresholds.ts";

function makeResult(overrides = {}) {
  return {
    url: "https://stats47.jp/areas/13000",
    path: "/areas/13000",
    template: "prefecture-detail",
    http_status: 200,
    fetched_at: new Date().toISOString(),
    expected_redirect_or_gone: false,
    error: null,
    metrics: {},
    jsonld_type_counts: {},
    jsonld_errors: [],
    ...overrides,
  };
}

const noHistory = () => null;

test("絶対閾値を超えるとerror違反を返す", () => {
  const budgets = [
    { page_type: "all", metric_key: "dom_nodes", comparison: "absolute", threshold: 3000, operator: "<=", severity: "error" },
  ];
  const result = makeResult({ metrics: { dom_nodes: 9101 } });
  const violations = evaluateResult(result, budgets, noHistory);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].metric_key, "dom_nodes");
  assert.equal(violations[0].severity, "error");
});

test("絶対閾値以下は違反を返さない (正常ページの誤検出防止)", () => {
  const budgets = [
    { page_type: "all", metric_key: "dom_nodes", comparison: "absolute", threshold: 3000, operator: "<=", severity: "error" },
  ];
  const result = makeResult({ metrics: { dom_nodes: 1200 } });
  assert.deepEqual(evaluateResult(result, budgets, noHistory), []);
});

test("delta_pct: 直近値から30%超の増加で違反", () => {
  const budgets = [
    { page_type: "all", metric_key: "html_bytes", comparison: "delta_pct", threshold: 30, operator: "<=", severity: "error" },
  ];
  const result = makeResult({ metrics: { html_bytes: 140000 } });
  const previous = () => 100000; // +40%
  const violations = evaluateResult(result, budgets, previous);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].comparison, "delta_pct");
  assert.equal(violations[0].actual, 40);
});

test("delta_pct: 履歴が無い場合は判定をskipする(初回計測を退行扱いしない)", () => {
  const budgets = [
    { page_type: "all", metric_key: "html_bytes", comparison: "delta_pct", threshold: 30, operator: "<=", severity: "error" },
  ];
  const result = makeResult({ metrics: { html_bytes: 999999 } });
  assert.deepEqual(evaluateResult(result, budgets, noHistory), []);
});

test("HTTPエラーは常にerror違反として記録する", () => {
  const result = makeResult({ http_status: 500 });
  const violations = evaluateResult(result, [], noHistory);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].metric_key, "http_status");
  assert.equal(violations[0].severity, "error");
});

test("expected_redirect_or_gone=trueは判定を全skipする(301/410の意図的URLを退行扱いしない)", () => {
  const result = makeResult({ http_status: 410, expected_redirect_or_gone: true, metrics: { dom_nodes: 999999 } });
  const budgets = [
    { page_type: "all", metric_key: "dom_nodes", comparison: "absolute", threshold: 10, operator: "<=", severity: "error" },
  ];
  assert.deepEqual(evaluateResult(result, budgets, noHistory), []);
});

test("取得不能(unmeasured)な指標は判定しない(推測値で埋めない)", () => {
  const budgets = [
    { page_type: "all", metric_key: "lcp_ms", comparison: "absolute", threshold: 2500, operator: "<=", severity: "warning" },
  ];
  const result = makeResult({ metrics: { lcp_ms: { value: null, reason: "playwright timeout" } } });
  assert.deepEqual(evaluateResult(result, budgets, noHistory), []);
});

test("同一metricにwarning/error2段閾値がある場合、両方違反しても厳しい方(error)だけ報告する", () => {
  const budgets = [
    { page_type: "all", metric_key: "duplicate_link_ratio", comparison: "absolute", threshold: 0.3, operator: "<=", severity: "error" },
    { page_type: "all", metric_key: "duplicate_link_ratio", comparison: "absolute", threshold: 0.15, operator: "<=", severity: "warning" },
  ];
  const result = makeResult({ metrics: { duplicate_link_ratio: 0.5 } }); // 両方の閾値を超える
  const violations = evaluateResult(result, budgets, noHistory);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].severity, "error");
});

test("同一metricにwarning/error2段閾値がある場合、warningだけ違反すればwarningを報告する", () => {
  const budgets = [
    { page_type: "all", metric_key: "duplicate_link_ratio", comparison: "absolute", threshold: 0.3, operator: "<=", severity: "error" },
    { page_type: "all", metric_key: "duplicate_link_ratio", comparison: "absolute", threshold: 0.15, operator: "<=", severity: "warning" },
  ];
  const result = makeResult({ metrics: { duplicate_link_ratio: 0.2 } }); // warningのみ超える
  const violations = evaluateResult(result, budgets, noHistory);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].severity, "warning");
});

test("page_type固有の閾値がallより優先される", () => {
  const budgets = [
    { page_type: "all", metric_key: "dom_nodes", comparison: "absolute", threshold: 10000, operator: "<=", severity: "warning" },
    { page_type: "prefecture-detail", metric_key: "dom_nodes", comparison: "absolute", threshold: 3000, operator: "<=", severity: "error" },
  ];
  const result = makeResult({ metrics: { dom_nodes: 5000 } });
  const violations = evaluateResult(result, budgets, noHistory);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].severity, "error");
  assert.equal(violations[0].threshold, 3000);
});
