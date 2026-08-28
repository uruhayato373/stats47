/**
 * アフィリエイト運用 集約状態 (.claude/state/ads/affiliate-operations-latest.json) の決定的コア。
 *
 * 純粋関数のみ (I/O なし)。CLI (.claude/scripts/ads/build-affiliate-operations-state.ts) が
 * snapshot 群 (inventory / GA4 / compliance / experiments registry / AFFILIATE_ADS) を渡す。
 * テスト: .claude/scripts/ads/__tests__/affiliate-operations-core.test.mjs (node --test)。
 *
 * 正典: .claude/rules/affiliate-ads-standards.md §6 / §8、
 *       .claude/skills/analytics/affiliate-improvement/SKILL.md。
 * routing・freshness・期限・sample 到達の判定はすべてここで決定的に行い、モデルに判断させない。
 */

export const OPERATIONS_SCHEMA_VERSION = 2;

/**
 * GA4 snapshot の要求 schema (doc 42 §10.1)。v2 未満 (= 旧 `ad_impression` 汚染データ) は
 * 値が新鮮でも `ga4-schema-unsupported` で blocked にする。
 * 実測根拠 (2026-07-26 snapshot): 旧 schema の imp 13,115 は全件 AdSense 由来で分母にならない。
 */
export const GA4_SNAPSHOT_SCHEMA_VERSION = 2;
export const MEASUREMENT_EPOCH = "affiliate-impression-v1";
export const IMPRESSION_EVENT_NAME = "affiliate_impression";
/** `(not set)`/`(unset)` vertical の許容比率 (doc 42 §10.2 の named constant)。 */
export const MAX_UNSET_VERTICAL_RATIO = 0.1;
/** 認識する 10 vertical (AffiliateVertical union。affiliate-category.ts と一致させる)。 */
export const KNOWN_AFFILIATE_VERTICALS = [
  "labor",
  "housing",
  "population",
  "economy",
  "health",
  "energy",
  "travel",
  "furusato",
  "education",
  "mobility",
];

/**
 * freshness 閾値 (日)。週次 cadence (日曜 cron) + 3 日 grace。
 * これを超えた snapshot は「観測が止まっている」とみなし measurementGate を blocked にする。
 */
export const STALE_THRESHOLD_DAYS = { inventory: 10, ga4: 10 };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** ISO 文字列間の経過日数 (整数・切り捨て)。from が不正なら null。 */
export function daysBetween(fromIso, toIso) {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.floor((to - from) / MS_PER_DAY);
}

/**
 * 計測ゲート判定。GA4 snapshot の有無・鮮度・custom dimension を決定的に評価する。
 * @param {object} args
 * @param {object|null} args.ga4 GA4 snapshot (fetch-affiliate-ga4.cjs の出力) or null
 * @param {object|null} args.inventory inventory snapshot (audit-affiliate-inventory.ts の出力) or null
 * @param {string} args.nowIso 現在時刻 (ISO)
 * @param {boolean} args.hasActiveExperiments 進行中実験があるか (variant dimension 要否)
 * @returns {{status:"ready"|"blocked", reasons:string[], freshness:{inventoryDays:number|null, ga4Days:number|null}}}
 */
export function evaluateMeasurementGate({ ga4, inventory, nowIso, hasActiveExperiments = false }) {
  const reasons = [];
  const ga4Days = ga4?.generatedAt ? daysBetween(ga4.generatedAt, nowIso) : null;
  const inventoryDays = inventory?.generatedAt ? daysBetween(inventory.generatedAt, nowIso) : null;

  if (!inventory) reasons.push("inventory-snapshot-missing");
  else if (inventoryDays == null || inventoryDays > STALE_THRESHOLD_DAYS.inventory) {
    reasons.push(`inventory-snapshot-stale(${inventoryDays ?? "?"}d>${STALE_THRESHOLD_DAYS.inventory}d)`);
  }

  if (!ga4) reasons.push("ga4-snapshot-missing");
  else {
    // ── schema v2 ゲート (doc 42 §10.2)。旧 schema は鮮度に関係なく blocked ──
    if (ga4.schemaVersion !== GA4_SNAPSHOT_SCHEMA_VERSION) {
      reasons.push(`ga4-schema-unsupported(v${ga4.schemaVersion ?? 1})`);
    } else {
      if (ga4.measurementEpoch !== MEASUREMENT_EPOCH) {
        reasons.push(`ga4-epoch-mismatch(${ga4.measurementEpoch ?? "none"})`);
      }
      if (ga4.eventNames?.impression !== IMPRESSION_EVENT_NAME) {
        reasons.push(`ga4-impression-event-mismatch(${ga4.eventNames?.impression ?? "none"})`);
      }
      if (!((ga4.totals?.impressions ?? 0) > 0)) reasons.push("ga4-impressions-zero");
      if (!((ga4.quality?.recognizedVerticalImpressions ?? 0) > 0)) {
        reasons.push("ga4-recognized-vertical-zero");
      }
      const unsetRatio = ga4.quality?.unsetVerticalRatio;
      if (unsetRatio != null && unsetRatio > MAX_UNSET_VERTICAL_RATIO) {
        reasons.push(`ga4-unset-vertical-ratio-high(${unsetRatio.toFixed(3)}>${MAX_UNSET_VERTICAL_RATIO})`);
      }
    }
    if (ga4Days == null || ga4Days > STALE_THRESHOLD_DAYS.ga4) {
      reasons.push(`ga4-snapshot-stale(${ga4Days ?? "?"}d>${STALE_THRESHOLD_DAYS.ga4}d)`);
    }
    if (!ga4.hasVerticalBreakdown) reasons.push("ga4-vertical-dimension-missing");
    if (hasActiveExperiments && !ga4.hasVariantBreakdown) reasons.push("ga4-variant-dimension-missing");
  }

  return {
    status: reasons.length === 0 ? "ready" : "blocked",
    reasons,
    freshness: { inventoryDays, ga4Days },
  };
}

/** GA4 snapshot rows から (experimentId, variantId) 別の imp/click/CTR を集計する。 */
export function aggregateVariantMetrics(ga4Rows) {
  const map = new Map();
  for (const row of ga4Rows ?? []) {
    const exp = row.experiment_id;
    const variant = row.variant_id;
    if (!exp || exp === "(unset)" || !variant || variant === "(unset)") continue;
    const key = `${exp}|${variant}`;
    const cur = map.get(key) ?? { experimentId: exp, variantId: variant, impressions: 0, clicks: 0 };
    cur.impressions += row.impressions ?? 0;
    cur.clicks += row.clicks ?? 0;
    map.set(key, cur);
  }
  return [...map.values()].map((v) => ({
    ...v,
    ctr: v.impressions > 0 ? v.clicks / v.impressions : null,
  }));
}

/**
 * 実験判定 (仕様 §8)。状態は invalid / collecting / ready-to-decide / inconclusive / closed。
 * 勝者の自動反映はしない — ready-to-decide は人間への提示までが責務。
 *
 * @param {object} args
 * @param {Array<object>} args.registry .claude/state/ads/experiments.json の experiments[]
 * @param {Array<object>} args.ads AFFILIATE_ADS (experimentId 付きエントリを variant 定義として読む)
 * @param {Array<object>} args.variantMetrics aggregateVariantMetrics の出力
 * @param {string} args.nowIso 現在時刻 (ISO)
 * @param {{status?: string, reasons?: Array<string>} | null} [args.measurementGate] 計測可否ゲート
 * @returns {{active:Array, readyToDecide:Array, invalid:Array, inconclusive:Array, closed:Array}}
 */
export function evaluateExperiments({ registry, ads, variantMetrics, nowIso, measurementGate = null }) {
  const active = [];
  const readyToDecide = [];
  const invalid = [];
  const inconclusive = [];
  const closed = [];

  const ssotByExperiment = new Map();
  for (const ad of ads ?? []) {
    if (!ad.experimentId || ad.isActive === false) continue;
    const list = ssotByExperiment.get(ad.experimentId) ?? [];
    list.push(ad);
    ssotByExperiment.set(ad.experimentId, list);
  }

  const registryIds = new Set((registry ?? []).map((e) => e.experimentId));

  // SSOT に experimentId があるのに registry 未登録 → invalid (事前固定の停止条件が無い実験は回さない)
  for (const [experimentId] of ssotByExperiment) {
    if (!registryIds.has(experimentId)) {
      invalid.push({ experimentId, status: "invalid", reasons: ["registry-missing"] });
    }
  }

  for (const exp of registry ?? []) {
    const id = exp.experimentId;
    if (exp.status === "closed") {
      closed.push({ experimentId: id, status: "closed", winnerVariantId: exp.winnerVariantId ?? null });
      continue;
    }

    const reasons = [];
    // ★ kind: "code" (2026-08-04 新設) — variant の実体が広告エントリではなく**コード側の分岐**
    //   にある実験 (例 blog-inbody-format: 本文にテキストを出すかバナーを出すか)。
    //   配分は決定的ハッシュで行い weight を持たないため、SSOT (affiliate-ads-data.ts) の
    //   variant 検査は**構造的に通らない**。registry の variantIds を正として扱う。
    //   計測 (GA4 の experiment_id / variant_id) と期間・sample の検査は creative と同じ。
    const isCode = exp.kind === "code";
    let variantIds;
    if (isCode) {
      variantIds = exp.variantIds ?? [];
      if (variantIds.length < 2) reasons.push(`registry-variants-insufficient(${variantIds.length})`);
      if (new Set(variantIds).size !== variantIds.length) reasons.push("variant-id-duplicate");
    } else {
      const variants = ssotByExperiment.get(id) ?? [];
      if (variants.length < 2) reasons.push(`ssot-variants-insufficient(${variants.length})`);
      variantIds = variants.map((v) => v.variantId ?? "(none)");
      if (new Set(variantIds).size !== variantIds.length) reasons.push("variant-id-duplicate");
      if (variantIds.includes("(none)")) reasons.push("variant-id-missing");
      for (const v of variants) {
        if (v.weight != null && !(Number(v.weight) > 0)) reasons.push(`weight-invalid(${v.variantId})`);
        if (exp.targetLocation && v.locationCode !== exp.targetLocation) {
          reasons.push(`target-location-mismatch(${v.variantId}:${v.locationCode})`);
        }
      }
      if (exp.variantIds) {
        const declared = new Set(exp.variantIds);
        const actual = new Set(variantIds);
        if (declared.size !== actual.size || [...declared].some((v) => !actual.has(v))) {
          reasons.push("registry-ssot-variant-mismatch");
        }
      }
    }
    if (!exp.startedAt || daysBetween(exp.startedAt, nowIso) == null) reasons.push("started-at-invalid");
    if (!(Number(exp.minSamplePerVariant) > 0)) reasons.push("min-sample-missing");
    if (!(Number(exp.minDurationDays) > 0)) reasons.push("min-duration-missing");

    if (reasons.length > 0) {
      invalid.push({ experimentId: id, status: "invalid", reasons });
      continue;
    }

    const daysElapsed = daysBetween(exp.startedAt, nowIso);
    const metrics = (variantMetrics ?? []).filter((m) => m.experimentId === id);
    const metricsByVariant = new Map(metrics.map((m) => [m.variantId, m]));
    const perVariant = variantIds.map((vid) => ({
      variantId: vid,
      impressions: metricsByVariant.get(vid)?.impressions ?? 0,
      clicks: metricsByVariant.get(vid)?.clicks ?? 0,
      ctr: metricsByVariant.get(vid)?.ctr ?? null,
    }));
    const sampleReached = perVariant.every((v) => v.impressions >= Number(exp.minSamplePerVariant));
    const minDurationReached = daysElapsed >= Number(exp.minDurationDays);
    const maxDurationReached =
      Number(exp.maxDurationDays) > 0 && daysElapsed >= Number(exp.maxDurationDays);
    const decisionGuards = [];
    if (!sampleReached) decisionGuards.push("insufficient-sample");
    if (!minDurationReached) decisionGuards.push("insufficient-duration");
    if (measurementGate?.status === "blocked") decisionGuards.push("measurement-gate-blocked");
    if ((exp.confounds ?? []).length > 0) decisionGuards.push("confounded");

    const summary = {
      experimentId: id,
      kind: exp.kind ?? "creative",
      targetLocation: exp.targetLocation ?? null,
      startedAt: exp.startedAt,
      daysElapsed,
      minSamplePerVariant: Number(exp.minSamplePerVariant),
      minDurationDays: Number(exp.minDurationDays),
      maxDurationDays: Number(exp.maxDurationDays) > 0 ? Number(exp.maxDurationDays) : null,
      sampleReached,
      minDurationReached,
      primaryMetric: exp.primaryMetric ?? "ctr",
      decisionRule: exp.decisionRule ?? null,
      decisionGuards,
      variants: perVariant,
    };

    if (decisionGuards.length === 0) {
      readyToDecide.push({ ...summary, status: "ready-to-decide" });
    } else if (maxDurationReached) {
      inconclusive.push({ ...summary, status: "inconclusive" });
    } else {
      active.push({ ...summary, status: "collecting" });
    }
  }

  return { active, readyToDecide, invalid, inconclusive, closed };
}

/**
 * 広告配信 snapshot の publish gate (doc 42 §10.3)。
 * compliance の missingDisclosure / orphaned が 1 件以上なら blocked。
 * 消費側: append-affiliate-ads の gate、affiliate-manager の publish 段取り判断。
 */
export function evaluatePublishGate({ compliance }) {
  const reasons = [];
  if (!compliance) reasons.push("compliance-snapshot-missing");
  else {
    const missing = compliance.directPlacements?.missingDisclosure ?? [];
    const orphaned = compliance.directPlacements?.orphaned ?? [];
    for (const m of missing) reasons.push(`missing-disclosure:${m.id}`);
    for (const o of orphaned) reasons.push(`orphaned-placement:${o.id ?? o}`);
  }
  return { status: reasons.length === 0 ? "ready" : "blocked", reasons };
}

/**
 * recommendedActions を決定的な条件から生成する (優先度順)。モデルに routing させない。
 */
export function buildRecommendedActions({ measurementGate, coverage, directPlacements, experiments }) {
  const actions = [];
  if (measurementGate.status === "blocked") {
    actions.push({
      id: "fix-measurement-gate",
      reason: measurementGate.reasons.join(", "),
      command: "gh workflow run affiliate-ga4-weekly.yml / GA4 custom dimension 登録 (rules §6)",
    });
  }
  if ((directPlacements?.orphaned ?? []).length > 0 || (directPlacements?.missingDisclosure ?? []).length > 0) {
    actions.push({
      id: "fix-direct-placements",
      reason: `orphaned=${directPlacements.orphaned.length} missingDisclosure=${directPlacements.missingDisclosure.length}`,
      command: "/audit-affiliate-compliance",
    });
  }
  if ((experiments?.invalid ?? []).length > 0) {
    actions.push({
      id: "fix-experiment-config",
      reason: experiments.invalid.map((e) => e.experimentId).join(", "),
      command: "/manage-affiliate-experiment plan",
    });
  }
  if ((experiments?.readyToDecide ?? []).length > 0) {
    actions.push({
      id: "decide-experiment",
      reason: experiments.readyToDecide.map((e) => e.experimentId).join(", "),
      command: "/manage-affiliate-experiment decide",
    });
  }
  if ((coverage?.gapVerticals ?? []).length > 0) {
    actions.push({
      id: "propose-partnership",
      reason: `在庫ゼロ vertical: ${coverage.gapVerticals.join(", ")}`,
      command: "/register-affiliate-banner propose",
    });
  }
  return actions;
}

/**
 * 集約状態 (仕様 §6.2) を組み立てる。
 */
export function buildOperationsState({
  nowIso,
  inventory,
  inventoryPath,
  ga4,
  ga4Path,
  compliance,
  experiments,
  measurementGate,
  publishGate = null,
}) {
  const coverage = {
    gapVerticals: inventory?.coverage?.gapVerticals ?? [],
    thinVerticals: inventory?.coverage?.thinVerticals ?? [],
  };
  const directPlacements = {
    total: compliance?.directPlacements?.total ?? 0,
    orphaned: compliance?.directPlacements?.orphaned ?? [],
    missingDisclosure: compliance?.directPlacements?.missingDisclosure ?? [],
  };
  const experimentsOut = {
    active: experiments?.active ?? [],
    readyToDecide: experiments?.readyToDecide ?? [],
    invalid: experiments?.invalid ?? [],
    inconclusive: experiments?.inconclusive ?? [],
    closed: experiments?.closed ?? [],
  };
  const resolvedPublishGate = publishGate ?? evaluatePublishGate({ compliance });
  return {
    schemaVersion: OPERATIONS_SCHEMA_VERSION,
    generatedAt: nowIso,
    inventorySnapshot: inventoryPath ?? null,
    ga4Snapshot: ga4Path ?? null,
    freshness: {
      inventoryDays: measurementGate.freshness.inventoryDays,
      ga4Days: measurementGate.freshness.ga4Days,
    },
    measurementGate: { status: measurementGate.status, reasons: measurementGate.reasons },
    publishGate: resolvedPublishGate,
    coverage,
    directPlacements,
    experiments: experimentsOut,
    recommendedActions: buildRecommendedActions({
      measurementGate,
      coverage,
      directPlacements,
      experiments: experimentsOut,
    }),
    ga4Totals: ga4?.totals ?? null,
  };
}

/**
 * 集約状態の schema 検証 (workflow / --check ゲート用)。error 配列 (空 = OK) を返す。
 */
export function validateOperationsState(state) {
  const errors = [];
  const push = (m) => errors.push(m);
  if (!state || typeof state !== "object") return ["state が object でない"];
  if (state.schemaVersion !== OPERATIONS_SCHEMA_VERSION) push(`schemaVersion != ${OPERATIONS_SCHEMA_VERSION}`);
  if (typeof state.generatedAt !== "string" || Number.isNaN(Date.parse(state.generatedAt))) {
    push("generatedAt が ISO 文字列でない");
  }
  if (!state.measurementGate || !["ready", "blocked"].includes(state.measurementGate.status)) {
    push("measurementGate.status が ready|blocked でない");
  }
  if (!Array.isArray(state.measurementGate?.reasons)) push("measurementGate.reasons が配列でない");
  if (state.measurementGate?.status === "blocked" && state.measurementGate.reasons.length === 0) {
    push("blocked なのに reasons が空 (失敗を隠さない)");
  }
  if (!state.publishGate || !["ready", "blocked"].includes(state.publishGate.status)) {
    push("publishGate.status が ready|blocked でない");
  }
  if (state.publishGate?.status === "blocked" && (state.publishGate.reasons ?? []).length === 0) {
    push("publishGate blocked なのに reasons が空");
  }
  if (!state.freshness || !("inventoryDays" in state.freshness) || !("ga4Days" in state.freshness)) {
    push("freshness.{inventoryDays,ga4Days} が無い");
  }
  for (const key of ["gapVerticals", "thinVerticals"]) {
    if (!Array.isArray(state.coverage?.[key])) push(`coverage.${key} が配列でない`);
  }
  if (!Number.isInteger(state.directPlacements?.total)) push("directPlacements.total が整数でない");
  for (const key of ["orphaned", "missingDisclosure"]) {
    if (!Array.isArray(state.directPlacements?.[key])) push(`directPlacements.${key} が配列でない`);
  }
  for (const key of ["active", "readyToDecide", "invalid"]) {
    if (!Array.isArray(state.experiments?.[key])) push(`experiments.${key} が配列でない`);
  }
  if (!Array.isArray(state.recommendedActions)) push("recommendedActions が配列でない");
  return errors;
}
