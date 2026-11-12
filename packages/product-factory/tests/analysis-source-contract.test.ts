import { describe, expect, it, vi } from 'vitest';
import { buildMunicipalityEntityPolicy, listPublishableMunicipalities, PREFECTURE_AREA_CODES } from '@stats47/area';
import { METRICS_REGISTRY } from '@stats47/data-configs/registry';
import type { MetricConfig } from '@stats47/data-configs';
import { describeMetricCapability, productMetricKeys, resolveAnalysisInput, resolveAnalysisRevision,
  type AuthoredAnalysisRevision, type SourceVariant } from '../src/analysis/catalog';
import { fetchResolvedSource, relinkCachedRows, validateSourceRows } from '../src/analysis/load-source';
import type { AnalysisObservation, AnalysisSource } from '../src/analysis/fetch-estat';

const totalPopulation = METRICS_REGISTRY['total-population'];
const beefConsumptionExpenditure = METRICS_REGISTRY['beef-consumption-expenditure'];

function fixture() {
  const population: MetricConfig = { ...totalPopulation, key: 'population-test', supplementalSources: undefined };
  const households: MetricConfig = { ...population, key: 'households-test', title: '世帯', unit: '世帯',
    source: { kind: 'estat', statsDataId: '0000010101', cdCat01: 'A710101', displayName: '社会・人口統計体系' } };
  const registry = { [population.key]: population, [households.key]: households };
  const plan: AuthoredAnalysisRevision = {
    version: 'test', title: '地域比較', description: '分析用', useCases: [], notes: [],
    sources: [{ id: 'population', title: '人口・世帯', grain: 'prefecture', years: [2020],
      inputs: [{ metricKey: population.key }, { metricKey: households.key }], definition: '国勢調査', boundary: '同一境域' }],
    research: { method: '原典確認', references: [] }, recipes: [],
  };
  const source = () => resolveAnalysisRevision(plan, [], registry).sources[0];
  return { plan, population, households, registry, source };
}

function rowsFor(source: Pick<AnalysisSource, 'id' | 'years' | 'metrics'>,
  areas: readonly string[] = PREFECTURE_AREA_CODES): AnalysisObservation[] {
  return source.metrics.flatMap(metric => areas.flatMap(areaCode => source.years.map(year => ({
    sourceId: source.id, metricId: metric.id, areaCode, areaName: areaCode,
    year, value: 10, unit: metric.unit,
  }))));
}

function variant(overrides: Partial<SourceVariant> = {}): SourceVariant {
  return { id: 'original', metricKey: 'households-test', scope: 'municipality', statsDataId: '0000020201',
    code: 'A710101', label: '一般世帯数', unit: '世帯', yearFormat: 'calendar',
    definition: '丸める前の一般世帯数', url: 'https://www.e-stat.go.jp/dbview?sid=0000020201', ...overrides };
}

describe('指標台帳から分析の原典を解決する', () => {
  it('県庁所在市の家計調査を都道府県全体や市区町村全国値へ読み替えない', () => {
    const registry = { [beefConsumptionExpenditure.key]: beefConsumptionExpenditure };
    expect(describeMetricCapability(beefConsumptionExpenditure.key, registry).scopes).toEqual(['capital-city']);
    for (const grain of ['prefecture', 'municipality'] as const)
      expect(() => resolveAnalysisInput({ metricKey: beefConsumptionExpenditure.key }, grain, [], registry, [2020])).toThrow('統計対象');
  });
  it('市区町村対応表を共通規則で解決し、別の項目コードが必要な表は停止する', () => {
    const { registry, population } = fixture();
    expect(resolveAnalysisInput({ metricKey: population.key }, 'municipality', [], registry, [2020]))
      .toMatchObject({ statsDataId: '0000020201', code: 'A1101', id: population.key });
    registry[population.key].source = { kind: 'estat', statsDataId: '0000010201', cdCat01: '#A001' };
    expect(() => resolveAnalysisInput({ metricKey: population.key }, 'municipality', [], registry, [2020])).toThrow('別定義');
  });
  it('明示した別定義を使い、未対応だった市区町村の原数も指標IDで接続する', () => {
    const { registry, households } = fixture();
    registry[households.key].entities = ['prefecture'];
    expect(() => resolveAnalysisInput({ metricKey: households.key }, 'municipality', [], registry, [2020])).toThrow('統計対象');
    expect(resolveAnalysisInput({ metricKey: households.key, variantId: 'original' }, 'municipality', [variant()], registry, [2020]))
      .toMatchObject({ id: households.key, variantId: 'original', code: 'A710101', unit: '世帯' });
  });
  it.each(['key', 'scope', 'missing', 'duplicate'] as const)('不一致・曖昧な別定義を停止する: %s', kind => {
    const { registry, households } = fixture();
    const entry = variant();
    if (kind === 'key') entry.metricKey = 'population-test';
    if (kind === 'scope') entry.scope = 'prefecture';
    const entries = kind === 'missing' ? [] : kind === 'duplicate' ? [entry, { ...entry }] : [entry];
    expect(() => resolveAnalysisInput({ metricKey: households.key, variantId: 'original' }, 'municipality', entries, registry, [2020])).toThrow('別定義');
  });
  it('同じ数字の年でも暦年と年度を結合しない', () => {
    const { plan, registry, households } = fixture();
    registry[households.key].yearFormat = 'fiscal';
    expect(() => resolveAnalysisRevision(plan, [], registry)).toThrow('暦年と年度');
  });
  it.each(['valid', 'grain', 'prefecture', 'selected', 'presentation'] as const)
  ('市区町村地図の地域・配色契約を取得前に検査する: %s', kind => {
    const { plan, registry, population } = fixture();
    plan.sources[0].grain = 'municipality';
    plan.recipes = [{ id: 'map', heading: '人口の分布', lead: '県内全域を比較', sourceId: 'population',
      metricIds: [population.key], method: 'compare', year: 2020, template: 'choropleth',
      within: { kind: 'prefecture', prefCode: '39' }, presentationMetricKey: population.key, references: ['ref'], limitation: '人口の規模' }];
    if (kind === 'grain') plan.sources[0].grain = 'prefecture';
    if (kind === 'prefecture') plan.recipes[0].within = { kind: 'prefecture', prefCode: '99' };
    if (kind === 'selected') plan.recipes[0].areaCodes = ['39201'];
    if (kind === 'presentation') plan.recipes[0].presentationMetricKey = undefined;
    if (kind === 'valid') expect(resolveAnalysisRevision(plan, [], registry).recipes[0].template).toBe('choropleth');
    else expect(() => resolveAnalysisRevision(plan, [], registry)).toThrow('市区町村地図');
  });
  it('原典の無次元記号の表示名は明示できるが、倍率を変える単位の読み替えは停止する', () => {
    const { registry, households } = fixture();
    const input = { metricKey: households.key, variantId: 'original' };
    expect(resolveAnalysisInput(input, 'municipality', [variant({ rawUnit: '‐', unit: '指数' })], registry, [2020]))
      .toMatchObject({ rawUnit: '‐', unit: '指数' });
    expect(() => resolveAnalysisInput(input, 'municipality', [variant({ rawUnit: '千人', unit: '人' })], registry, [2020]))
      .toThrow('表示名だけで換算');
  });
  it('総人口の補足原典が必要な2025年を古いSSDS表から無言で取得しない', () => {
    const registry = { [totalPopulation.key]: totalPopulation };
    const input = { metricKey: totalPopulation.key };
    expect(resolveAnalysisInput(input, 'prefecture', [], registry, [2000, 2020]).statsDataId).toBe('0000010101');
    expect(() => resolveAnalysisInput(input, 'prefecture', [], registry, [2020, 2025])).toThrow('未対応の分類・加工');
    expect(() => resolveAnalysisInput(input, 'municipality', [], registry, [2025])).toThrow('未対応の分類・加工');
  });
  it.each(['duplicate-source', 'empty-years', 'duplicate-years', 'invalid-year', 'duplicate-coordinate'] as const)
  ('取得前に不正な定義を止める: %s', kind => {
    const { plan, registry, households, population } = fixture();
    if (kind === 'duplicate-source') plan.sources.push({ ...plan.sources[0] });
    if (kind === 'empty-years') plan.sources[0].years = [];
    if (kind === 'duplicate-years') plan.sources[0].years = [2020, 2020];
    if (kind === 'invalid-year') plan.sources[0].years = [2020.5];
    if (kind === 'duplicate-coordinate') registry[households.key].source = population.source;
    expect(() => resolveAnalysisRevision(plan, [], registry)).toThrow();
  });
  it('商品の利用指標索引に見本・採用/調査候補・改訂版を統合し、除外は含めない', () => {
    const { plan } = fixture();
    expect(productMetricKeys({ examples: [{ metricKeys: ['example', 'population-test'] }], analysisRevision: plan,
      analysisPlan: { inputs: [
        { metricKey: 'investigate', decision: 'investigate' },
        { metricKey: 'excluded', decision: 'exclude' },
      ] } }))
      .toEqual(['example', 'households-test', 'investigate', 'population-test']);
  });
});

describe('論理取得元の原票を完全性検査して結合', () => {
  it('47県×全指標×全年を要求し、0と理由付き欠測を別々に保持する', () => {
    const { plan, source } = fixture();
    plan.sources[0].years = [2015, 2020];
    const resolved = source(), rows = rowsFor(resolved);
    rows[0].value = 0;
    rows[1].value = null; rows[1].missingReason = '秘匿';
    expect(rows).toHaveLength(47 * 2 * 2);
    expect(() => validateSourceRows(resolved, rows)).not.toThrow();
    expect(rows[0].value).toBe(0);
    expect(rows[1].value).toBeNull();
    rows.pop();
    expect(() => validateSourceRows(resolved, rows)).toThrow('欠落');
  });
  it('指定都市は市、東京都は特別区という同じ自治体集合を要求する', () => {
    const { plan, source } = fixture();
    plan.sources[0].grain = 'municipality';
    const resolved = source();
    const areas = listPublishableMunicipalities(buildMunicipalityEntityPolicy()).map(area => area.code);
    const rows = rowsFor(resolved, areas);
    expect(areas).toContain('01100'); expect(areas).not.toContain('01101');
    expect(areas).toContain('13101'); expect(areas).not.toContain('13100');
    expect(() => validateSourceRows(resolved, rows)).not.toThrow();
    rows[0].areaCode = '01101';
    expect(() => validateSourceRows(resolved, rows)).toThrow('地域');
  });
  it.each(['source', 'metric', 'area', 'year', 'unit', 'null', 'nonfinite', 'duplicate', 'empty-source'] as const)
  ('原票の不整合を停止する: %s', kind => {
    const { source } = fixture();
    const resolved = source(), rows = rowsFor(resolved);
    if (kind === 'source') rows[0].sourceId = 'wrong';
    if (kind === 'metric') rows[0].metricId = 'wrong';
    if (kind === 'area') rows[0].areaCode = '00000';
    if (kind === 'year') rows[0].year = 2021;
    if (kind === 'unit') rows[0].unit = '千人';
    if (kind === 'null') { rows[0].value = null; rows[0].missingReason = ' '; }
    if (kind === 'nonfinite') rows[0].value = Infinity;
    if (kind === 'duplicate') rows.push({ ...rows[0] });
    if (kind === 'empty-source') { resolved.metrics = []; rows.splice(0); }
    expect(() => validateSourceRows(resolved, rows)).toThrow();
  });
  it('別表は同じ地域・年・指標IDで結合し、原票と要求座標を保全する', async () => {
    const { registry, households, source } = fixture();
    registry[households.key].source = { kind: 'estat', statsDataId: '0000010102', cdCat01: 'B0001' };
    const resolved = source();
    const fetcher = vi.fn(async (request: AnalysisSource) => ({ rows: rowsFor(request), raw: { table: request.statsDataId },
      retrievedAt: '2026-11-12T00:00:00.000Z', tableTitle: request.statsDataId }));
    const result = await fetchResolvedSource(resolved, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.rows).toHaveLength(94);
    expect(result.raw.map(part => part.request.statsDataId)).toEqual(['0000010101', '0000010102']);
    expect(resolved.statsDataId).toBeUndefined();
    fetcher.mockImplementation(async request => ({ rows: rowsFor(request).slice(1), raw: { table: request.statsDataId }, retrievedAt: '', tableTitle: '' }));
    await expect(fetchResolvedSource(resolved, fetcher)).rejects.toThrow('欠落');
  });
  it('単位の表示名を変える前に原票の単位を照合する', async () => {
    const { source } = fixture();
    const resolved = source();
    const fetcher = vi.fn(async (request: AnalysisSource) => {
      const rows = rowsFor(request);
      rows[0].unit = '千人';
      return { rows, raw: {}, retrievedAt: '', tableTitle: '' };
    });
    await expect(fetchResolvedSource(resolved, fetcher)).rejects.toThrow('原票の指標・単位');
  });
  it('定義した無次元記号を値の換算なしに表示し、0・欠測を保存する', async () => {
    const { source } = fixture();
    const resolved = source();
    resolved.inputs[0] = { ...resolved.inputs[0], rawUnit: '‐', unit: '指数' };
    resolved.metrics[0].unit = '指数';
    const fetcher = vi.fn(async (request: AnalysisSource) => {
      const rows = rowsFor(request);
      rows[0].value = 0; rows[1].value = null; rows[1].missingReason = '未公表';
      return { rows, raw: {}, retrievedAt: '', tableTitle: '' };
    });
    const result = await fetchResolvedSource(resolved, fetcher);
    expect(fetcher.mock.calls[0][0].metrics[0].unit).toBe('‐');
    const first = result.rows.filter(row => row.metricId === resolved.inputs[0].id).slice(0, 2);
    expect(first.map(row => [row.unit, row.value])).toEqual([['指数', 0], ['指数', null]]);
  });
});

describe('旧キャッシュの別名だけをcanonical指標IDへ接続', () => {
  function cacheFixture() {
    const { source } = fixture();
    const resolved = source();
    const previous: AnalysisSource = { id: 'legacy', statsDataId: resolved.inputs[0].statsDataId,
      grain: resolved.grain, years: [...resolved.years], metrics: resolved.metrics.map((metric, i) => ({ ...metric, id: `old-${i}` })) };
    return { resolved, previous, rows: rowsFor(previous) };
  }
  it('原典座標が同じなら地域・年・値・欠測を変えずIDを接続する', () => {
    const { resolved, previous, rows } = cacheFixture();
    rows[0].value = 0; rows[1].value = null; rows[1].missingReason = 'X';
    const linked = relinkCachedRows(previous, resolved, rows);
    expect(linked[0]).toEqual({ ...rows[0], sourceId: resolved.id, metricId: resolved.inputs[0].id });
    expect(linked[1]).toEqual({ ...rows[1], sourceId: resolved.id, metricId: resolved.inputs[0].id });
    expect(rows[0].metricId).toBe('old-0');
  });
  it.each(['table', 'scope', 'years', 'code', 'unit', 'missing', 'wrong-row', 'duplicate-id'] as const)
  ('取得座標が変わったキャッシュは再利用しない: %s', kind => {
    const { resolved, previous, rows } = cacheFixture();
    if (kind === 'table') previous.statsDataId = '0000010102';
    if (kind === 'scope') previous.grain = 'municipality';
    if (kind === 'years') previous.years = [2015];
    if (kind === 'code') previous.metrics[0].code = 'wrong';
    if (kind === 'unit') previous.metrics[0].unit = '千人';
    if (kind === 'missing') rows.pop();
    if (kind === 'wrong-row') rows[0].unit = '千人';
    if (kind === 'duplicate-id') previous.metrics[1].id = previous.metrics[0].id;
    expect(() => relinkCachedRows(previous, resolved, rows)).toThrow();
  });
});
