import { describe, expect, it } from 'vitest';
import { computeAnalyses, describeAnalysis, type AnalysisRevision } from '../src/analysis/compute';
import type { AnalysisObservation } from '../src/analysis/fetch-estat';
import { buildAnalysisFigures } from '../src/analysis/figures';

function fixture() {
  const plan: AnalysisRevision = {
    version: 'test', title: '人口', description: '分析', useCases: [], notes: [],
    sources: [{ id: 'census', statsDataId: '0000010101', grain: 'prefecture', years: [2000, 2020],
      title: '人口・世帯', label: '国勢調査', url: 'https://www.e-stat.go.jp/', definition: '一般世帯', boundary: '同一境域',
      metrics: [{ id: 'all', code: 'A', label: '世帯数', unit: '世帯' }, { id: 'part', code: 'B', label: '単身世帯', unit: '世帯' }] }],
    research: { method: '原典', references: [{ id: 'ref', title: '定義', url: 'https://www.e-stat.go.jp/', section: '世帯', finding: '分母を一致', checkedAt: '2026-11-12' }] },
    recipes: [{ id: 'trend', heading: '変化', lead: '推移', sourceId: 'census', metricIds: ['all', 'part'],
      method: 'index', areaCode: '39000', template: 'line', references: ['ref'], limitation: '規模ではない' }],
  };
  const rows: AnalysisObservation[] = [
    ['all', 2000, 100], ['all', 2020, 80], ['part', 2000, 20], ['part', 2020, 40],
  ].map(([metricId, year, value]) => ({ sourceId: 'census', metricId: String(metricId), areaCode: '39000', areaName: '高知県', year: Number(year), value: Number(value), unit: '世帯' }));
  return { plan, rows };
}

describe('分析と図表・説明が使う値の契約', () => {
  it('構成は全体から残差を求め、納品値と共通積み上げ図を100％で一致させる', () => {
    const { plan, rows } = fixture();
    Object.assign(plan.recipes[0], { method: 'composition', template: 'stacked-bar', denominatorId: 'all',
      metricIds: ['part'], remainder: { id: 'other', label: 'その他の世帯' } });
    const result = computeAnalyses(plan, rows);
    expect(result.map(row => row.value)).toEqual([20, 80, 50, 50]);
    expect(buildAnalysisFigures(plan, result).figures[0]).toMatchObject({ template: 'stacked-bar', input: {
      groups: ['2000年', '2020年'], categories: [{ label: '単身世帯', values: [20, 50] }, { label: 'その他の世帯', values: [80, 50] }],
    } });
    expect(describeAnalysis(plan.recipes[0], result)).toContain('高知県・単身世帯 50％');
  });
  it.each(['欠測', '0分母', '過大', '負値', '異単位', '親子重複', '残差重複'])('構成の不正入力を0や再正規化で隠さない: %s', mode => {
    const { plan, rows } = fixture();
    Object.assign(plan.recipes[0], { method: 'composition', template: 'stacked-bar', denominatorId: 'all',
      metricIds: ['part'], remainder: { id: 'other', label: 'その他' } });
    if (mode === '欠測') { rows[2].value = null; rows[2].missingReason = '秘匿'; }
    if (mode === '0分母') rows[0].value = 0;
    if (mode === '過大') rows[2].value = 101;
    if (mode === '負値') rows[2].value = -1;
    if (mode === '異単位') { plan.sources[0].metrics[0].unit = '人'; rows.filter(row => row.metricId === 'all').forEach(row => { row.unit = '人'; }); }
    if (mode === '親子重複') plan.recipes[0].metricIds.push('all');
    if (mode === '残差重複') plan.recipes[0].remainder!.id = 'part';
    expect(() => computeAnalyses(plan, rows)).toThrow();
  });
  it('単位の異なる規模を基準年100で比較し、入力順に依存しない', () => {
    const { plan, rows } = fixture();
    plan.sources[0].metrics[0].unit = '人';
    rows.filter(row => row.metricId === 'all').forEach(row => { row.unit = '人'; });
    const result = computeAnalyses(plan, rows.reverse());
    expect(result.map(row => row.value)).toEqual([100, 80, 100, 200]);
    expect(describeAnalysis(plan.recipes[0], result)).toContain('100 → 80');
    expect(describeAnalysis(plan.recipes[0], result)).toContain('100 → 200');
  });
  it('割合は同じ母集団の分母を使い、内数を合算しない', () => {
    const { plan, rows } = fixture();
    Object.assign(plan.recipes[0], { method: 'share', denominatorId: 'all', metricIds: ['part'] });
    expect(computeAnalyses(plan, rows).map(row => row.value)).toEqual([20, 50]);
    rows[3].value = 81;
    expect(() => computeAnalyses(plan, rows)).toThrow('全体を超え');
  });
  it('全体を全体で割った100％を部分の割合として扱わない', () => {
    const { plan, rows } = fixture();
    Object.assign(plan.recipes[0], { method: 'share', denominatorId: 'all', metricIds: ['all'] });
    expect(() => computeAnalyses(plan, rows)).toThrow('全体自身');
  });
  it('欠測は0にせず伝播、0の分母は理由付きnullにする', () => {
    const { plan, rows } = fixture();
    Object.assign(plan.recipes[0], { method: 'share', denominatorId: 'all', metricIds: ['part'] });
    rows[0].value = rows[2].value = 0;
    rows[3].value = null; rows[3].missingReason = '秘匿';
    const result = computeAnalyses(plan, rows);
    expect(result.map(row => row.value)).toEqual([null, null]);
    expect(result.map(row => row.missingReason)).toEqual(['分母が0以下', '入力値が欠測']);
  });
  it('増減は正項から負項を引き、負値を保持する', () => {
    const { plan, rows } = fixture();
    Object.assign(plan.recipes[0], { method: 'balance', balances: [{ id: 'net', label: '増減', positiveId: 'part', negativeId: 'all' }] });
    expect(computeAnalyses(plan, rows).map(row => row.value)).toEqual([-80, -40]);
  });
  it('市区町村の選択地域だけを同期間で比較し、実値0を保持する', () => {
    const { plan, rows } = fixture();
    plan.sources[0].grain = 'municipality';
    rows.forEach(row => { row.areaCode = '39201'; row.areaName = '高知市'; });
    rows.push(...rows.map(row => ({ ...row, areaCode: '38201', areaName: '松山市' })));
    Object.assign(plan.recipes[0], { method: 'change', template: 'bar', metricIds: ['all'], areaCode: undefined, within: { kind: 'prefecture', prefCode: '39' }, from: 2000, to: 2020,
      presentationMetricKey: 'population-growth-rate', chartTitle: '増減率', scopeLabel: '高知県' });
    rows[1].value = 0;
    expect(computeAnalyses(plan, rows).map(row => row.value)).toEqual([-100]);
    rows[0].value = 0;
    expect(computeAnalyses(plan, rows)[0]).toMatchObject({ value: null, missingReason: '基準年が0以下' });
  });
  it('単年しかない入力でも、指定した年・地域で比較できる', () => {
    const { plan, rows } = fixture();
    plan.sources[0].years = [2020];
    const singleYear = rows.filter(row => row.year === 2020);
    singleYear.push(...singleYear.map(row => ({ ...row, areaCode: '38000', areaName: '愛媛県', value: 120 })));
    Object.assign(plan.recipes[0], { method: 'compare', metricIds: ['all'], template: 'bar', year: 2020,
      areaCode: undefined, areaCodes: ['38000', '39000'], presentationMetricKey: 'total-population' });
    const result = computeAnalyses(plan, singleYear);
    expect(result.map(row => [row.areaCode, row.year, row.value])).toEqual([['38000', 2020, 120], ['39000', 2020, 80]]);
    expect(describeAnalysis(plan.recipes[0], result)).toContain('2020年の比較可能な2地域');
    plan.recipes[0].year = undefined;
    expect(() => computeAnalyses(plan, singleYear)).toThrow('年を明示');
  });
  it('都道府県も同じ増減率処理で比較し、存在しない地域を黙って落とさない', () => {
    const { plan, rows } = fixture();
    Object.assign(plan.recipes[0], { method: 'change', template: 'bar', metricIds: ['all'], from: 2000, to: 2020,
      presentationMetricKey: 'population-growth-rate' });
    expect(computeAnalyses(plan, rows)[0].value).toBeCloseTo(-20);
    plan.recipes[0].areaCode = '99999';
    expect(() => computeAnalyses(plan, rows)).toThrow('指定地域');
  });
  it('比率は分子と分母が異なる単位でも、台帳の倍率・出力単位を用いる', () => {
    const { plan, rows } = fixture();
    plan.sources[0].metrics[1].unit = '施設';
    rows.filter(row => row.metricId === 'part').forEach(row => { row.unit = '施設'; });
    Object.assign(plan.recipes[0], { method: 'ratio', metricIds: ['part'], denominatorId: 'all', scale: 1000, unit: '施設/千世帯' });
    expect(computeAnalyses(plan, rows).map(row => [row.value, row.unit])).toEqual([[200, '施設/千世帯'], [500, '施設/千世帯']]);
    plan.recipes[0].scale = undefined;
    expect(() => computeAnalyses(plan, rows)).toThrow('倍率と出力単位');
  });
  it('比率の同年の分母が欠測・0以下なら、別の年で補わず理由付き欠測にする', () => {
    const { plan, rows } = fixture();
    Object.assign(plan.recipes[0], { method: 'ratio', metricIds: ['part'], denominatorId: 'all', scale: 1, unit: '世帯/世帯' });
    rows[0].value = 0;
    rows[1].value = null; rows[1].missingReason = '未公表';
    expect(computeAnalyses(plan, rows).map(row => [row.value, row.missingReason])).toEqual([
      [null, '分母が0以下'], [null, '入力値が欠測'],
    ]);
  });
  it('割合も明示した単年なら棒グラフで地域比較できる', () => {
    const { plan, rows } = fixture();
    Object.assign(plan.recipes[0], { method: 'share', template: 'bar', year: 2020, metricIds: ['part'], denominatorId: 'all',
      presentationMetricKey: 'single-household-ratio' });
    expect(computeAnalyses(plan, rows).map(row => row.value)).toEqual([50]);
  });
  it('複数地域の推移を別系列に保ち、指定期間で基準年をそろえる', () => {
    const { plan, rows } = fixture();
    plan.sources[0].years.push(2010);
    rows.push(...rows.filter(row => row.year === 2000).map(row => ({ ...row, year: 2010, value: 50 })));
    rows.push(...rows.map(row => ({ ...row, areaCode: '38000', areaName: '愛媛県', value: row.value! * 2 })));
    Object.assign(plan.recipes[0], { areaCode: undefined, areaCodes: ['39000', '38000'], from: 2010, to: 2020, metricIds: ['all'] });
    const result = computeAnalyses(plan, rows);
    expect(result.map(row => [row.areaCode, row.year, row.value])).toEqual([
      ['39000', 2010, 100], ['39000', 2020, 160], ['38000', 2010, 100], ['38000', 2020, 160],
    ]);
    expect(describeAnalysis(plan.recipes[0], result)).toContain('高知県・世帯数：100 → 160');
    expect(describeAnalysis(plan.recipes[0], result)).toContain('愛媛県・世帯数：100 → 160');
  });
  it.each(['missing-year', 'mixed-units', 'bar-years', 'bar-metrics', 'line-one-year', 'duplicate-areas', 'unknown-method'] as const)
  ('誤解を生む比較・画像指定を停止する: %s', kind => {
    const { plan, rows } = fixture();
    const recipe = plan.recipes[0];
    if (kind === 'missing-year') recipe.from = 2010;
    if (kind === 'mixed-units') {
      recipe.method = 'series'; plan.sources[0].metrics[0].unit = '人';
      rows.filter(row => row.metricId === 'all').forEach(row => { row.unit = '人'; });
    }
    if (kind === 'bar-years') Object.assign(recipe, { method: 'series', template: 'bar', metricIds: ['all'], presentationMetricKey: 'total-population' });
    if (kind === 'bar-metrics') Object.assign(recipe, { method: 'compare', template: 'bar', year: 2020, presentationMetricKey: 'total-population' });
    if (kind === 'line-one-year') Object.assign(recipe, { method: 'series', year: 2020 });
    if (kind === 'duplicate-areas') Object.assign(recipe, { areaCode: undefined, areaCodes: ['39000', '39000'] });
    if (kind === 'unknown-method') Object.assign(recipe, { method: 'unsupported' });
    expect(() => computeAnalyses(plan, rows)).toThrow();
  });
  it.each(['duplicate', 'missing', 'unit', 'reference', 'baseline'] as const)('不整合を停止する: %s', kind => {
    const { plan, rows } = fixture();
    if (kind === 'duplicate') rows.push({ ...rows[0] });
    if (kind === 'missing') rows.pop();
    if (kind === 'unit') rows[0].unit = '人';
    if (kind === 'reference') plan.recipes[0].references = ['不存在'];
    if (kind === 'baseline') rows[0].value = 0;
    expect(() => computeAnalyses(plan, rows)).toThrow();
  });
});
