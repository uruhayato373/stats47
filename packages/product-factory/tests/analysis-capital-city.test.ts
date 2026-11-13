import { beforeEach, describe, expect, it, vi } from 'vitest';
import { METRICS_REGISTRY } from '@stats47/data-configs/registry';
import { resolveAnalysisInput, resolveAnalysisRevision, type AuthoredAnalysisRevision } from '../src/analysis/catalog';
import { assertCapitalCityMetadata, listCapitalCityAreas } from '../src/analysis/capital-city';
import { fetchAnalysisSource, type AnalysisSource } from '../src/analysis/fetch-estat';
import { fetchResolvedSource, relinkCachedRows } from '../src/analysis/load-source';

const api = vi.hoisted(() => ({ meta: vi.fn(), data: vi.fn() }));
vi.mock('@stats47/estat-api/api', () => ({
  fetchMetaInfoFromApi: api.meta, fetchStatsDataFromApi: api.data,
  extractYearCode: (code: string) => code.slice(0, 4),
  parseEstatValue: (value: string) => /^\d+$/.test(value) ? Number(value) : null,
}));

const source: AnalysisSource = { id: 'beef', statsDataId: '0004023606', grain: 'capital-city', years: [2024],
  filters: { cdCat02: '03' }, metrics: [{ id: 'beef-consumption-quantity', code: '010310010', label: '牛肉購入量', unit: 'g' }] };
function metadata() {
  return { GET_META_INFO: { RESULT: { STATUS: 0 }, METADATA_INF: {
    TABLE_INF: { '@id': source.statsDataId, TITLE: { $: '家計調査' } }, CLASS_INF: { CLASS_OBJ: [
      { '@id': 'tab', CLASS: [{ '@code': '02', '@name': '数量' }] },
      { '@id': 'cat01', CLASS: [{ '@code': '010310010', '@name': '牛肉', '@unit': '1g' }] },
      { '@id': 'cat02', CLASS: [{ '@code': '03', '@name': '二人以上世帯' }, { '@code': '04', '@name': '勤労者世帯' }] },
      { '@id': 'time', CLASS: [{ '@code': '2024000000', '@name': '2024年' }] },
      { '@id': 'area', CLASS: [...listCapitalCityAreas().map(area => ({ '@code': area.code, '@name': area.name })),
        { '@code': '40003', '@name': '40100 北九州市' }, { '@code': '00000', '@name': '全国' }] },
    ] },
  } } };
}
function response() {
  const values = [...listCapitalCityAreas().map(area => area.code), '40003', '00000'].map(area => ({
    '@tab': '02', '@cat01': '010310010', '@cat02': '03', '@time': '2024000000', '@area': area, '@unit': '1g', $: '3888',
  }));
  return { GET_STATS_DATA: { RESULT: { STATUS: 0 }, STATISTICAL_DATA: {
    TABLE_INF: { '@id': source.statsDataId }, RESULT_INF: { TOTAL_NUMBER: values.length, FROM_NUMBER: 1, TO_NUMBER: values.length },
    DATA_INF: { VALUE: values },
  } } };
}
beforeEach(() => { vi.resetAllMocks(); api.meta.mockResolvedValue(metadata()); api.data.mockResolvedValue(response()); });

describe('県庁所在市の家計を県・全自治体へ読み替えず取得する', () => {
  it('都市名SSOTに結び、福岡市の原符号を北九州市と区別する', () => {
    const areas = listCapitalCityAreas();
    expect(areas).toHaveLength(47);
    expect(areas.find(area => area.name === '福岡市')?.code).toBe('40004');
    expect(areas.some(area => area.code === '40003')).toBe(false);
    const changed = areas.map(area => ({ '@code': area.code, '@name': area.name }));
    changed[0]['@name'] = '別の市';
    expect(() => assertCapitalCityMetadata(changed)).toThrow('原典地域');
  });
  it('表・品目・世帯区分を指標定義から解決する', () => {
    const input = resolveAnalysisInput({ metricKey: 'beef-consumption-quantity' }, 'capital-city', [], METRICS_REGISTRY, [2024]);
    expect(input).toMatchObject({ statsDataId: '0004023606', code: '010310010', unit: 'g', filters: { cdCat02: '03' } });
    expect(() => resolveAnalysisInput({ metricKey: 'beef-consumption-quantity' }, 'prefecture', [], METRICS_REGISTRY)).toThrow('統計対象');
  });
  it('47都市の原コード・市名・値を保持し、1gだけをgへ同値表記する', async () => {
    const result = await fetchAnalysisSource(source);
    expect(result.rows).toHaveLength(47);
    expect(result.rows.find(row => row.areaCode === '01003')).toMatchObject({ areaName: '札幌市', value: 3888, unit: 'g' });
    expect(result.rows.some(row => row.areaCode === '40003' || row.areaCode === '01000')).toBe(false);
    expect(api.data).toHaveBeenCalledWith(expect.objectContaining({ cdCat01: '010310010', cdCat02: '03' }));
    expect(JSON.stringify(result.raw)).toContain('1g');
  });
  it.each(['04', 'missing'])('応答の世帯区分%sは指定区分と混在させない', async code => {
    const data = response();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE[0]['@cat02'] = code;
    api.data.mockResolvedValue(data);
    await expect(fetchAnalysisSource(source)).rejects.toThrow('fixed source coordinate');
  });
  it('gとkgの倍率差を同値表記として受容しない', async () => {
    const data = response(); data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE[0]['@unit'] = 'kg';
    api.data.mockResolvedValue(data);
    await expect(fetchAnalysisSource(source)).rejects.toThrow('Unit mismatch');
  });
  it('未選択・存在しない分類軸と可変の複数区分は停止する', async () => {
    await expect(fetchAnalysisSource({ ...source, filters: undefined })).rejects.toThrow('Unselected metadata dimension');
    await expect(fetchAnalysisSource({ ...source, filters: { cdCat02: '99' } })).rejects.toThrow('Unselected metadata dimension');
    await expect(fetchAnalysisSource({ ...source, filters: { cdCat03: '03' } })).rejects.toThrow();
    await expect(fetchAnalysisSource({ ...source, filters: { cdCat02: '03,04' } })).rejects.toThrow('Unsupported fixed');
  });
  it('世帯区分が違う同表入力を別取得にし、キャッシュ再利用を止める', async () => {
    const metric = METRICS_REGISTRY['beef-consumption-expenditure'];
    const second = { ...metric, key: 'other-household', source: { ...metric.source,
      filter: { ...('filter' in metric.source ? metric.source.filter : {}), statsDataId: '0004023605', cdCat01: '010310010', cdCat02: '04' } } };
    const registry = { ...METRICS_REGISTRY, [second.key]: second };
    const plan: AuthoredAnalysisRevision = { version: 'test', title: 'test', description: 'test', useCases: [], notes: [],
      sources: [{ id: 'beef', title: '牛肉', grain: 'capital-city', years: [2024], definition: '世帯区分別', boundary: '対象都市',
        inputs: [{ metricKey: metric.key }, { metricKey: second.key }] }], research: { method: 'test', references: [] }, recipes: [] };
    const resolved = resolveAnalysisRevision(plan, [], registry).sources[0];
    const fetcher = vi.fn(async (request: AnalysisSource) => ({ rows: request.metrics.flatMap(item => listCapitalCityAreas().map(area => ({
      sourceId: request.id, metricId: item.id, areaCode: area.code, areaName: area.name, year: 2024, value: 10, unit: item.unit,
    }))), raw: {}, retrievedAt: '', tableTitle: '家計調査' }));
    const result = await fetchResolvedSource(resolved, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.raw.map(part => part.request.filters)).toEqual([{ cdCat02: '03' }, { cdCat02: '04' }]);
    const single = { ...resolved, inputs: resolved.inputs.slice(0, 1), metrics: resolved.metrics.slice(0, 1) };
    const previous = { ...source, statsDataId: '0004023605', metrics: single.metrics, filters: { cdCat02: '04' } };
    expect(() => relinkCachedRows(previous, single, result.rows.filter(row => row.metricId === metric.key))).toThrow('再取得');
  });
});
