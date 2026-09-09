import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { extractYearCode } = require('../../../packages/estat-api/src/stats-data/utils/extract-year-code.ts');
export const PREFECTURES = Array.from({ length: 47 }, (_, index) => String(index + 1).padStart(2, '0') + '000');
const PREFECTURE_SET = new Set(PREFECTURES);

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
      if (!/^[a-z]+(?:-[a-z]+)*$/.test(d.targetThemeKey ?? '') || existingThemes[d.targetThemeKey] || newKeys.has(d.targetThemeKey)) errors.push(`${theme.id}: invalid new theme key`);
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
