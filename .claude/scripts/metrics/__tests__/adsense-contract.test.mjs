/**
 * adsense-report-contract.mjs のテスト — job 互換・status 分類・manifest・schema v2 移行。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REPORT_JOBS,
  jobByName,
  classifyJobStatus,
  buildJobManifest,
  currencyFromHeaders,
  METRICS_FULL,
  METRICS_IMPRESSION_BASED,
  migrateAdsenseHistoryRows,
  migrateAdsenseDeviceRows,
  adsenseHistoryRowFromOverview,
  adsenseDeviceRowFromSnapshot,
  adsenseBreakdownRow,
  ADSENSE_HISTORY_FIELDS_V2,
  ADSENSE_DEVICE_FIELDS_V2,
} from "../lib/adsense-report-contract.mjs";
import { resolvePeriods } from "../lib/periods.mjs";

test("job 契約: unit/format/placement/bid-type/traffic/country は PAGE_VIEWS を要求しない", () => {
  for (const name of ["units", "formats-platforms", "placements-platforms", "bid-types-platforms", "traffic-sources", "countries"]) {
    const job = jobByName(name);
    assert.ok(!job.metrics.includes("PAGE_VIEWS"), `${name} が PAGE_VIEWS を要求している`);
    assert.ok(!job.metrics.includes("PAGE_VIEWS_RPM"), `${name} が PAGE_VIEWS_RPM を要求している`);
    assert.ok(job.metrics.includes("IMPRESSIONS_RPM"), `${name} の主指標 IMPRESSIONS_RPM が無い`);
  }
  // overview/daily/devices は PAGE_VIEWS 系を持つ
  for (const name of ["overview", "daily", "devices"]) {
    assert.ok(jobByName(name).metrics.includes("PAGE_VIEWS"));
  }
  // 公式 CPC 系 4 metric が全 job に入る
  for (const job of REPORT_JOBS) {
    for (const m of ["COST_PER_CLICK", "IMPRESSIONS_RPM", "AD_REQUESTS", "AD_REQUESTS_COVERAGE"]) {
      assert.ok(job.metrics.includes(m), `${job.name} に ${m} が無い`);
    }
  }
});

test("未知 job は throw (契約外の組合せを黙って投げない)", () => {
  assert.throws(() => jobByName("nonexistent"), /unknown adsense report job/);
});

test("classifyJobStatus: PAGE_URL 0行=privacy-threshold / 他0行=missing / 欠損日=partial / error", () => {
  const pages = jobByName("pages");
  const overview = jobByName("overview");
  const daily = jobByName("daily");
  assert.equal(classifyJobStatus(pages, 0, {}), "privacy-threshold");
  assert.equal(classifyJobStatus(overview, 0, {}), "missing");
  assert.equal(classifyJobStatus(daily, 6, { missingDates: ["2026-07-21"] }), "partial");
  assert.equal(classifyJobStatus(overview, 1, { error: "boom" }), "error");
  assert.equal(classifyJobStatus(overview, 1, {}), "complete");
});

test("manifest: 必須 metadata + currency unknown を推定で埋めない", () => {
  const periods = resolvePeriods({ source: "adsense", week: "2026-W30", now: "2026-07-26T11:00:00Z" });
  const m = buildJobManifest({
    job: jobByName("overview"),
    period: periods.finalized7d,
    rowCount: 1,
    status: "complete",
    generatedAt: "2026-07-26T11:00:00Z",
    currencyCode: null,
    timeZone: null,
  });
  assert.equal(m.schemaVersion, 2);
  assert.equal(m.periodStart, "2026-07-19");
  assert.equal(m.periodEnd, "2026-07-25");
  assert.equal(m.windowDays, 7);
  assert.equal(m.isFinalized, true);
  assert.equal(m.currencyCode, "unknown");
  assert.equal(m.timeZone, "unknown");
  assert.match(m.limitations.join(" "), /currencyCode/);
  assert.match(m.limitations.join(" "), /推定値/);
  // privacy-threshold は limitation で説明される
  const pt = buildJobManifest({
    job: jobByName("pages"),
    period: periods.finalized7d,
    rowCount: 0,
    status: "privacy-threshold",
    generatedAt: "2026-07-26T11:00:00Z",
  });
  assert.match(pt.limitations.join(" "), /プライバシー閾値/);
});

test("currencyFromHeaders: monetary header から抽出・無ければ null", () => {
  assert.equal(currencyFromHeaders([{ name: "CLICKS" }, { name: "ESTIMATED_EARNINGS", currencyCode: "JPY" }]), "JPY");
  assert.equal(currencyFromHeaders([{ name: "CLICKS" }]), null);
  assert.equal(currencyFromHeaders(undefined), null);
});

test("migrateAdsenseHistoryRows: 公式列を '' で追加 (0 補完しない)・冪等・値保全", () => {
  const legacy = [{ week: "2026-W26", earnings: "139.00", page_views: "2616", rpm: "53.000", impressions: "1856", clicks: "24", ctr: "0.0129", viewability: "0.6773" }];
  const { rows, migrated } = migrateAdsenseHistoryRows(legacy);
  assert.equal(migrated, true);
  assert.equal(rows[0].cost_per_click, "");
  assert.equal(rows[0].ad_requests, "");
  assert.equal(rows[0].earnings, "139.00");
  const again = migrateAdsenseHistoryRows(rows);
  assert.equal(again.migrated, false);
});

test("migrateAdsenseDeviceRows: cpc→earnings_per_click_legacy 改名・公式CPCは '' ", () => {
  const legacy = [{ week: "2026-W30", platform: "Desktop", earnings: "88.00", page_views: "2486", rpm: "35.00", impressions: "3349", clicks: "4", ctr: "0.0012", viewability: "0.5784", cpc: "22.00", imp_per_pv: "1.347" }];
  const { rows, migrated } = migrateAdsenseDeviceRows(legacy);
  assert.equal(migrated, true);
  assert.equal(rows[0].earnings_per_click_legacy, "22.00");
  assert.equal(rows[0].cpc, undefined);
  assert.equal(rows[0].cost_per_click, "");
  assert.equal(rows[0].imp_per_pv, "1.347");
  assert.equal(migrateAdsenseDeviceRows(rows).migrated, false);
});

test("adsenseHistoryRowFromOverview: 公式列が snapshot に無ければ '' (null)・あれば保存", () => {
  const noOfficial = adsenseHistoryRowFromOverview("2026-W30", {
    ESTIMATED_EARNINGS: "129", PAGE_VIEWS: "3819", PAGE_VIEWS_RPM: "34",
    IMPRESSIONS: "4070", CLICKS: "29", IMPRESSIONS_CTR: "0.0071", ACTIVE_VIEW_VIEWABILITY: "0.5685",
  });
  assert.equal(noOfficial.cost_per_click, "");
  assert.equal(noOfficial.impressions_rpm, "");
  assert.equal(noOfficial.earnings, "129.00");
  const withOfficial = adsenseHistoryRowFromOverview("2026-W31", {
    ESTIMATED_EARNINGS: "140", PAGE_VIEWS: "4000", PAGE_VIEWS_RPM: "35",
    IMPRESSIONS: "4200", IMPRESSIONS_RPM: "33.3", CLICKS: "30", IMPRESSIONS_CTR: "0.0071",
    COST_PER_CLICK: "4.67", ACTIVE_VIEW_VIEWABILITY: "0.60", AD_REQUESTS: "5000", AD_REQUESTS_COVERAGE: "0.84",
  });
  assert.equal(withOfficial.cost_per_click, "4.67");
  assert.equal(withOfficial.impressions_rpm, "33.30");
  assert.equal(withOfficial.ad_requests, 5000);
  // 列集合は v2 契約と一致
  assert.deepEqual(Object.keys(withOfficial).sort(), [...ADSENSE_HISTORY_FIELDS_V2].sort());
});

test("adsenseDeviceRowFromSnapshot: 公式CPCとlegacy収益/clickを別列で持つ (混同しない)", () => {
  const r = adsenseDeviceRowFromSnapshot("2026-W31", {
    PLATFORM_TYPE_NAME: "Desktop", ESTIMATED_EARNINGS: "88", PAGE_VIEWS: "2486", PAGE_VIEWS_RPM: "35",
    IMPRESSIONS: "3349", IMPRESSIONS_RPM: "26.3", CLICKS: "4", IMPRESSIONS_CTR: "0.0012",
    COST_PER_CLICK: "5.10", ACTIVE_VIEW_VIEWABILITY: "0.5784",
  });
  assert.equal(r.cost_per_click, "5.10");
  assert.equal(r.earnings_per_click_legacy, "22.00"); // 88/4 — 公式CPCとは別値
  assert.notEqual(r.cost_per_click, r.earnings_per_click_legacy);
  assert.deepEqual(Object.keys(r).sort(), [...ADSENSE_DEVICE_FIELDS_V2].sort());
});

test("adsenseBreakdownRow: format×platform 行の履歴化", () => {
  const r = adsenseBreakdownRow("2026-W31", "AD_FORMAT_CODE", {
    AD_FORMAT_CODE: "ON_PAGE", PLATFORM_TYPE_CODE: "HighEndMobile",
    ESTIMATED_EARNINGS: "20", IMPRESSIONS: "500", IMPRESSIONS_RPM: "40", CLICKS: "10",
    IMPRESSIONS_CTR: "0.02", ACTIVE_VIEW_VIEWABILITY: "0.55", COST_PER_CLICK: "2.0",
  });
  assert.equal(r.code, "ON_PAGE");
  assert.equal(r.platform, "HighEndMobile");
  assert.equal(r.impressions_rpm, "40.00");
});

test("adsense 期間契約: finalized7d は GA4 と同じ 1 日遅延・未来週拒否", () => {
  const p = resolvePeriods({ source: "adsense", week: "2026-W30", now: "2026-07-26T11:00:00Z" });
  assert.deepEqual(p.finalized7d, { periodStart: "2026-07-19", periodEnd: "2026-07-25", windowDays: 7 });
  assert.throws(() => resolvePeriods({ source: "adsense", week: "2026-W31", now: "2026-07-26T11:00:00Z" }), /future/);
});

test("METRICS_FULL と IMPRESSION_BASED の差は PAGE_VIEWS 系のみ", () => {
  const diff = METRICS_FULL.filter((m) => !METRICS_IMPRESSION_BASED.includes(m));
  assert.deepEqual(diff.sort(), ["PAGE_VIEWS", "PAGE_VIEWS_RPM"]);
});
