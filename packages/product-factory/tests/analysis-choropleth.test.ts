import { describe, expect, it } from 'vitest';
import { buildMunicipalityEntityPolicy, listPublishableMunicipalities } from '@stats47/area';
import { assertAnalysisFigureShape, computeAnalyses, type AnalysisRevision } from '../src/analysis/compute';
import { buildAnalysisFigures } from '../src/analysis/figures';
import type { AnalysisObservation } from '../src/analysis/fetch-estat';

function fixture(prefectureCode: string | undefined = '39') {
  const areas = listPublishableMunicipalities(buildMunicipalityEntityPolicy()).filter(area => !prefectureCode || area.code.startsWith(prefectureCode));
  const plan: AnalysisRevision = {
    version: 'test', title: '人口と世帯', description: '地域比較', useCases: [], notes: [],
    sources: [{ id: 'municipal', grain: 'municipality', years: [2000, 2020], title: '国勢調査', label: '国勢調査',
      url: 'https://www.e-stat.go.jp/', definition: '一般世帯', boundary: '同じ市町村境域',
      metrics: [{ id: 'members', code: 'A', label: '一般世帯人員', unit: '人' }, { id: 'households', code: 'B', label: '一般世帯数', unit: '世帯' }] }],
    research: { method: '原典確認', references: [{ id: 'ref', title: '定義', url: 'https://www.e-stat.go.jp/',
      section: '世帯', finding: '分母を一般世帯に揃える', checkedAt: '2026-11-12' }] },
    recipes: [{ id: 'map', heading: '世帯規模を比べる', lead: '地域差を地図で確認します。', sourceId: 'municipal',
      metricIds: ['members'], denominatorId: 'households', method: 'ratio', scale: 1, unit: '人/世帯', year: 2020,
      template: 'choropleth', within: prefectureCode ? { kind: 'prefecture', prefCode: prefectureCode } : { kind: 'nation' }, presentationMetricKey: 'general-household-members',
      references: ['ref'], limitation: '一般世帯の平均です。' }],
  };
  const rows: AnalysisObservation[] = areas.flatMap(area => [2000, 2020].flatMap(year => [
    { sourceId: 'municipal', metricId: 'members', areaCode: area.code, areaName: area.name, year, value: year === 2000 ? 240 : 180, unit: '人' },
    { sourceId: 'municipal', metricId: 'households', areaCode: area.code, areaName: area.name, year, value: 100, unit: '世帯' },
  ]));
  return { plan, rows, areas };
}

describe('県内の市区町村を共通コロプレス型に渡す', () => {
  it('全国の全市町村・特別区を同じ画像型に渡し、県のフィルターを残さない', () => {
    const { plan, rows, areas } = fixture('');
    const result = computeAnalyses(plan, rows);
    const figure = buildAnalysisFigures(plan, result).figures[0];
    expect(result).toHaveLength(areas.length);
    expect(new Set(result.map(row => row.areaCode.slice(0, 2))).size).toBe(47);
    expect(figure).toMatchObject({ template: 'choropleth', input: { area: { scope: { within: { kind: 'nation' } } } } });
    expect(result.map(row => row.areaCode)).toEqual(expect.arrayContaining(['14100', '13101', '13421', '47357']));
    expect(result.map(row => row.areaCode)).not.toContain('14101');
    expect(() => computeAnalyses(plan, rows.filter(row => row.areaCode !== '13421'))).toThrow('地域コード');
  });
  it('地図の値は同梱する分析結果と一致し、名称ではなく自治体コードで結合する', () => {
    const { plan, rows, areas } = fixture();
    const result = computeAnalyses(plan, rows.reverse());
    const { figures, showcase } = buildAnalysisFigures(plan, result);
    expect(figures[0]).toEqual({ file: 'map.png', template: 'choropleth', input: { area: {
      metricKey: 'general-household-members', grain: 'municipality', title: '世帯規模を比べる', yearLabel: '2020年',
      unit: '人/世帯', source: '国勢調査', scope: { level: 'municipality', wardMode: 'merged', within: { kind: 'prefecture', prefCode: '39' } },
      values: result.map(row => ({ areaCode: row.areaCode, value: row.value })),
    } } });
    expect(result).toHaveLength(areas.length);
    expect(result.every(row => row.value === 1.8)).toBe(true);
    expect(showcase[0]).toMatchObject({ lead: plan.recipes[0].lead, note: plan.recipes[0].limitation });
  });

  it('分母0と欠測は空白用のnull、分子の実値0は0として地図へ渡す', () => {
    const { plan, rows, areas } = fixture();
    rows.find(row => row.areaCode === areas[0].code && row.year === 2020 && row.metricId === 'households')!.value = 0;
    const missing = rows.find(row => row.areaCode === areas[1].code && row.year === 2020 && row.metricId === 'members')!;
    missing.value = null; missing.missingReason = '秘匿';
    rows.find(row => row.areaCode === areas[2].code && row.year === 2020 && row.metricId === 'members')!.value = 0;
    const result = computeAnalyses(plan, rows);
    const figure = buildAnalysisFigures(plan, result).figures[0];
    if (figure.template !== 'choropleth') throw Error('地図ではありません');
    expect(figure.input.area.values.slice(0, 3).map(row => row.value)).toEqual([null, null, 0]);
    expect(result.slice(0, 2).map(row => row.missingReason)).toEqual(['分母が0以下', '入力値が欠測']);
  });

  it('増減率の地図は終点年だけでなく比較期間を表示する', () => {
    const { plan, rows } = fixture();
    Object.assign(plan.recipes[0], { method: 'change', year: undefined, from: 2000, to: 2020 });
    const figure = buildAnalysisFigures(plan, computeAnalyses(plan, rows)).figures[0];
    expect(figure).toMatchObject({ template: 'choropleth', input: { area: { yearLabel: '2000〜2020年', unit: '％' } } });
    if (figure.template !== 'choropleth') throw Error('地図ではありません');
    expect(figure.input.area.values.every(row => row.value === -25)).toBe(true);
  });

  it('政令市は市単位、東京特別区は区単位で描く', () => {
    const kanagawa = fixture('14'), tokyo = fixture('13');
    const codes = (data: ReturnType<typeof fixture>) => computeAnalyses(data.plan, data.rows).map(row => row.areaCode);
    expect(codes(kanagawa)).toContain('14100');
    expect(codes(kanagawa)).not.toContain('14101');
    expect(codes(tokyo)).toContain('13101');
    expect(codes(tokyo)).not.toContain('13100');
  });

  it.each(['partial', 'selected', 'unknown', 'grain', 'multiple-years', 'presentation'] as const)
  ('地図に誤った範囲・型を渡さない: %s', kind => {
    const { plan, rows, areas } = fixture();
    if (kind === 'partial') rows.splice(0, 4);
    if (kind === 'selected') plan.recipes[0].areaCodes = [areas[0].code];
    if (kind === 'unknown') rows.filter(row => row.areaCode === areas[0].code).forEach(row => { row.areaCode = '39999'; });
    if (kind === 'grain') plan.sources[0].grain = 'prefecture';
    if (kind === 'multiple-years') plan.recipes[0].year = undefined;
    if (kind === 'presentation') plan.recipes[0].presentationMetricKey = undefined;
    expect(() => computeAnalyses(plan, rows)).toThrow();
  });

  it('地図生成だけの呼び出しでも欠測理由を要求する', () => {
    const { plan, rows } = fixture();
    const result = computeAnalyses(plan, rows);
    result[0].value = null;
    expect(() => assertAnalysisFigureShape(plan.recipes[0], result)).toThrow('欠測理由');
  });
});
