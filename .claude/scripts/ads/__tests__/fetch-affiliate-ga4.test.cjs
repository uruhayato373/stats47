"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { PLACEMENT_DIMENSIONS, REPORT_PAGE_SIZE, collectReports, runReport } = require("../fetch-affiliate-ga4.cjs");

const row = (event, dimensions, count) => ({
  dimensionValues: [event, ...dimensions].map(value => ({ value })),
  metricValues: [{ value: String(count) }],
});
const client = (respond) => ({ properties: { runReport: respond } });
const response = (rows, metadata = {}) => ({ data: { rows, rowCount: rows.length, metadata } });

test("同じページでも端末・広告・位置が異なる内訳を混ぜず、従来3reportを保持する", async () => {
  const calls = [];
  const reports = await collectReports(client(async ({ requestBody }) => {
    const dimensions = requestBody.dimensions.map(d => d.name);
    calls.push(dimensions);
    if (dimensions.includes("deviceCategory")) return response([
      row("affiliate_impression", ["/ranking/a", "mobile", "ad-1", "ranking-end"], 10),
      row("affiliate_click", ["/ranking/a", "mobile", "ad-1", "ranking-end"], 1),
      row("affiliate_impression", ["/ranking/a", "desktop", "ad-1", "ranking-sidebar"], 20),
      row("affiliate_impression", ["/ranking/a", "mobile", "ad-2", "ranking-end"], 5),
    ]);
    return response([row("affiliate_impression", dimensions.slice(1).map(() => "value"), 35)]);
  }), 28);
  assert.equal(calls.length, 4);
  assert.ok(calls.some(d => JSON.stringify(d) === JSON.stringify(["eventName", "pagePath"])));
  assert.deepEqual(Object.keys(reports), ["overview", "experiments", "pages", "placements"]);
  assert.deepEqual(reports.placements.dimensions, ["pagePath", "deviceCategory", "ad_id", "link_position"]);
  assert.equal(reports.placements.availability, "available");
  assert.equal(reports.placements.rows.length, 3);
  assert.deepEqual(reports.placements.rows[0], {
    pagePath: "/ranking/a", deviceCategory: "mobile", ad_id: "ad-1", link_position: "ranking-end",
    impressions: 10, clicks: 1, ctr: 0.1,
  });
  assert.equal(reports.placements.fetchQuality.rowsFetched, 4);
});

test("配置dimensionを取得できなければnullと理由を保存し、総数にfallbackしない", async () => {
  const reports = await collectReports(client(async ({ requestBody }) => {
    const dimensions = requestBody.dimensions.map(d => d.name);
    if (dimensions.includes("deviceCategory")) throw new Error("dimension-not-available");
    return response([row("affiliate_impression", dimensions.slice(1).map(() => "value"), 10)]);
  }), 28);
  assert.equal(reports.placements.availability, "unavailable");
  assert.equal(reports.placements.rows, null);
  assert.equal(reports.placements.fetchQuality, null);
  assert.match(reports.placements.failures[0].reason, /dimension-not-available/);
  assert.equal(reports.overview.rows[0].impressions, 10);
  assert.equal(reports.experiments.rows[0].impressions, 10);
  assert.equal(reports.pages.rows[0].impressions, 10);
});

test("明示rowCount=0の空reportだけを、取得成功の空配列として扱う", async () => {
  const reports = await collectReports(client(async () => response([])), 28);
  assert.equal(reports.placements.availability, "available");
  assert.deepEqual(reports.placements.rows, []);
  assert.equal(reports.placements.fetchQuality.rowCount, 0);
});

test("1万行を超える結果をoffsetで全取得し、sampling/thresholdメタデータも残す", async () => {
  const first = Array.from({ length: REPORT_PAGE_SIZE }, (_, index) => row("affiliate_impression", [`/ranking/${index}`, "mobile", "ad", "ranking-end"], 1));
  const last = row("affiliate_click", ["/ranking/last", "mobile", "ad", "ranking-end"], 1);
  const requests = [];
  const result = await runReport(client(async (request) => {
    requests.push(request.requestBody);
    return { data: {
      rowCount: REPORT_PAGE_SIZE + 1,
      rows: request.requestBody.offset === 0 ? first : [last],
      metadata: { dataLossFromOtherRow: true, subjectToThresholding: true, samplingMetadatas: [{ samplesReadCount: "10", samplingSpaceSize: "100" }] },
    } };
  }), PLACEMENT_DIMENSIONS, 28);
  assert.deepEqual(requests.map(r => r.offset), [0, REPORT_PAGE_SIZE]);
  assert.ok(requests.every(r => r.limit === REPORT_PAGE_SIZE));
  assert.deepEqual(requests[0].orderBys.map(o => o.dimension.dimensionName), PLACEMENT_DIMENSIONS);
  assert.deepEqual(requests[0].dimensionFilter.filter.inListFilter.values, ["affiliate_impression", "affiliate_click"]);
  assert.equal(result.rows.length, REPORT_PAGE_SIZE + 1);
  assert.equal(result.fetchQuality.pagesFetched, 2);
  assert.equal(result.fetchQuality.metadata[0].subjectToThresholding, true);
  assert.equal(result.fetchQuality.metadata[0].samplingMetadatas[0].samplesReadCount, "10");
});

test("rowCount欠損を0実績として成功させない", async () => {
  await assert.rejects(runReport(client(async () => ({ data: {} })), PLACEMENT_DIMENSIONS, 28), /ga4-row-count-unavailable/);
});

test("途中ページが空なら部分取得を成功として返さない", async () => {
  await assert.rejects(runReport(client(async ({ requestBody }) => ({ data: {
    rowCount: 2,
    rows: requestBody.offset === 0 ? [row("affiliate_impression", ["a"], 1)] : [],
  } })), PLACEMENT_DIMENSIONS, 28), /ga4-incomplete-report-page/);
});

test("ページング中に総件数が変われば取得を止める", async () => {
  await assert.rejects(runReport(client(async ({ requestBody }) => ({ data: {
    rowCount: requestBody.offset === 0 ? 2 : 3,
    rows: [row("affiliate_impression", ["a"], 1)],
  } })), PLACEMENT_DIMENSIONS, 28), /ga4-row-count-changed-during-pagination/);
});

test("rowCount以上の行が返れば不整合を明示する", async () => {
  await assert.rejects(runReport(client(async () => ({ data: {
    rowCount: 0, rows: [row("affiliate_impression", ["a"], 1)],
  } })), PLACEMENT_DIMENSIONS, 28), /ga4-row-count-exceeded/);
});
