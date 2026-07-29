/**
 * adsense-diagnostics.mjs / page-type.mjs のテスト — W26→W30 実測 fixture での検出・sample gate・
 * dedupe・past-effect 抑制・最大3件。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectImpressionDilution,
  detectDeviceRegression,
  detectPlacementLowViewability,
  detectFormatLowYield,
  detectMeasurementGap,
  detectTrafficMixShift,
  buildAdsenseCandidates,
  MAX_CANDIDATES,
  ADSENSE_ACTIVE_WIP_LIMIT,
  ADSENSE_WEEKLY_ADOPTION_LIMIT,
} from "../lib/adsense-diagnostics.mjs";
import { classifyPageType, aggregateByPageType, PAGE_TYPES } from "../lib/page-type.mjs";

const BASELINE_END = "2026-07-25";

// W26 / W30 の実測 snapshot 値 (committed CSV と一致)
const SITE_W26 = { earnings: 139, pageViews: 2616, impressions: 1856, viewability: 0.6773, pageRpm: 53 };
const SITE_W30 = { earnings: 129, pageViews: 3819, impressions: 4070, viewability: 0.5685, pageRpm: 34 };
const DESKTOP_W26 = { earnings: 110, pageViews: 1683, impressions: 1502, viewability: 0.6977, pageRpm: 66 };
const DESKTOP_W30 = { earnings: 88, pageViews: 2486, impressions: 3349, viewability: 0.5784, pageRpm: 35 };
const MOBILE_W26 = { earnings: 27, pageViews: 910, impressions: 337, viewability: 0.5732, pageRpm: 30 };
const MOBILE_W30 = { earnings: 38, pageViews: 1294, impressions: 670, viewability: 0.5124, pageRpm: 29 };

test("W26→W30: site 全体の impression-dilution を検出する", () => {
  const c = detectImpressionDilution({ current: SITE_W30, previous: SITE_W26, baselineEnd: BASELINE_END });
  assert.ok(c, "dilution が検出されない");
  assert.equal(c.rule, "impression-dilution");
  // imp/PV 0.709→1.066 (+50%)、viewability -10.9pt、RPM ¥53→¥34
  const impPerPv = c.evidence.find((e) => e.metric === "imp_per_pv");
  assert.ok(impPerPv.current > impPerPv.previous * 1.2);
  assert.equal(c.earliestDecisionDate, "2026-08-08"); // baseline+14日
  assert.equal(c.judgment.day28, "2026-08-22");
  assert.ok(c.guardrail.includes("GA4 sessions"));
  assert.ok(c.rollback);
});

test("W26→W30: Desktop の device-regression を検出し Mobile は検出しない", () => {
  const desktop = detectDeviceRegression({ device: "Desktop", current: DESKTOP_W30, previous: DESKTOP_W26, baselineEnd: BASELINE_END });
  assert.ok(desktop, "Desktop regression が検出されない");
  assert.equal(desktop.key, "Desktop");
  // Mobile は RPM ほぼ横ばい + 収益増 → 検出しない (mobile を先に変更する根拠は弱い)
  const mobile = detectDeviceRegression({ device: "Mobile", current: MOBILE_W30, previous: MOBILE_W26, baselineEnd: BASELINE_END });
  assert.equal(mobile, null);
});

test("sample gate: impressions 不足では判定しない", () => {
  const small = { ...SITE_W30, impressions: 999 };
  assert.equal(detectImpressionDilution({ current: small, previous: SITE_W26, baselineEnd: BASELINE_END }), null);
  const smallDev = { ...DESKTOP_W30, impressions: 499 };
  assert.equal(detectDeviceRegression({ device: "Desktop", current: smallDev, previous: DESKTOP_W26, baselineEnd: BASELINE_END }), null);
  assert.equal(
    detectPlacementLowViewability({ code: "X", platform: "Desktop", current: { impressions: 299, viewability: 0.3 }, weeksBelow: 3, baselineEnd: BASELINE_END }),
    null,
  );
});

test("previous 欠損 (missing) を 0 として扱わない — 検出は null", () => {
  assert.equal(detectImpressionDilution({ current: SITE_W30, previous: null, baselineEnd: BASELINE_END }), null);
  assert.equal(
    detectImpressionDilution({ current: SITE_W30, previous: { ...SITE_W26, viewability: "" }, baselineEnd: BASELINE_END }),
    null,
  );
});

test("placement-low-viewability: 2週連続 + 300imp で検出 (1週のみは検出しない)", () => {
  const cur = { impressions: 932, viewability: 0.312 }; // W30 の「広告」枠相当
  assert.ok(detectPlacementLowViewability({ code: "ad", platform: "Desktop", current: cur, weeksBelow: 2, baselineEnd: BASELINE_END }));
  assert.equal(detectPlacementLowViewability({ code: "ad", platform: "Desktop", current: cur, weeksBelow: 1, baselineEnd: BASELINE_END }), null);
});

test("format-low-yield: median 比 50% 未満 + viewability/CTR 悪化で検出・Auto ads は提案のみ", () => {
  const c = detectFormatLowYield({
    code: "INTERSTITIAL", platform: "HighEndMobile",
    current: { impressions: 600, impRpm: 10, viewability: 0.4, ctr: 0.01 },
    previous: { viewability: 0.5, ctr: 0.012 },
    deviceMedianImpRpm: 30,
    baselineEnd: BASELINE_END,
  });
  assert.ok(c);
  assert.match(c.expectedLever, /allowlist 外・提案のみ/);
  // 悪化なしなら検出しない
  const noWorse = detectFormatLowYield({
    code: "X", platform: "Desktop",
    current: { impressions: 600, impRpm: 10, viewability: 0.6, ctr: 0.02 },
    previous: { viewability: 0.5, ctr: 0.012 },
    deviceMedianImpRpm: 30,
    baselineEnd: BASELINE_END,
  });
  assert.equal(noWorse, null);
});

test("measurement-gap: missing/error/partial job を最優先候補にする (privacy-threshold は数えない)", () => {
  const c = detectMeasurementGap({
    jobStatuses: { overview: "complete", "formats-platforms": "missing", daily: "partial", pages: "privacy-threshold" },
    baselineEnd: BASELINE_END,
  });
  assert.ok(c);
  assert.ok(c.key.includes("formats-platforms"));
  assert.ok(c.key.includes("daily"));
  assert.ok(!c.key.includes("pages"), "privacy-threshold を gap に数えている");
  assert.ok(c.score > 100);
});

test("traffic-mix-shift: 15pt 以上の構成変化 + 効率低下で検出", () => {
  const c = detectTrafficMixShift({
    dimension: "platform",
    currentShares: { Desktop: 45, Mobile: 55 },
    previousShares: { Desktop: 65, Mobile: 35 },
    efficiencyDown: true,
    baselineEnd: BASELINE_END,
  });
  assert.ok(c);
  assert.equal(
    detectTrafficMixShift({
      dimension: "platform",
      currentShares: { Desktop: 60, Mobile: 40 },
      previousShares: { Desktop: 65, Mobile: 35 },
      efficiencyDown: true,
      baselineEnd: BASELINE_END,
    }),
    null,
  );
});

test("buildAdsenseCandidates: 最大3件・measurement-gap 最優先・dedupe・past-effect 抑制・決定的", () => {
  const input = {
    baselineEnd: BASELINE_END,
    account: { current: SITE_W30, previous: SITE_W26 },
    devices: [
      { device: "Desktop", current: DESKTOP_W30, previous: DESKTOP_W26 },
      { device: "Mobile", current: MOBILE_W30, previous: MOBILE_W26 },
    ],
    placements: [
      { code: "ad", platform: "Desktop", current: { impressions: 932, viewability: 0.312 }, weeksBelow: 2 },
      { code: "ranking", platform: "Desktop", current: { impressions: 767, viewability: 0.438 }, weeksBelow: 2 },
    ],
    jobStatuses: { "formats-platforms": "missing" },
    pastEffects: { "device-regression::Desktop": "none" },
  };
  const out = buildAdsenseCandidates(input);
  assert.ok(out.length <= MAX_CANDIDATES);
  assert.equal(out.length, 3);
  assert.equal(out[0].rule, "measurement-gap", "計測欠陥が最優先でない");
  // past-effect 抑制が効いている
  const dev = out.find((c) => c.id === "device-regression::Desktop");
  if (dev) {
    assert.equal(dev.pastEffect, "none");
    assert.ok(dev.confidence <= 0.42 + 1e-9);
  }
  // 決定的: 同じ入力で同じ出力
  assert.deepEqual(buildAdsenseCandidates(input).map((c) => c.id), out.map((c) => c.id));
});

test("WIP/採用の規律定数: active WIP≤2・週次採用≤1", () => {
  assert.equal(ADSENSE_ACTIVE_WIP_LIMIT, 2);
  assert.equal(ADSENSE_WEEKLY_ADOPTION_LIMIT, 1);
});

test("classifyPageType: 決定的分類・高カーディナリティ dimension を作らない", () => {
  assert.equal(classifyPageType("/"), "home");
  assert.equal(classifyPageType("/ranking/taxable-income-per-capita"), "ranking-detail");
  assert.equal(classifyPageType("/blog/black-tea-income-gap?utm_source=x"), "blog-detail");
  assert.equal(classifyPageType("/areas/13000"), "area-detail");
  assert.equal(classifyPageType("/areas/13000/cities/13201"), "area-detail");
  assert.equal(classifyPageType("/themes/tourism"), "theme-detail");
  assert.equal(classifyPageType("/category/population"), "category");
  assert.equal(classifyPageType("/search?q=x"), "search");
  assert.equal(classifyPageType("/survey/census"), "other");
  assert.equal(classifyPageType(""), "other");
  // 分類先は固定 8 種のみ
  assert.equal(PAGE_TYPES.length, 8);
});

test("aggregateByPageType: pagePath 行を type 別に合算する", () => {
  const rows = [
    { pagePath: "/ranking/a", screenPageViews: "10" },
    { pagePath: "/ranking/b", screenPageViews: "5" },
    { pagePath: "/blog/x", screenPageViews: "3" },
  ];
  const agg = aggregateByPageType(rows, { metricKeys: ["screenPageViews"] });
  assert.equal(agg["ranking-detail"].pages, 2);
  assert.equal(agg["ranking-detail"].screenPageViews, 15);
  assert.equal(agg["blog-detail"].screenPageViews, 3);
});
