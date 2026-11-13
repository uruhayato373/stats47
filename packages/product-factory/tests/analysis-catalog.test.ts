import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { METRICS_REGISTRY } from '@stats47/data-configs/registry';
import { validateAnalysisCatalog, type AnalysisCatalogContext, type AnalysisCatalogProduct } from '../src/analysis/validate-catalog';
import { readAnalysisCatalog } from '../src/analysis/catalog-files';

function fixture() {
  const product: AnalysisCatalogProduct = {
    productId: 'test', articleKey: 'paid-test', examples: [{ metricKeys: ['total-population'], themeRefs: [{ themeKey: 'population-dynamics', sectionKey: 'population-change' }] }],
    analysisPlan: {
      objective: '同年の市区町村人口を比較する',
      axes: ['trend', 'composition', 'comparison'].map(axis => ({ axis: axis as 'trend' | 'composition' | 'comparison', decision: 'deferred', reason: '採用可否を調査中', recipeRefs: [] })),
      inputs: [{ metricKey: 'total-population', scope: 'municipality', decision: 'use', reason: '国勢調査人口' }],
      analysisRefs: ['analysis:test'], figureRefs: ['figure:test'], reuseProducts: [], limitations: ['固定年の比較'],
    },
    analysisRevision: {
      version: 'test', title: '人口', description: '比較', useCases: [], notes: [],
      sources: [{ id: 'population', title: '人口', grain: 'municipality', years: [2020],
        inputs: [{ metricKey: 'total-population' }], definition: '国勢調査', boundary: '市単位' }],
      research: { method: '原典', references: [{ id: 'source', title: '原典', url: 'https://www.e-stat.go.jp/', section: '人口', finding: '同年', checkedAt: '2026-11-12' }] },
      recipes: [{ id: 'compare', heading: '比較', lead: '人口', sourceId: 'population', metricIds: ['total-population'],
        method: 'compare', year: 2020, areaCodes: ['39201'], template: 'bar', references: ['source'], limitation: '同年', presentationMetricKey: 'total-population',
        themeRefs: [{ themeKey: 'population-dynamics', sectionKey: 'population-change' }] }],
    },
  };
  const context: AnalysisCatalogContext = {
    registry: METRICS_REGISTRY, variants: [], paidProductIds: ['test'], paidArticleKeys: new Set(['paid-test']),
    articleKeysByProduct: new Map([['test', 'paid-test']]),
    analysisIds: new Set(['analysis:test']), figures: new Map([['figure:test', { analysis: 'analysis:test' }]]),
    areaCodes: { prefecture: new Set(['39000']), municipality: new Set(['39201']), 'capital-city': new Set(['01003']) },
  };
  return { product, context };
}

describe('商品分析の配線ゲート', () => {
  it('テーマの章の削除・誤接続と、作成例の紐づけ忘れを止める', () => {
    const { product, context } = fixture();
    product.examples[0].themeRefs = [];
    product.analysisRevision!.recipes[0].themeRefs = [{ themeKey: 'aging-society', sectionKey: 'population-change' }];
    const errors = validateAnalysisCatalog([product], context).join('\n');
    expect(errors).toContain('テーマ参照がありません');
    expect(errors).toContain('テーマの章がありません');
  });
  it('全有料商品の実台帳を読み、追加商品の計画漏れと配線の破損をCIで検出する', () => {
    const { products, context } = readAnalysisCatalog(path.resolve(__dirname, '../../..'));
    expect(products.length).toBe(context.paidProductIds.length);
    expect(products.some(product => product.analysisRevision)).toBe(true);
    expect(validateAnalysisCatalog(products, context)).toEqual([]);
  });
  it('同じ地域・年のcanonical入力を採用した改訂を受け付ける', () => {
    const { product, context } = fixture();
    expect(validateAnalysisCatalog([product], context)).toEqual([]);
  });
  it('有料商品の未整備と、採用した統計対象のすり替えを止める', () => {
    const { product, context } = fixture();
    context.paidProductIds = ['test', 'missing'];
    product.analysisPlan.inputs[0].metricKey = 'beef-consumption-expenditure';
    expect(validateAnalysisCatalog([product], context).join('\n')).toMatch(/missing.*分析計画/);
    expect(validateAnalysisCatalog([product], context).join('\n')).toContain('統計対象と採用地域');
  });
  it('除外した地域を利用可能とみなさず、明示的な除外理由を保持できる', () => {
    const { product, context } = fixture();
    product.analysisPlan.inputs.push({ metricKey: 'beef-consumption-expenditure', scope: 'municipality', decision: 'exclude', reason: '全自治体を対象としない' });
    expect(validateAnalysisCatalog([product], context)).toEqual([]);
  });
  it('別の有料記事への誤接続も商品マッピングと照合して止める', () => {
    const { product, context } = fixture();
    product.articleKey = 'other-paid';
    context.paidArticleKeys = new Set(['other-paid']);
    expect(validateAnalysisCatalog([product], context).join('\n')).toContain('商品と販売記事の対応');
  });
  it('別定義の指標・地域違いと、採用していない改訂入力を止める', () => {
    const { product, context } = fixture();
    product.analysisRevision!.sources[0].inputs[0].variantId = 'missing';
    const errors = validateAnalysisCatalog([product], context).join('\n');
    expect(errors).toContain('別定義が一致');
    expect(errors).toContain('改訂入力が採用計画と一致');
  });
  it('図と分析の孤立参照・商品の循環再利用を止める', () => {
    const { product, context } = fixture();
    product.analysisPlan.analysisRefs = [];
    product.analysisPlan.reuseProducts = ['test'];
    const errors = validateAnalysisCatalog([product], context).join('\n');
    expect(errors).toContain('図の分析参照');
    expect(errors).toContain('再利用が循環');
  });
  it('未収録の分母・年・自治体、画像の配色参照漏れを取得前に止める', () => {
    const { product, context } = fixture();
    const recipe = product.analysisRevision!.recipes[0];
    recipe.method = 'ratio'; recipe.denominatorId = 'general-households'; recipe.year = 2021;
    recipe.areaCodes = ['13101']; delete recipe.presentationMetricKey;
    const errors = validateAnalysisCatalog([product], context).join('\n');
    for (const fragment of ['入力が未収録', '未収録の年', '対象地域にない', '配色参照', '倍率・単位']) expect(errors).toContain(fragment);
  });
});
