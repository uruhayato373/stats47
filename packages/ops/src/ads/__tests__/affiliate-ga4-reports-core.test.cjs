"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  REPORT_SPECS,
  aggregatePageRows,
  derivePageType,
  fetchAllReports,
  fetchReportWithFallback,
  pivot,
} = require("../lib/affiliate-ga4-reports-core.cjs");

const gaRow = (event, dimensions, count) => ({
  dimensionValues: [event, ...dimensions].map((value) => ({ value })),
  metricValues: [{ value: String(count) }],
});

test("overview が最上位tierで成功しても experiments と pages を独立取得する", async () => {
  const calls = [];
  const reports = await fetchAllReports(async (dimensions) => {
    calls.push(dimensions);
    return [gaRow("affiliate_impression", dimensions.slice(1).map(() => "value"), 10)];
  });

  assert.equal(calls.length, 3);
  assert.ok(calls.some((dimensions) => dimensions.includes("customEvent:ad_id")));
  assert.ok(calls.some((dimensions) => dimensions.includes("customEvent:variant_id")));
  assert.ok(calls.some((dimensions) => dimensions.includes("pagePath")));
  assert.ok(reports.experiments.dimensions.includes("variant_id"));
});

test("pages report は高cardinalityな広告dimensionを混ぜずページ単位で取得する", () => {
  assert.deepEqual(REPORT_SPECS.pages.tiers[0], ["eventName", "pagePath"]);
  assert.equal(
    REPORT_SPECS.pages.tiers.some((dimensions) =>
      dimensions.some((dimension) => dimension.startsWith("customEvent:")),
    ),
    false,
  );
});

test("既存の高粒度page行もページ単位へ集約して派生値を再計算する", () => {
  assert.deepEqual(
    aggregatePageRows([
      { pagePath: "/blog/example", ad_id: "a", impressions: 3, clicks: 1, ctr: 1 / 3 },
      { pagePath: "/blog/example", ad_id: "b", impressions: 7, clicks: 1, ctr: 1 / 7 },
    ]),
    [{ pagePath: "/blog/example", impressions: 10, clicks: 2, ctr: 0.2, page_type: "blog" }],
  );
});

test("各reportのfallbackは他reportのdimension可用性を隠さない", async () => {
  const seen = [];
  const report = await fetchReportWithFallback(
    async (dimensions) => {
      seen.push(dimensions);
      if (dimensions.includes("customEvent:creative_size")) throw new Error("dimension-not-registered");
      return [gaRow("affiliate_click", ["exp-1", "B"], 3)];
    },
    "experiments",
    REPORT_SPECS.experiments,
  );

  assert.equal(seen.length, 2);
  assert.deepEqual(report.dimensions, ["experiment_id", "variant_id"]);
  assert.equal(report.failures.length, 1);
  assert.equal(report.rows[0].variant_id, "B");
});

test("標準pagePathからpage typeを決定的に導出する", () => {
  assert.equal(derivePageType("/ranking/total-population?x=1"), "ranking");
  assert.equal(derivePageType("/themes/population-dynamics"), "theme");
  assert.equal(derivePageType("/"), "home");
  assert.equal(derivePageType("/unknown/path"), "other");
  assert.equal(derivePageType("not-a-path"), "unknown");
});

test("pivotは同じdimension行のimp/clickを同時集計する", () => {
  const rows = pivot(
    [
      gaRow("affiliate_impression", ["labor", "sidebar"], 100),
      gaRow("affiliate_click", ["labor", "sidebar"], 4),
    ],
    ["eventName", "customEvent:affiliate_vertical", "customEvent:link_position"],
  );
  assert.deepEqual(rows, [
    {
      affiliate_vertical: "labor",
      link_position: "sidebar",
      impressions: 100,
      clicks: 4,
      ctr: 0.04,
    },
  ]);
});
