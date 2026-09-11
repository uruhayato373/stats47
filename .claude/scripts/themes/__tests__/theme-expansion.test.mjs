import assert from 'node:assert/strict';
import test from 'node:test';
import { PREFECTURES, numericValue, summarizeSeries, validateDecisions, validateImplementationPlan, validateStagedComparison, inspectExpansionWiring, inspectLocalMetricCoverage } from '../theme-expansion-core.mjs';

const rows = () => PREFECTURES.map((area) => ({ '@area': area, '@time': '2023000000', '@unit': '人', $: '0' }));

test('official non-applicability stays null while a surveyed zero stays numeric', () => {
  const excluded = ['09000', '10000', '11000', '19000', '20000', '25000', '29000'];
  const source = PREFECTURES.map((areaCode) => ({ areaCode, yearCode: '2023', value: excluded.includes(areaCode) ? null : 0 }));
  const declaration = { codes: excluded, reason: 'Official survey marks these prefectures outside its scope' };
  const result = inspectLocalMetricCoverage(source, declaration);
  assert.deepEqual(result.errors, []);
  assert.equal(result.numericCodes.length, 40);
  assert.ok(result.numericCodes.includes('21000'));
  assert.ok(inspectLocalMetricCoverage(source).errors.length);
  assert.ok(inspectLocalMetricCoverage(source.filter((row) => row.areaCode !== '09000'), declaration).errors.length);
  assert.ok(inspectLocalMetricCoverage(source.map((row) => ({ ...row, value: 0 })), declaration).errors.length);
  assert.ok(inspectLocalMetricCoverage(source.map((row) => row.areaCode === '21000' ? { ...row, value: null } : row), declaration).errors.length);
});

test('release cohort preserves real zeros and ties, rejects wrong units, ranks, source suppression and geography', () => {
  const raw = rows();
  const staged = PREFECTURES.map((areaCode) => ({ areaCode, value: 0, unit: '人', rank: 1 }));
  assert.deepEqual(validateStagedComparison(staged, raw, '人'), []);
  for (const replacement of [{ unit: '千人' }, { rank: 2 }, { value: null }, { areaCode: '00000' }]) {
    assert.ok(validateStagedComparison([{ ...staged[0], ...replacement }, ...staged.slice(1)], raw, '人').length);
  }
  raw[0].$ = '-';
  assert.ok(validateStagedComparison(staged, raw, '人').length);
  assert.ok(validateStagedComparison(staged, [...raw.slice(1), raw[1]], '人').length);
});

test('missing and suppressed values never become zero', () => {
  for (const value of [null, undefined, '', ' ', '-', 'X', '…', 'NaN', 'Infinity']) assert.equal(numericValue(value), null);
  assert.equal(numericValue('0'), 0);
  assert.equal(numericValue('-1.5'), -1.5);
  const input = rows(); input[0].$ = '-';
  const result = summarizeSeries(input);
  assert.equal(result.latest.numericPrefectures, 46);
  assert.deepEqual(result.latest.missingPrefectures, ['01000']);
  assert.deepEqual(result.completeYears, []);
});

test('national and city records cannot fill missing prefectures', () => {
  const input = rows().slice(1);
  input.push({ '@area': '00000', '@time': '2023000000', $: '100' }, { '@area': '01100', '@time': '2023000000', $: '100' });
  const result = summarizeSeries(input);
  assert.equal(result.excludedOtherGeographies, 2);
  assert.equal(result.latest.numericPrefectures, 46);
});

test('duplicate axes or subannual values are not a complete annual series', () => {
  const input = rows(); input.push({ ...input[0], '@time': '2023100000' });
  const result = summarizeSeries(input);
  assert.deepEqual(result.duplicateAreaYears, ['2023:01000']);
  assert.deepEqual(result.completeYears, []);
  assert.throws(() => summarizeSeries([{ ...input[0], '@time': 'unknown' }]), /Invalid source time/);
});

function catalogFixture() {
  return { themes: Array.from({ length: 128 }, (_, index) => ({
    id: index + 1, indicators: ['指標 C3304'],
    decision: { disposition: 'hold', scope: 'scope', rationale: 'reason', owner: 'owner', evidenceRefs: ['source'], blockers: ['missing'], resumeWhen: 'verified' },
  })) };
}

test('all 128 candidates need valid adoption destinations or explicit holds', () => {
  const catalog = catalogFixture();
  assert.deepEqual(validateDecisions(catalog, {}), []);
  delete catalog.themes[0].decision.resumeWhen;
  assert.match(validateDecisions(catalog, {}).join(), /resumption/);
  catalog.themes[0].id = 2;
  assert.match(validateDecisions(catalog, {}).join(), /128 distinct/);
});

test('merge chains and cycles cannot hide undecided destinations', () => {
  const catalog = catalogFixture();
  Object.assign(catalog.themes[0].decision, { disposition: 'merge-candidate', targetCandidateId: 2 });
  Object.assign(catalog.themes[1].decision, { disposition: 'merge-candidate', targetCandidateId: 1 });
  assert.equal(validateDecisions(catalog, {}).filter((error) => error.includes('directly')).length, 2);
  Object.assign(catalog.themes[1].decision, { disposition: 'existing-section', targetThemeKey: 'missing' });
  assert.match(validateDecisions(catalog, {}).join(), /unknown existing theme/);
});

test('a planned new theme can become registered only through its explicit destination mapping', () => {
  const catalog = catalogFixture();
  const decision = catalog.themes[0].decision;
  Object.assign(decision, { disposition: 'new-theme', targetThemeKey: 'construction' });
  assert.deepEqual(validateDecisions(catalog, {}), []);
  assert.ok(validateDecisions(catalog, { construction: {} }).length);
  decision.implementedThemeKey = 'construction';
  assert.deepEqual(validateDecisions(catalog, { construction: {} }), []);
  assert.ok(validateDecisions(catalog, {}).length, 'a removed implementation cannot stay marked as mapped');
  decision.implementedThemeKey = 'other-theme';
  assert.ok(validateDecisions(catalog, { construction: {} }).length);
});

function planFixture() {
  const catalog = catalogFixture();
  Object.assign(catalog.themes[0].decision, { disposition: 'new-theme', targetThemeKey: 'construction' });
  catalog.implementationWaves = [{ candidateIds: [1], owner: 'owner', steps: ['step'], acceptance: ['done'] }];
  catalog.firstBatch = [{ candidateId: 1, steps: ['step'], acceptance: ['done'], excludedMetrics: ['excluded'], comparisonPolicy: 'same year', metrics: [{ indicatorCode: 'C3304', comparisonYear: '2023', metricKey: 'construction', population: 'permit holders', unit: '百万円', geography: 'prefecture', role: 'primary', visualization: 'table', definitionSource: 'source', timeSeriesPolicy: 'no interpolation', owner: 'owner' }] }];
  const report = { series: [{ code: 'C3304', statsDataId: '0000010103', status: 'verified', ...summarizeSeries(rows()) }] };
  const registry = { construction: { isActive: true, source: { statsDataId: '0000010103', cdCat01: 'C3304' } } };
  return { catalog, report, registry };
}

test('registered metrics and merge links cannot masquerade as rendered sections', () => {
  const plan = { themes: [
    { id: 1, decision: { disposition: 'existing-section', targetThemeKey: 'finance' } },
    { id: 2, decision: { disposition: 'merge-candidate', targetCandidateId: 1 } },
  ] };
  const catalogs = { finance: { key: 'finance', metrics: [{ rankingKey: 'money' }], sections: [], metricGroups: [] } };
  let result = inspectExpansionWiring(plan, catalogs);
  assert.equal(result.counts.existingSectionWired, 0);
  assert.equal(result.counts.existingSectionPending, 1);
  assert.equal(result.counts.mergeLinked, 0);
  catalogs.finance.metricGroups.push({ key: 'amount', rankingKeys: ['money'] });
  catalogs.finance.sections.push({ key: 'candidate-1', metricGroupKeys: ['amount'] });
  result = inspectExpansionWiring(plan, catalogs);
  assert.equal(result.counts.existingSectionWired, 1);
  assert.equal(result.counts.mergeLinked, 1);
  catalogs.finance.sections[0].metricGroupKeys.push('missing');
  assert.equal(inspectExpansionWiring(plan, catalogs).counts.existingSectionWired, 0);
});

test('existing dedicated chapter can satisfy an explicit reuse without adding a duplicate', () => {
  const plan = { themes: [{ id: 1, decision: { disposition: 'existing-section', targetThemeKey: 'finance' } }] };
  const catalogs = { finance: { key: 'finance', metrics: [{ rankingKey: 'ratio' }], sections: [{ key: 'sustainability', metricGroupKeys: [], embeddedSectionKeys: ['finance-sustainability'] }] } };
  const extensions = { finance: [{ candidateId: 1, existingSectionKey: 'sustainability', metrics: [['ratio', '比率']] }] };
  assert.equal(inspectExpansionWiring(plan, catalogs).counts.existingSectionWired, 0);
  assert.equal(inspectExpansionWiring(plan, catalogs, extensions).counts.existingSectionWired, 1);
  catalogs.finance.sections = [];
  assert.equal(inspectExpansionWiring(plan, catalogs, extensions).counts.existingSectionWired, 0);
});

test('missing handoff, duplicate scheduling and held candidates fail', () => {
  const { catalog, report, registry } = planFixture();
  assert.deepEqual(validateImplementationPlan(catalog, report, registry), []);
  catalog.implementationWaves[0].candidateIds.push(1, 2);
  assert.match(validateImplementationPlan(catalog, report, registry).join(), /exactly once/);
  delete catalog.firstBatch;
  assert.match(validateImplementationPlan(catalog, report, registry).join(), /Missing first batch/);
});

test('first batch rejects unavailable years, inactive keys and wrong sources', () => {
  for (const mutate of [
    ({ catalog }) => { catalog.firstBatch[0].metrics[0].comparisonYear = '2024'; },
    ({ registry }) => { registry.construction.isActive = false; },
    ({ registry }) => { registry.construction.source.cdCat01 = 'C3305'; },
    ({ report }) => { report.series[0].coverage[0].numericPrefectures = 46; },
  ]) {
    const fixture = planFixture(); mutate(fixture);
    assert.ok(validateImplementationPlan(fixture.catalog, fixture.report, fixture.registry).length > 0);
  }
});

test('a source alias requires a complete same-year comparison, not a similar title', () => {
  const { catalog, report, registry } = planFixture();
  registry.construction.source.cdCat01 = '#ALIAS';
  report.registryComparisons = [{ metricKey: 'construction', indicatorCode: 'C3304', statsDataId: '0000010103', cdCat01: '#ALIAS', year: '2023', matchedPrefectures: 47, mismatches: [] }];
  assert.deepEqual(validateImplementationPlan(catalog, report, registry), []);
  report.registryComparisons[0].year = '2022';
  assert.match(validateImplementationPlan(catalog, report, registry).join(), /does not match/);
});
