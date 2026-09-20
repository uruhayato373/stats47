export const MOSHIMO_RESULTS_SCHEMA_VERSION = 1;

function integer(value) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/[,\s]/g, '');
  const match = normalized.match(/-?\d+/);
  return match ? Number(match[0]) : 0;
}

export function parseCountAndYen(value) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/,/g, '');
  const count = normalized.match(/(-?\d+)\s*件/);
  const yen = normalized.match(/(-?\d+)\s*円/);
  return { count: count ? Number(count[1]) : 0, yen: yen ? Number(yen[1]) : 0 };
}

export function parseMoshimoPromotionRows(rows) {
  return rows.flatMap((row) => {
    const programId = String(row?.programId ?? '');
    const cells = Array.isArray(row?.cells) ? row.cells : [];
    if (!/^\d+$/.test(programId) || cells.length < 9) return [];
    const clicks = parseCountAndYen(cells[3]);
    const conversions = parseCountAndYen(cells[4]);
    const approved = parseCountAndYen(cells[5]);
    return [
      {
        programId,
        programRef: `moshimo:${programId}`,
        programName: String(row.programName ?? '').trim(),
        impressions: integer(cells[2]),
        clicks: clicks.count,
        clickRevenueYen: clicks.yen,
        conversions: conversions.count,
        grossRevenueYen: conversions.yen,
        approved: approved.count,
        revenueYen: approved.yen,
      },
    ];
  });
}

export function completeMoshimoRecords(observedRecords, approvedPrograms) {
  const observed = new Map(
    observedRecords.map((record) => [record.programId, record])
  );
  return approvedPrograms
    .map(
      (program) =>
        observed.get(String(program.programId)) ?? {
          programId: String(program.programId),
          programRef: `moshimo:${program.programId}`,
          programName: String(program.programName ?? ''),
          impressions: 0,
          clicks: 0,
          clickRevenueYen: 0,
          conversions: 0,
          grossRevenueYen: 0,
          approved: 0,
          revenueYen: 0,
          observedInReport: false,
        }
    )
    .map((record) => ({
      ...record,
      observedInReport: observed.has(record.programId),
    }))
    .sort((left, right) => Number(left.programId) - Number(right.programId));
}

export function evaluateMoshimoOutcomeGate(state, nowIso, maxAgeDays = 10) {
  if (!state)
    return {
      status: 'blocked',
      ageDays: null,
      reasons: ['moshimo-results-missing'],
    };
  if (state.schemaVersion !== MOSHIMO_RESULTS_SCHEMA_VERSION) {
    return {
      status: 'blocked',
      ageDays: null,
      reasons: [
        `moshimo-results-schema-unsupported(v${state.schemaVersion ?? 'missing'})`,
      ],
    };
  }
  if (state?.source?.site !== 'stats47' || state?.source?.siteId !== '638943') {
    return {
      status: 'blocked',
      ageDays: null,
      reasons: ['moshimo-site-scope-invalid'],
    };
  }
  if (state?.coverage?.complete !== true) {
    return {
      status: 'blocked',
      ageDays: null,
      reasons: ['moshimo-report-coverage-incomplete'],
    };
  }
  if (!Array.isArray(state.records))
    return {
      status: 'blocked',
      ageDays: null,
      reasons: ['moshimo-records-invalid'],
    };
  const updated = Date.parse(state.updatedAt ?? '');
  const now = Date.parse(nowIso ?? '');
  if (!Number.isFinite(updated) || !Number.isFinite(now)) {
    return {
      status: 'blocked',
      ageDays: null,
      reasons: ['moshimo-results-timestamp-invalid'],
    };
  }
  const ageDays = Math.max(0, Math.floor((now - updated) / 86400000));
  const reasons =
    ageDays > maxAgeDays
      ? [`moshimo-results-stale(${ageDays}d>${maxAgeDays}d)`]
      : [];
  return {
    status: reasons.length === 0 ? 'ready' : 'blocked',
    ageDays,
    reasons,
  };
}
