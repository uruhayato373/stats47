import { describe, expect, it } from 'vitest';
import { computeAnalyses, type AnalysisRevision } from '../src/analysis/compute';
import { buildAnalysisFigures } from '../src/analysis/figures';
import type { AnalysisObservation } from '../src/analysis/fetch-estat';

function fixture() {
  const plan: AnalysisRevision = {
    version: 'test', title: '地域比較', description: '用途', notes: [], useCases: [],
    sources: [{ id: 'source', grain: 'prefecture', years: [2000, 2010, 2020],
      metrics: [{ id: 'population', code: 'A', label: '人口', unit: '人' }],
      title: '人口', label: '国勢調査', url: 'https://www.e-stat.go.jp/', definition: '全人口', boundary: '同一境域' }],
    research: { method: '原典確認', references: [{ id: 'reference', title: '統計定義', url: 'https://www.e-stat.go.jp/',
      section: '人口', finding: '比較条件', checkedAt: '2026-11-12' }] },
    recipes: [{ id: 'population', heading: '人口を比べる', lead: '同じ年の人口。', sourceId: 'source', metricIds: ['population'],
      method: 'compare', year: 2020, areaCodes: ['39000', '38000'], template: 'bar', presentationMetricKey: 'total-population',
      scopeLabel: '高知県・愛媛県', references: ['reference'], limitation: '規模の比較です。' }],
  };
  const rows: AnalysisObservation[] = [
    ...[2000, 2010, 2020].map((year, i) => ({ sourceId: 'source', metricId: 'population', areaCode: '39000', areaName: '高知県', year, value: 100 - i * 10, unit: '人' })),
    ...[2000, 2010, 2020].map((year, i) => ({ sourceId: 'source', metricId: 'population', areaCode: '38000', areaName: '愛媛県', year, value: 200 - i * 20, unit: '人' })),
  ];
  return { plan, rows };
}

describe('分析結果から共通画像と説明を生成', () => {
  it('棒の値・年・単位・説明は納品する分析結果と一致する', () => {
    const { plan, rows } = fixture();
    const result = computeAnalyses(plan, rows);
    const { figures, showcase } = buildAnalysisFigures(plan, result);
    expect(figures).toEqual([{ file: 'population.png', template: 'bar', input: {
      metricKey: 'total-population', grain: 'prefecture', title: '人口を比べる', yearLabel: '2020年',
      unit: '人', note: '高知県・愛媛県', source: '国勢調査', rows: [{ name: '高知県', value: 80 }, { name: '愛媛県', value: 160 }],
    } }]);
    expect(showcase[0].lead).toBe(plan.recipes[0].lead);
    expect(showcase[0].note).toBe(plan.recipes[0].limitation);
    expect(showcase[0].figures[0]).toEqual({ file: 'population.png', alt: '人口を比べる（2020年）' });
  });
  it('複数地域は別の折れ線にし、欠測で線を切り、収録全期間ではなく分析期間を示す', () => {
    const { plan, rows } = fixture();
    Object.assign(plan.recipes[0], { method: 'series', template: 'line', year: undefined, from: 2010, to: 2020 });
    rows[1].value = null; rows[1].missingReason = '未公表';
    const { figures, showcase } = buildAnalysisFigures(plan, computeAnalyses(plan, rows));
    expect(figures[0]).toMatchObject({ template: 'line', input: {
      meta: '高知県・愛媛県・2010〜2020年・人', series: [
        { label: '高知県・人口', points: [{ x: '2010', value: null }, { x: '2020', value: 80 }] },
        { label: '愛媛県・人口', points: [{ x: '2010', value: 180 }, { x: '2020', value: 160 }] },
      ],
    } });
    expect(showcase[0].lead).toBe(plan.recipes[0].lead);
    expect(showcase[0].figures[0].alt).not.toContain('2000');
  });
  it('棒は欠測を0の棒へ変換せず、有効な地域数を説明する', () => {
    const { plan, rows } = fixture();
    rows[2].value = null; rows[2].missingReason = '未公表';
    const { figures, showcase } = buildAnalysisFigures(plan, computeAnalyses(plan, rows));
    expect(figures[0]).toMatchObject({ input: { rows: [{ name: '愛媛県', value: 160 }] } });
    expect(showcase[0].note).toBe(plan.recipes[0].limitation);
  });
  it('年度の指標は画像・代替文・説明を同じ年度表記にする', () => {
    const { plan, rows } = fixture();
    const fiscalPlan = { ...plan, sources: plan.sources.map(source => ({ ...source, inputs: [{ yearFormat: 'fiscal' as const }] })) };
    const { figures, showcase } = buildAnalysisFigures(fiscalPlan, computeAnalyses(plan, rows));
    expect(figures[0]).toMatchObject({ input: { yearLabel: '2020年度' } });
    expect(showcase[0].figures[0].alt).toContain('2020年度');
    expect(showcase[0].lead).toBe(plan.recipes[0].lead);
    Object.assign(fiscalPlan.recipes[0], { method: 'series', template: 'line', year: undefined });
    const series = buildAnalysisFigures(fiscalPlan, computeAnalyses(fiscalPlan, rows));
    expect(series.figures[0]).toMatchObject({ input: { meta: '高知県・愛媛県・2000〜2020年度・人' } });
    expect(series.showcase[0].lead).toBe(plan.recipes[0].lead);
  });
  it('画像生成だけ呼ばれても暦年と年度の混在を停止する', () => {
    const { plan, rows } = fixture();
    const mixed = { ...plan, sources: plan.sources.map(source => ({ ...source,
      inputs: [{ yearFormat: 'calendar' as const }, { yearFormat: 'fiscal' as const }] })) };
    expect(() => buildAnalysisFigures(mixed, computeAnalyses(plan, rows))).toThrow('暦年・年度');
  });
  it.each(['empty', 'unknown', 'duplicate', 'path'] as const)('不正な結果・画像パスを停止する: %s', kind => {
    const { plan, rows } = fixture();
    const result = computeAnalyses(plan, rows);
    if (kind === 'empty') result.splice(0);
    if (kind === 'unknown') result[0].analysisId = 'unknown';
    if (kind === 'duplicate') result.push({ ...result[0] });
    if (kind === 'path') { plan.recipes[0].id = '../population'; result.forEach(row => { row.analysisId = '../population'; }); }
    expect(() => buildAnalysisFigures(plan, result)).toThrow();
  });
});
