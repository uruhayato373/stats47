/**
 * adsense-diagnostics — AdSense 収益密度の決定的診断 rules (pure・LLM 不使用)。
 *
 * 正典: docs/02_実装計画/41_AdSense継続改善・GA4_GSC設定自動化仕様.md §4.3 / §7.2 / §7.3。
 *
 * 入力は「確定7日の current / previous 集計」(account / device / breakdown)。
 * 出力 candidate は evidence・sample・confidence・expectedLever・guardrail・rollback・
 * earliestDecisionDate・pastEffect・confounders を必須で持つ。
 * 候補は最大 MAX_CANDIDATES 件、rule+key で dedupe、決定的順序 (score 降順 → id 昇順)。
 *
 * pure module (I/O なし)。テスト: __tests__/adsense-diagnostics.test.mjs
 */

import { effectWindows } from "./periods.mjs";

export const MAX_CANDIDATES = 3;
export const ADSENSE_ACTIVE_WIP_LIMIT = 2;
export const ADSENSE_WEEKLY_ADOPTION_LIMIT = 1;

/** rule 閾値 (§4.3)。数値は全てここに集約する。 */
export const RULES_CONFIG = Object.freeze({
  impressionDilution: { minImpressions: 1000, impPerPvRatio: 1.2, viewabilityDropPt: 8, rpmRatio: 0.85 },
  deviceRegression: { minImpressions: 500, rpmRatio: 0.8 },
  placementLowViewability: { minImpressions: 300, viewabilityBelow: 0.5, consecutiveWeeks: 2 },
  formatLowYield: { minImpressions: 500, impRpmRatioOfMedian: 0.5 },
  trafficMixShift: { sharePointShift: 15 },
});

const num = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const round = (v, d = 3) => (v === null ? null : Number(v.toFixed(d)));

/**
 * account/device 集計行の共通形:
 * { earnings, pageViews, impressions, viewability, pageRpm, impRpm?, ctr? }
 * breakdown 行: { code, platform, impressions, impRpm, viewability, ctr, earnings }
 */

function mk({ rule, key, score, evidence, sample, confidence, expectedLever, guardrail, rollback, baselineEnd, pastEffect = null, confounders = [], notes = [] }) {
  return {
    id: `${rule}::${key}`,
    rule,
    key,
    score: round(score, 4),
    evidence,
    sample,
    confidence: round(confidence, 2),
    expectedLever,
    guardrail,
    rollback,
    earliestDecisionDate: effectWindows(baselineEnd).day14,
    judgment: effectWindows(baselineEnd),
    pastEffect,
    confounders,
    notes,
    externalActionFlag: false, // 提案のみ。配置変更・deploy は人間承認 (§3.3)
  };
}

/** 1. impression-dilution (§4.3 rule 1)。 */
export function detectImpressionDilution({ current, previous, baselineEnd, scope = "site" }) {
  const c = RULES_CONFIG.impressionDilution;
  const imp = num(current?.impressions);
  const pImp = num(previous?.impressions);
  if (imp === null || imp < c.minImpressions || !previous) return null;
  const impPerPv = num(current.impressions) / (num(current.pageViews) || 1);
  const pImpPerPv = num(previous.impressions) / (num(previous.pageViews) || 1);
  const view = num(current.viewability);
  const pView = num(previous.viewability);
  const rpm = num(current.pageRpm) ?? num(current.impRpm);
  const pRpm = num(previous.pageRpm) ?? num(previous.impRpm);
  if ([pImpPerPv, view, pView, rpm, pRpm].some((v) => v === null)) return null;

  const densityUp = impPerPv >= pImpPerPv * c.impPerPvRatio;
  const viewDown = view <= pView - c.viewabilityDropPt / 100;
  const rpmDown = rpm <= pRpm * c.rpmRatio;
  if (!(densityUp && viewDown && rpmDown)) return null;

  return mk({
    rule: "impression-dilution",
    key: scope,
    score: (impPerPv / pImpPerPv) * (pRpm / Math.max(rpm, 0.01)),
    evidence: [
      { metric: "imp_per_pv", previous: round(pImpPerPv), current: round(impPerPv) },
      { metric: "viewability", previous: round(pView, 4), current: round(view, 4) },
      { metric: "page_rpm", previous: pRpm, current: rpm },
      { metric: "impressions", previous: pImp, current: imp },
    ],
    sample: { impressions: imp },
    confidence: 0.8,
    expectedLever: "lazy-load rootMargin / 枠密度の部分ロールバックで viewable imp 比率を回復",
    guardrail: "収益・GA4 sessions・viewability・LCP/CLS を baseline 比で悪化させない",
    rollback: "rootMargin 値を元に戻す (1 commit revert)",
    baselineEnd,
    confounders: ["同時期の Auto ads / format 変更", "seasonality (曜日構成)"],
  });
}

/** 2. device-regression (§4.3 rule 2)。 */
export function detectDeviceRegression({ device, current, previous, baselineEnd }) {
  const c = RULES_CONFIG.deviceRegression;
  const imp = num(current?.impressions);
  if (imp === null || imp < c.minImpressions || !previous) return null;
  const rpm = num(current.pageRpm);
  const pRpm = num(previous.pageRpm);
  const earn = num(current.earnings);
  const pEarn = num(previous.earnings);
  if ([rpm, pRpm, earn, pEarn].some((v) => v === null)) return null;
  if (!(rpm <= pRpm * c.rpmRatio && earn <= pEarn)) return null;
  return mk({
    rule: "device-regression",
    key: device,
    score: pRpm / Math.max(rpm, 0.01),
    evidence: [
      { metric: "page_rpm", previous: pRpm, current: rpm },
      { metric: "earnings", previous: pEarn, current: earn },
      { metric: "impressions", previous: num(previous.impressions), current: imp },
    ],
    sample: { impressions: imp },
    confidence: 0.7,
    expectedLever: `${device} の広告密度/読み込み距離の見直し (1 レバーのみ)`,
    guardrail: "他 device の収益・viewability を悪化させない",
    rollback: "変更 commit の revert",
    baselineEnd,
    confounders: ["traffic mix の変化 (query/ページ種別)", "季節性"],
  });
}

/** 3. placement-low-viewability (§4.3 rule 3)。2 週連続を weeksBelow で受ける。 */
export function detectPlacementLowViewability({ code, platform, current, weeksBelow, baselineEnd }) {
  const c = RULES_CONFIG.placementLowViewability;
  const imp = num(current?.impressions);
  const view = num(current?.viewability);
  if (imp === null || imp < c.minImpressions || view === null) return null;
  if (!(view < c.viewabilityBelow && weeksBelow >= c.consecutiveWeeks)) return null;
  return mk({
    rule: "placement-low-viewability",
    key: `${code}@${platform}`,
    score: (c.viewabilityBelow - view) * 10 + imp / 10000,
    evidence: [
      { metric: "viewability", current: round(view, 4), threshold: c.viewabilityBelow },
      { metric: "impressions", current: imp },
      { metric: "weeks_below", current: weeksBelow },
    ],
    sample: { impressions: imp, weeks: weeksBelow },
    confidence: 0.75,
    expectedLever: "低 viewability 1 枠のみ移設または非表示 (§7.4-2)",
    guardrail: "収益・他枠の viewability を悪化させない。同時に複数枠を変えない",
    rollback: "枠設定の revert",
    baselineEnd,
    confounders: ["lazy-load 距離との交絡"],
  });
}

/** 4. format-low-yield (§4.3 rule 4)。deviceMedianImpRpm は同 platform の median。 */
export function detectFormatLowYield({ code, platform, current, previous, deviceMedianImpRpm, baselineEnd }) {
  const c = RULES_CONFIG.formatLowYield;
  const imp = num(current?.impressions);
  const impRpm = num(current?.impRpm);
  const median = num(deviceMedianImpRpm);
  if (imp === null || imp < c.minImpressions || impRpm === null || median === null || median <= 0) return null;
  if (!(impRpm < median * c.impRpmRatioOfMedian)) return null;
  // viewability または CTR も悪化していること
  const view = num(current?.viewability);
  const pView = num(previous?.viewability);
  const ctr = num(current?.ctr);
  const pCtr = num(previous?.ctr);
  const viewWorse = view !== null && pView !== null && view < pView;
  const ctrWorse = ctr !== null && pCtr !== null && ctr < pCtr;
  if (!(viewWorse || ctrWorse)) return null;
  return mk({
    rule: "format-low-yield",
    key: `${code}@${platform}`,
    score: median / Math.max(impRpm, 0.01),
    evidence: [
      { metric: "imp_rpm", current: impRpm, deviceMedian: median },
      { metric: "viewability", previous: pView, current: view },
      { metric: "ctr", previous: pCtr, current: ctr },
      { metric: "impressions", current: imp },
    ],
    sample: { impressions: imp },
    confidence: 0.6,
    expectedLever: "低収益 format の整理提案 (Auto ads 変更は allowlist 外・提案のみ §7.4-3)",
    guardrail: "収益 guardrail。UX (INTERSTITIAL 頻度) を悪化させない",
    rollback: "AdSense 管理画面設定を元に戻す (人間操作)",
    baselineEnd,
    confounders: ["format 間の在庫シフト"],
  });
}

/** 5. measurement-gap (§4.3 rule 5)。manifest の status から。 */
export function detectMeasurementGap({ jobStatuses, baselineEnd }) {
  const bad = Object.entries(jobStatuses ?? {}).filter(
    ([, s]) => s === "missing" || s === "error" || s === "stale" || s === "partial",
  );
  if (!bad.length) return null;
  return mk({
    rule: "measurement-gap",
    key: bad.map(([k]) => k).sort().join(","),
    score: 100 + bad.length, // 計測欠陥は最優先 (判断可能な状態が先・§3.4 Measurement)
    evidence: bad.map(([job, status]) => ({ metric: `job:${job}`, status })),
    sample: { jobs: bad.length },
    confidence: 0.95,
    expectedLever: "report job の取得是正 (creds / API 互換 / retry)",
    guardrail: "—",
    rollback: "—",
    baselineEnd,
    notes: ["privacy-threshold は gap に数えない (仕様上の制約)"],
  });
}

/** 6. traffic-mix-shift (§4.3 rule 6)。shares は {key: sharePct} (合計 100)。 */
export function detectTrafficMixShift({ dimension, currentShares, previousShares, efficiencyDown, baselineEnd }) {
  const c = RULES_CONFIG.trafficMixShift;
  if (!currentShares || !previousShares || !efficiencyDown) return null;
  const keys = new Set([...Object.keys(currentShares), ...Object.keys(previousShares)]);
  let maxShift = 0;
  let shiftKey = null;
  for (const k of keys) {
    const shift = Math.abs((currentShares[k] ?? 0) - (previousShares[k] ?? 0));
    if (shift > maxShift) {
      maxShift = shift;
      shiftKey = k;
    }
  }
  if (maxShift < c.sharePointShift) return null;
  return mk({
    rule: "traffic-mix-shift",
    key: `${dimension}:${shiftKey}`,
    score: maxShift / 10,
    evidence: [
      { metric: `share:${shiftKey}`, previous: previousShares[shiftKey] ?? 0, current: currentShares[shiftKey] ?? 0 },
    ],
    sample: { shiftPt: round(maxShift, 1) },
    confidence: 0.5,
    expectedLever: "収益悪化が構成変化由来かの切り分け (配置変更ではない)",
    guardrail: "—",
    rollback: "—",
    baselineEnd,
    confounders: ["SEO/SNS 流入の変化そのもの"],
  });
}

/**
 * 全 rule を実行し、dedupe + past-effect 抑制 + 決定的順序で最大 MAX_CANDIDATES 件を返す。
 * @param {{account:{current,previous}, devices:Array<{device,current,previous}>,
 *   placements?:Array, formats?:Array, jobStatuses?:object,
 *   trafficMix?:{dimension,currentShares,previousShares,efficiencyDown},
 *   baselineEnd:string, pastEffects?:Record<string,"none"|"adverse">}} input
 */
export function buildAdsenseCandidates(input) {
  const { baselineEnd, pastEffects = {} } = input;
  const out = [];
  const push = (c) => {
    if (c) out.push(c);
  };
  push(detectMeasurementGap({ jobStatuses: input.jobStatuses, baselineEnd }));
  push(detectImpressionDilution({ current: input.account?.current, previous: input.account?.previous, baselineEnd }));
  for (const d of input.devices ?? []) {
    push(detectDeviceRegression({ device: d.device, current: d.current, previous: d.previous, baselineEnd }));
  }
  for (const p of input.placements ?? []) {
    push(detectPlacementLowViewability({ ...p, baselineEnd }));
  }
  for (const f of input.formats ?? []) {
    push(detectFormatLowYield({ ...f, baselineEnd }));
  }
  if (input.trafficMix) push(detectTrafficMixShift({ ...input.trafficMix, baselineEnd }));

  // dedupe (rule+key) + past-effect 抑制
  const seen = new Set();
  const deduped = [];
  for (const c of out) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    const past = pastEffects[c.id] ?? pastEffects[c.key];
    if (past === "none") c.confidence = round(c.confidence * 0.6, 2);
    if (past === "adverse") c.confidence = round(c.confidence * 0.3, 2);
    if (past) {
      c.pastEffect = past;
      c.notes.push(`過去施策 effect/${past} — confidence を抑制`);
    }
    deduped.push(c);
  }
  deduped.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
  return deduped.slice(0, MAX_CANDIDATES);
}
