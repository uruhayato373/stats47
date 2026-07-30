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
  AD_UNIT_INVENTORY_FIELDS,
  extractSlotIdFromAdCode,
  adUnitInventoryRow,
  classifyInventoryStatus,
  buildInventoryManifest,
  ADSENSE_UNIT_FIELDS,
  ADSENSE_UNIT_MATCH_STATUSES,
  resolveUnitMatch,
  adsenseUnitRow,
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

// ── ad unit inventory (A1) ────────────────────────────────────────────────────

test("extractSlotIdFromAdCode: 実 adCode の data-ad-slot を抽出する (二重・単一引用符とも)", () => {
  const real = [
    '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7995274743017484" crossorigin="anonymous"></script>',
    '<ins class="adsbygoogle"',
    '     style="display:block"',
    '     data-ad-client="ca-pub-7995274743017484"',
    '     data-ad-slot="8185387982"',
    '     data-ad-format="auto"></ins>',
  ].join("\n");
  assert.equal(extractSlotIdFromAdCode(real), "8185387982");
  assert.equal(extractSlotIdFromAdCode("<ins data-ad-slot='1234567890'></ins>"), "1234567890");
  assert.equal(extractSlotIdFromAdCode("<ins data-ad-slot = \"555\"></ins>"), "555");
});

test("extractSlotIdFromAdCode: 取れないときは null (推測で埋めない)", () => {
  assert.equal(extractSlotIdFromAdCode('<ins data-ad-client="ca-pub-1"></ins>'), null);
  assert.equal(extractSlotIdFromAdCode(""), null);
  assert.equal(extractSlotIdFromAdCode(null), null);
  assert.equal(extractSlotIdFromAdCode(undefined), null);
  // 数字以外の slot は採らない (壊れた値を通さない)
  assert.equal(extractSlotIdFromAdCode('<ins data-ad-slot="abc"></ins>'), null);
});

test("adUnitInventoryRow: reportingDimensionId が unit_id・contentAdsSettings を展開する", () => {
  const row = adUnitInventoryRow(
    {
      name: "accounts/pub-1/adclients/ca-pub-1/adunits/9999",
      displayName: "stats47-hub-incontent",
      reportingDimensionId: "1234567890123456789",
      state: "ACTIVE",
      contentAdsSettings: { type: "DISPLAY", size: "1x3" },
    },
    '<ins data-ad-slot="8185387982"></ins>',
  );
  assert.deepEqual(row, {
    unit_id: "1234567890123456789",
    display_name: "stats47-hub-incontent",
    state: "ACTIVE",
    type: "DISPLAY",
    size: "1x3",
    slot_id: "8185387982",
  });
  // 契約の列とキー集合が一致する (CSV ヘッダとのドリフト防止)
  assert.deepEqual(Object.keys(row).sort(), [...AD_UNIT_INVENTORY_FIELDS].sort());
});

test("adUnitInventoryRow: 欠損は空文字にする (0 や推測で埋めない)", () => {
  const row = adUnitInventoryRow({ displayName: "広告" }, null);
  assert.equal(row.unit_id, "");
  assert.equal(row.type, "");
  assert.equal(row.size, "");
  assert.equal(row.slot_id, "");
  assert.equal(row.display_name, "広告");
});

test("classifyInventoryStatus: error / 0 行 / 行ありを区別する", () => {
  assert.equal(classifyInventoryStatus(0, { error: "boom" }), "error");
  assert.equal(classifyInventoryStatus(5, { error: "boom" }), "error");
  assert.equal(classifyInventoryStatus(0), "missing");
  assert.equal(classifyInventoryStatus(9), "complete");
});

test("buildInventoryManifest: inventory は期間・metric を持たず slot_id 欠損を limitation に残す", () => {
  const m = buildInventoryManifest({
    rowCount: 10,
    status: "complete",
    generatedAt: "2026-07-30T00:00:00.000Z",
    slotIdMissingCount: 2,
  });
  assert.equal(m.kind, "inventory");
  assert.equal(m.rowCount, 10);
  assert.deepEqual(m.fields, [...AD_UNIT_INVENTORY_FIELDS]);
  // レポート manifest と混ざらないこと (期間・metric・通貨を持たない)
  for (const k of ["periodStart", "periodEnd", "metrics", "dimensions", "currencyCode", "isFinalized"]) {
    assert.equal(k in m, false, `inventory manifest に ${k} を持たせない`);
  }
  assert.ok(
    m.limitations.some((l) => l.includes("slot_id") && l.includes("2")),
    "slot_id 欠損件数が limitation に出る",
  );
});

test("buildInventoryManifest: slot_id が全件取れたら欠損 limitation を出さない", () => {
  const m = buildInventoryManifest({
    rowCount: 10,
    status: "complete",
    generatedAt: "2026-07-30T00:00:00.000Z",
    slotIdMissingCount: 0,
  });
  assert.equal(m.limitations.some((l) => l.includes("slot_id")), false);
});

// ── unit 単位 history (A3) ────────────────────────────────────────────────────

/** テスト用の codeIndex を作る (indexCodeAdSlots と同形)。 */
function codeIndexFixture() {
  const hub = { exportName: "HUB_INCONTENT", slotId: "8185387982", adUnitName: "stats47-hub-incontent" };
  const footerA = { exportName: "RANKING_PAGE_FOOTER", slotId: "6137206504", adUnitName: "stats47-content-footer-multiplex" };
  const footerB = { exportName: "CONTENT_FOOTER", slotId: "6137206504", adUnitName: "stats47-content-footer-multiplex" };
  return {
    bySlotId: new Map([["8185387982", [hub]], ["6137206504", [footerA, footerB]]]),
    byAdUnitName: new Map([
      ["stats47-hub-incontent", [hub]],
      ["stats47-content-footer-multiplex", [footerA, footerB]],
    ]),
    slots: [hub, footerA, footerB],
  };
}

test("resolveUnitMatch: unit_id → inventory → コード側 slot で matched", () => {
  const inv = new Map([["111", { unit_id: "111", slot_id: "8185387982" }]]);
  const r = resolveUnitMatch({
    unitId: "111",
    unitName: "stats47-hub-incontent",
    inventoryByUnitId: inv,
    codeIndex: codeIndexFixture(),
  });
  assert.equal(r.matchStatus, "matched");
  assert.equal(r.slotId, "8185387982");
  assert.equal(r.codeSlot, "HUB_INCONTENT");
});

test("resolveUnitMatch: 共用 slot は両方の export 名を残す", () => {
  const inv = new Map([["222", { unit_id: "222", slot_id: "6137206504" }]]);
  const r = resolveUnitMatch({ unitId: "222", unitName: "x", inventoryByUnitId: inv, codeIndex: codeIndexFixture() });
  assert.equal(r.matchStatus, "matched");
  assert.equal(r.codeSlot, "RANKING_PAGE_FOOTER|CONTENT_FOOTER");
});

test("resolveUnitMatch: inventory にあるがコードが参照しない = unmanaged (Auto ads 等)", () => {
  const inv = new Map([["333", { unit_id: "333", slot_id: "9999999999" }]]);
  const r = resolveUnitMatch({ unitId: "333", unitName: "広告", inventoryByUnitId: inv, codeIndex: codeIndexFixture() });
  assert.equal(r.matchStatus, "unmanaged");
  assert.equal(r.slotId, "9999999999");
  assert.equal(r.codeSlot, "");
});

test("resolveUnitMatch: レポートにあるが inventory に無い = orphan (削除済みユニット)", () => {
  const r = resolveUnitMatch({ unitId: "444", unitName: "旧ユニット", inventoryByUnitId: new Map(), codeIndex: codeIndexFixture() });
  assert.equal(r.matchStatus, "orphan");
});

test("resolveUnitMatch: AD_UNIT_ID 列が無い週は名前で解決する (inventory 導入前の snapshot)", () => {
  const idx = codeIndexFixture();
  // adUnitName 完全一致 → matched
  const direct = resolveUnitMatch({ unitId: null, unitName: "stats47-hub-incontent", inventoryByUnitId: new Map(), codeIndex: idx });
  assert.equal(direct.matchStatus, "matched");
  assert.equal(direct.slotId, "8185387982");
  // legacy map 経由 → legacy-name-matched
  const legacy = resolveUnitMatch({
    unitId: null,
    unitName: "サイドバー右上",
    inventoryByUnitId: new Map(),
    codeIndex: idx,
    legacyNameMap: { "サイドバー右上": "stats47-hub-incontent" },
  });
  assert.equal(legacy.matchStatus, "legacy-name-matched");
  assert.equal(legacy.codeSlot, "HUB_INCONTENT");
  // どちらでも解決できない日本語旧名 → unmanaged (推測で結び付けない)
  const unresolved = resolveUnitMatch({ unitId: null, unitName: "左サイドバー", inventoryByUnitId: new Map(), codeIndex: idx });
  assert.equal(unresolved.matchStatus, "unmanaged");
});

test("resolveUnitMatch: codeIndex が空なら matched を出さない (突き合わせ不能を沈黙させない)", () => {
  const empty = { bySlotId: new Map(), byAdUnitName: new Map(), slots: [] };
  const inv = new Map([["111", { unit_id: "111", slot_id: "8185387982" }]]);
  const r = resolveUnitMatch({ unitId: "111", unitName: "stats47-hub-incontent", inventoryByUnitId: inv, codeIndex: empty });
  assert.equal(r.matchStatus, "unmanaged");
  assert.equal(r.codeSlot, "");
});

test("resolveUnitMatch: 返す status は必ず契約の 4 値のいずれか", () => {
  const idx = codeIndexFixture();
  const cases = [
    { unitId: "111", unitName: "a", inventoryByUnitId: new Map([["111", { slot_id: "8185387982" }]]) },
    { unitId: "999", unitName: "b", inventoryByUnitId: new Map() },
    { unitId: null, unitName: "stats47-hub-incontent", inventoryByUnitId: new Map() },
    { unitId: null, unitName: "未知", inventoryByUnitId: new Map() },
  ];
  for (const c of cases) {
    const r = resolveUnitMatch({ ...c, codeIndex: idx });
    assert.ok(ADSENSE_UNIT_MATCH_STATUSES.includes(r.matchStatus), `未知の status: ${r.matchStatus}`);
  }
});

test("adsenseUnitRow: 列集合が契約と一致し match 結果を保持する", () => {
  const row = adsenseUnitRow("2026-W31", {
    AD_UNIT_ID: "111",
    AD_UNIT_NAME: "stats47-hub-incontent",
    ESTIMATED_EARNINGS: "12",
    IMPRESSIONS: "300",
    IMPRESSIONS_RPM: "40",
    CLICKS: "3",
    IMPRESSIONS_CTR: "0.01",
    ACTIVE_VIEW_VIEWABILITY: "0.55",
    COST_PER_CLICK: "4",
    AD_REQUESTS: "500",
    AD_REQUESTS_COVERAGE: "0.9",
  }, { slotId: "8185387982", codeSlot: "HUB_INCONTENT", matchStatus: "matched" });
  assert.deepEqual(Object.keys(row).sort(), [...ADSENSE_UNIT_FIELDS].sort());
  assert.equal(row.match_status, "matched");
  assert.equal(row.code_slot, "HUB_INCONTENT");
  assert.equal(row.slot_id, "8185387982");
  assert.equal(row.earnings, "12.00");
  assert.equal(row.impressions_rpm, "40.00");
});

test("adsenseUnitRow: match 未指定なら unmanaged 扱い (matched に倒さない)", () => {
  const row = adsenseUnitRow("2026-W31", { AD_UNIT_NAME: "広告" }, null);
  assert.equal(row.match_status, "unmanaged");
  assert.equal(row.code_slot, "");
  assert.equal(row.unit_id, "");
});
