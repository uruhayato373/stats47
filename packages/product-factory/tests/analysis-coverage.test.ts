import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { readAnalysisCatalog } from '../src/analysis/catalog-files';
import { assertAnalysisAxes, analysisAxisRecipes } from '../src/analysis/coverage';
import type { AnalysisResult } from '../src/analysis/compute';

const { products } = readAnalysisCatalog(path.resolve(__dirname, '../../..'));
const product = (id: string) => structuredClone(products.find(product => product.productId === id)!);
describe('商品目的を推移・構成・地域比較へ接続', () => {
  it('全有料商品が3軸の採否とレシピまたは保留理由を持つ', () => {
    for (const item of products) expect(() => assertAnalysisAxes(item, products)).not.toThrow();
  });
  it('単年図を推移、一般の比率を構成と扱わない', () => {
    const item = product('P-06');
    for (const axis of ['trend', 'composition'] as const) {
      Object.assign(item.analysisPlan.axes.find(row => row.axis === axis)!, { decision: 'required', recipeRefs: ['national-pupils-per-teacher'] });
      expect(() => assertAnalysisAxes(item, products)).toThrow('分析軸とレシピ');
      item.analysisPlan.axes = product('P-06').analysisPlan.axes;
    }
  });
  it('採否・理由・参照が抜けても通さない', () => {
    const item = product('P-14');
    item.analysisPlan.axes.pop();
    expect(() => assertAnalysisAxes(item, products)).toThrow('採否');
    const other = product('P-14');
    other.analysisPlan.axes.find(row => row.axis === 'composition')!.reason = '';
    expect(() => assertAnalysisAxes(other, products)).toThrow('理由');
  });
  it('全体/全体の自己比率を構成分析の根拠にしない', () => {
    const item = product('P-03');
    const recipe = item.analysisRevision!.recipes.find(recipe => recipe.method === 'share')!;
    recipe.metricIds = [recipe.denominatorId!];
    expect(() => assertAnalysisAxes(item, products)).toThrow('composition');
  });
  it('入力年が複数あっても実結果が1年・1地域だけなら止める', () => {
    const item = product('P-14');
    const results = new Map(item.analysisRevision!.recipes.map(recipe => [recipe.id, [{ analysisId: recipe.id,
      areaCode: '01003', areaName: '札幌市', year: 2024, seriesId: recipe.metricIds[0], seriesLabel: '値', value: 10, unit: '円' }] as AnalysisResult[]]));
    expect(() => assertAnalysisAxes(item, products, results)).toThrow('実測結果');
    for (const rows of results.values()) rows.push({ ...rows[0], year: 2023 });
    expect(() => assertAnalysisAxes(item, products, results)).toThrow('comparison');
    for (const rows of results.values()) rows.push({ ...rows[0], areaCode: '26003', areaName: '京都市' });
    expect(() => assertAnalysisAxes(item, products, results)).not.toThrow();
  });
  it('素材集は選択図のみ、総合集は同梱ZIPの全レシピを継承する', () => {
    expect(analysisAxisRecipes(product('P-11'), products).has('P-01/population-flow-trend')).toBe(false);
    expect(analysisAxisRecipes(product('P-12'), products).has('P-01/population-flow-trend')).toBe(true);
    const item = product('P-11');
    item.analysisPlan.axes.find(row => row.axis === 'trend')!.recipeRefs.push('P-01/population-flow-trend');
    expect(() => assertAnalysisAxes(item, products)).toThrow('分析軸とレシピ');
  });
});
