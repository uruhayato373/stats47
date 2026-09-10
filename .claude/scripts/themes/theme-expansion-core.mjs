import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { extractYearCode } = require('../../../packages/estat-api/src/stats-data/utils/extract-year-code.ts');
export const PREFECTURES = Array.from({ length: 47 }, (_, index) => String(index + 1).padStart(2, '0') + '000');
const PREFECTURE_SET = new Set(PREFECTURES);

/** A declared non-applicable prefecture is null, not a zero or an omitted source row. */
export function inspectLocalMetricCoverage(rows, declaration) {
  const errors = [];
  const codes = declaration?.codes ?? [];
  if (!Array.isArray(codes) || new Set(codes).size !== codes.length || codes.some((code) => !PREFECTURE_SET.has(code))
    || (codes.length && (typeof declaration?.reason !== 'string' || !declaration.reason.trim())) || codes.length === 47) {
    return { errors: ['Invalid non-applicable prefecture declaration'], numericCodes: [] };
  }
  const excluded = new Set(codes);
  const byYear = new Map();
  for (const row of rows) {
    if (!PREFECTURE_SET.has(row.areaCode)) errors.push(`Invalid area: ${row.areaCode}`);
    if (!byYear.has(row.yearCode)) byYear.set(row.yearCode, new Set());
    const cohort = byYear.get(row.yearCode);
    if (cohort.has(row.areaCode)) errors.push(`Duplicate area-year: ${row.areaCode}/${row.yearCode}`);
    cohort.add(row.areaCode);
    if (excluded.has(row.areaCode) ? row.value !== null : !Number.isFinite(row.value)) errors.push(`Unexpected missing/value: ${row.areaCode}/${row.yearCode}`);
  }
  if (!byYear.size || [...byYear.values()].some((cohort) => cohort.size !== 47)) errors.push('Every source year must contain all 47 prefectures including explicit non-applicable rows');
  return { errors, numericCodes: PREFECTURES.filter((code) => !excluded.has(code)) };
}

export function explicitIndicatorCodes(theme) {
  return [...new Set(theme.indicators.flatMap((text) => text.match(/\b[A-L]\d{4,}\b/g) ?? []))].sort();
}

// Missing symbols and blank strings are observations of missingness, never zero.
export function numericValue(value) {
  const text = String(value ?? '').trim();
  return /^-?\d+(?:\.\d+)?$/.test(text) && Number.isFinite(Number(text)) ? Number(text) : null;
}

export function summarizeSeries(rows) {
  const prefectureRows = rows.filter((row) => PREFECTURE_SET.has(row['@area']));
  const byYear = new Map();
  const duplicateKeys = new Set();
  const seen = new Set();
  for (const row of prefectureRows) {
    const year = extractYearCode(row['@time']);
    if (!/^\d{4}$/.test(year)) throw new Error('Invalid source time code');
    const key = `${year}:${row['@area']}`;
    if (seen.has(key)) duplicateKeys.add(key);
    seen.add(key);
    const yearRows = byYear.get(year) ?? [];
    yearRows.push(row);
    byYear.set(year, yearRows);
  }
  const years = [...byYear.keys()].sort();
  const coverage = years.map((year) => {
    const values = byYear.get(year);
    const numeric = values.filter((row) => numericValue(row.$) !== null);
    const symbols = {};
    for (const row of values.filter((item) => numericValue(item.$) === null)) {
      const symbol = String(row.$ ?? '');
      symbols[symbol] = (symbols[symbol] ?? 0) + 1;
    }
    return {
      year,
      rows: values.length,
      prefectures: new Set(values.map((row) => row['@area'])).size,
      numericPrefectures: new Set(numeric.map((row) => row['@area'])).size,
      missingPrefectures: PREFECTURES.filter((code) => !numeric.some((row) => row['@area'] === code)),
      missingSymbols: symbols,
      units: [...new Set(values.map((row) => row['@unit'] ?? ''))],
    };
  });
  return {
    sourceRows: rows.length,
    prefectureRows: prefectureRows.length,
    excludedOtherGeographies: rows.length - prefectureRows.length,
    years,
    latest: coverage.at(-1) ?? null,
    completeYears: coverage.filter((row) => row.numericPrefectures === 47 && row.rows === 47).map((row) => row.year),
    duplicateAreaYears: [...duplicateKeys],
    coverage,
  };
}

/** Compare the displayed cohort with its verified source; absence never means zero. */
export function validateStagedComparison(rows, raw, unit) {
  if (rows.length !== 47 || raw.length !== 47 || [rows.map((row) => row.areaCode), raw.map((row) => row['@area'])].some((codes) => new Set(codes).size !== 47 || !PREFECTURES.every((code) => codes.includes(code)))) return ['Expected exactly 47 distinct prefectures in both cohorts'];
  return rows.flatMap((row) => {
    const original = raw.find((entry) => entry['@area'] === row.areaCode);
    const rank = 1 + rows.filter((entry) => Number.isFinite(entry.value) && entry.value > row.value).length;
    return !Number.isFinite(row.value) || row.value !== numericValue(original.$) || row.unit !== unit || row.rank !== rank
      ? [`Source/value/unit/rank mismatch: ${row.areaCode}`] : [];
  });
}

export function validateDecisions(catalog, existingThemes) {
  const errors = [];
  const ids = new Set(catalog.themes.map((theme) => theme.id));
  if (catalog.themes.length !== 128 || ids.size !== 128) errors.push('Expected 128 distinct candidates');
  for (let id = 1; id <= 128; id++) if (!ids.has(id)) errors.push(`Missing candidate ${id}`);
  const newKeys = new Set();
  for (const theme of catalog.themes) {
    const d = theme.decision;
    if (!d || !['new-theme', 'existing-section', 'merge-candidate', 'hold'].includes(d.disposition)) {
      errors.push(`${theme.id}: missing decision`); continue;
    }
    if (!d.rationale || !d.scope || !d.owner || !d.evidenceRefs?.length) errors.push(`${theme.id}: incomplete decision`);
    if (d.disposition === 'existing-section' && !existingThemes[d.targetThemeKey]) errors.push(`${theme.id}: unknown existing theme`);
    if (d.disposition === 'new-theme') {
      const registered = Boolean(existingThemes[d.targetThemeKey]);
      const mapped = d.implementedThemeKey === d.targetThemeKey;
      if (!/^[a-z]+(?:-[a-z]+)*$/.test(d.targetThemeKey ?? '') || registered !== mapped || newKeys.has(d.targetThemeKey)) errors.push(`${theme.id}: invalid new theme key or implementation mapping`);
      newKeys.add(d.targetThemeKey);
    }
    if (d.disposition === 'merge-candidate') {
      const target = catalog.themes.find((candidate) => candidate.id === d.targetCandidateId);
      if (!target || target.id === theme.id || !['new-theme', 'existing-section'].includes(target.decision?.disposition)) errors.push(`${theme.id}: merge must resolve directly to an adopted destination`);
    }
    if (d.disposition === 'hold' && (!d.resumeWhen || !d.blockers?.length)) errors.push(`${theme.id}: hold needs a blocker and resumption condition`);
  }
  return errors;
}

/** Observe actual destinations; registered metrics alone do not establish a rendered chapter. */
export function inspectExpansionWiring(plan, catalogs, extensions = {}) {
  const rows = plan.themes.map((candidate) => {
    const decision = candidate.decision;
    const catalog = catalogs[decision.targetThemeKey];
    const extension = extensions[decision.targetThemeKey]?.find((entry) => entry.candidateId === candidate.id);
    const chapterKey = extension?.existingSectionKey ?? `candidate-${candidate.id}`;
    const chapter = catalog?.sections?.find((section) => section.key === chapterKey);
    const groups = new Map((catalog?.metricGroups ?? []).map((group) => [group.key, group]));
    const chapterMetrics = (chapter?.metricGroupKeys ?? []).flatMap((key) => groups.get(key)?.rankingKeys ?? []);
    const embedded = Boolean(extension?.existingSectionKey && chapter?.embeddedSectionKeys?.length
      && extension.metrics.every(([key]) => catalog.metrics.some((metric) => metric.rankingKey === key)));
    const placed = embedded || chapterMetrics.length > 0
      && chapter.metricGroupKeys.every((key) => groups.get(key)?.rankingKeys.length)
      && chapterMetrics.every((key) => catalog.metrics.some((metric) => metric.rankingKey === key));
    const status = decision.disposition === 'new-theme'
      ? catalog ? 'catalog-wired-data-validation-pending' : 'catalog-missing'
      : decision.disposition === 'existing-section'
        ? placed ? 'catalog-section-wired-data-validation-pending' : 'section-not-wired'
        : decision.disposition === 'hold' ? 'hold' : 'merge-target-pending';
    return {
      candidateId: candidate.id, disposition: decision.disposition, themeKey: catalog?.key ?? null,
      sectionKey: placed ? chapterKey : null, status,
      metricKeys: decision.disposition === 'new-theme' ? catalog?.metrics.map((metric) => metric.rankingKey) ?? [] : embedded ? extension.metrics.map(([key]) => key) : chapterMetrics,
    };
  });
  for (const row of rows.filter((entry) => entry.disposition === 'merge-candidate')) {
    const candidate = plan.themes.find((entry) => entry.id === row.candidateId);
    const target = rows.find((entry) => entry.candidateId === candidate.decision.targetCandidateId);
    row.targetCandidateId = candidate.decision.targetCandidateId;
    if (target?.themeKey && ['catalog-wired-data-validation-pending', 'catalog-section-wired-data-validation-pending'].includes(target.status)) {
      row.themeKey = target.themeKey;
      row.sectionKey = target.sectionKey;
      row.status = 'merged-into-target-data-validation-pending';
    }
  }
  const count = (status) => rows.filter((row) => row.status === status).length;
  return {
    candidates: rows,
    counts: {
      newThemeCatalogWired: count('catalog-wired-data-validation-pending'),
      existingSectionWired: count('catalog-section-wired-data-validation-pending'),
      existingSectionPending: count('section-not-wired'),
      mergeLinked: count('merged-into-target-data-validation-pending'),
      mergePending: count('merge-target-pending'),
      hold: count('hold'),
      dataValidationPending: rows.filter((row) => ['new-theme', 'existing-section'].includes(row.disposition)).length,
    },
  };
}

// Verify the handoff, not just that a decision field exists on every row.
export function validateImplementationPlan(catalog, report, registry) {
  const errors = [];
  const adopted = catalog.themes.filter((row) => ['new-theme', 'existing-section'].includes(row.decision?.disposition)).map((row) => row.id).sort((a, b) => a - b);
  const scheduled = (catalog.implementationWaves ?? []).flatMap((wave) => wave.candidateIds ?? []).sort((a, b) => a - b);
  if (JSON.stringify(adopted) !== JSON.stringify(scheduled)) errors.push('Waves must cover each adopted candidate exactly once');
  for (const wave of catalog.implementationWaves ?? []) {
    if (!wave.owner || !wave.steps?.length || !wave.acceptance?.length || !wave.candidateIds?.length) errors.push('Incomplete implementation wave');
  }
  if (!catalog.firstBatch?.length) errors.push('Missing first batch');
  const batchIds = new Set();
  for (const item of catalog.firstBatch ?? []) {
    const candidate = catalog.themes.find((row) => row.id === item.candidateId);
    if (candidate?.decision?.disposition !== 'new-theme' || batchIds.has(item.candidateId)) errors.push('Invalid or duplicate first batch candidate');
    batchIds.add(item.candidateId);
    if (!item.metrics?.length || !item.steps?.length || !item.acceptance?.length || !item.comparisonPolicy || !item.excludedMetrics?.length) errors.push(`${item.candidateId}: incomplete first batch`);
    const codes = new Set();
    for (const metric of item.metrics ?? []) {
      const evidence = report.series.find((series) => series.code === metric.indicatorCode);
      if (codes.has(metric.indicatorCode) || !explicitIndicatorCodes(candidate ?? { indicators: [] }).includes(metric.indicatorCode)) errors.push(`${item.candidateId}: duplicate or unrelated comparison metric`);
      codes.add(metric.indicatorCode);
      const year = evidence?.coverage?.find((row) => row.year === metric.comparisonYear);
      if (!evidence || evidence.status !== 'verified' || !evidence.completeYears?.includes(metric.comparisonYear) || evidence.duplicateAreaYears?.length || year?.numericPrefectures !== 47 || year?.rows !== 47) errors.push(`${item.candidateId}: unverified comparison metric ${metric.indicatorCode}`);
      if (!metric.population || !metric.unit || !metric.geography || !metric.visualization || !metric.role || !metric.definitionSource || !metric.timeSeriesPolicy || !metric.owner) errors.push(`${item.candidateId}: missing comparison conditions`);
      if (metric.metricKey) {
        const definition = registry[metric.metricKey];
        const exact = definition?.source?.statsDataId === evidence?.statsDataId && definition?.source?.cdCat01 === metric.indicatorCode;
        const reused = report.registryComparisons?.some((row) => row.metricKey === metric.metricKey && row.indicatorCode === metric.indicatorCode && row.year === metric.comparisonYear && row.matchedPrefectures === 47 && row.mismatches.length === 0 && row.statsDataId === definition?.source?.statsDataId && row.cdCat01 === definition?.source?.cdCat01);
        if (!definition?.isActive || (!exact && !reused)) errors.push(`${item.candidateId}: metric key does not match verified source`);
      } else if (!metric.proposedMetricKey || registry[metric.proposedMetricKey]) errors.push(`${item.candidateId}: missing or colliding proposed metric key`);
    }
  }
  return errors;
}
