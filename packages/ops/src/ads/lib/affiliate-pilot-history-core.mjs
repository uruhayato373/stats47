const DAY_MS = 86_400_000;

function dateOnly(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? value.slice(0, 10)
    : null;
}

function addDays(date, days) {
  const parsed = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed + days * DAY_MS).toISOString().slice(0, 10);
}

export function parseAffiliateExperimentHistory(csv) {
  const lines = String(csv ?? '')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (lines.length === 0) return [];
  const expected = 'date,days,experiment_id,variant_id,impressions,clicks,ctr';
  if (lines[0] !== expected)
    throw new Error('affiliate-experiment-history-header-invalid');
  return lines.slice(1).map((line, index) => {
    const [date, days, experimentId, variantId, impressions, clicks] =
      line.split(',');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !experimentId || !variantId) {
      throw new Error(`affiliate-experiment-history-row-invalid:${index + 2}`);
    }
    const numeric = [days, impressions, clicks].map(Number);
    if (numeric.some((value) => !Number.isFinite(value) || value < 0)) {
      throw new Error(
        `affiliate-experiment-history-number-invalid:${index + 2}`
      );
    }
    return {
      periodEnd: date,
      days: numeric[0],
      periodStart: addDays(date, -(numeric[0] - 1)),
      experimentId,
      variantId,
      impressions: numeric[1],
      clicks: numeric[2],
    };
  });
}

export function aggregatePilotExperimentMetrics({
  rows,
  experimentId,
  startedAt,
  exposureEndedAt = null,
}) {
  const start = dateOnly(startedAt);
  const end = dateOnly(exposureEndedAt);
  if (!experimentId || !start) return [];
  const totals = new Map();
  for (const row of rows ?? []) {
    if (row.experimentId !== experimentId) continue;
    if (row.periodEnd < start || (end && row.periodStart > end)) continue;
    const current = totals.get(row.variantId) ?? {
      variantId: row.variantId,
      impressions: 0,
      clicks: 0,
    };
    current.impressions += row.impressions;
    current.clicks += row.clicks;
    totals.set(row.variantId, current);
  }
  return [...totals.values()].sort((left, right) =>
    left.variantId.localeCompare(right.variantId)
  );
}

export function buildAffiliatePilotObservation({
  plan,
  experimentMetrics,
  outcomeSources,
  nowIso,
}) {
  if (!plan || !Array.isArray(plan.variantIds)) return null;
  const startedAt = dateOnly(plan.startedAt);
  const exposureEndedAt = dateOnly(plan.exposureEndedAt);
  const maturityDate =
    exposureEndedAt == null
      ? null
      : addDays(exposureEndedAt, Number(plan.outcomeMaturityDays) || 0);
  const now = dateOnly(nowIso);
  const metricByVariant = new Map(
    (experimentMetrics ?? []).map((metric) => [metric.variantId, metric])
  );

  const variants = plan.variantIds.map((variantId) => {
    const programRef = plan.variantProgramRefs?.[variantId] ?? null;
    const source = (outcomeSources ?? []).find((candidate) =>
      programRef?.startsWith(candidate.programRefPrefix)
    );
    const exactCoverage = Boolean(
      source?.status === 'ready' &&
      source?.periodFrom === startedAt &&
      maturityDate &&
      source?.periodTo >= maturityDate &&
      now &&
      now >= maturityDate
    );
    const metric = metricByVariant.get(variantId);
    return {
      variantId,
      programRef,
      impressions: metric?.impressions ?? 0,
      clicks: metric?.clicks ?? 0,
      confirmedRevenueYen: source?.revenueByProgramRef?.[programRef] ?? null,
      outcomesMature: exactCoverage,
    };
  });

  return {
    startedAt,
    exposureEndedAt,
    maturityDate,
    confounds: [...(plan.confounds ?? [])],
    variants,
  };
}
