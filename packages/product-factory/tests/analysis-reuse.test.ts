import { describe, expect, it } from 'vitest';
import { resolveAnalysisReuse, type ReusableAnalysisProduct } from '../src/analysis/reuse';

function fixture() {
  const source: ReusableAnalysisProduct = { productId: 'source', analysisPlan: { reuseProducts: [] }, analysisRevision: {
    version: 'v1', title: '元の分析', description: '説明', useCases: [], notes: [], sources: [], research: { method: '', references: [] },
    recipes: [{ id: 'trend', heading: '世帯の推移', lead: '同じ対象で比べる', sourceId: 'census', metricIds: ['general-households'],
      method: 'series', template: 'line', references: [], limitation: '一般世帯',
      themeRefs: [{ themeKey: 'living-housing', sectionKey: 'household-structure-and-elderly' }] }],
  } };
  const bundle: ReusableAnalysisProduct = { productId: 'bundle', analysisPlan: { reuseProducts: ['source'] }, analysisReuse: {
    version: 'v1', title: '素材集', description: '', useCases: [], notes: [], format: 'figures',
    examples: [{ productId: 'source', version: 'v1', recipeId: 'trend' }],
  } };
  return { source, bundle };
}

describe('分析商品の再利用契約', () => {
  it('元の説明・制約・テーマの章を継承し、分析IDの衝突を避ける', () => {
    const { source, bundle } = fixture();
    const [resolved] = resolveAnalysisReuse(bundle, [source, bundle]);
    expect(resolved.metadata.id).toBe('source-trend');
    expect(resolved.metadata.note).toBe('一般世帯');
    expect(resolved.metadata.themeRefs?.[0].href).toContain('/themes/living-housing#theme-section-household-structure-and-elderly');
    source.analysisRevision!.recipes[0].heading = '元商品で更新した見出し';
    expect(resolveAnalysisReuse(bundle, [source, bundle])[0].metadata.heading).toBe('元商品で更新した見出し');
  });
  it('元商品の版変更を黙って取り込まない', () => {
    const { source, bundle } = fixture();
    source.analysisRevision!.version = 'v2';
    expect(() => resolveAnalysisReuse(bundle, [source])).toThrow('版が一致しません');
  });
  it('欠落した分析と二重収録を止める', () => {
    const { source, bundle } = fixture();
    bundle.analysisReuse!.examples.push({ ...bundle.analysisReuse!.examples[0] });
    expect(() => resolveAnalysisReuse(bundle, [source])).toThrow('重複');
    bundle.analysisReuse!.examples = [{ productId: 'source', version: 'v1', recipeId: 'missing' }];
    expect(() => resolveAnalysisReuse(bundle, [source])).toThrow('作成例がありません');
  });
  it('未採用商品・自己参照・別の再利用商品の多段参照を止める', () => {
    const { source, bundle } = fixture();
    bundle.analysisPlan.reuseProducts = [];
    expect(() => resolveAnalysisReuse(bundle, [source])).toThrow('再利用計画にない');
    bundle.analysisPlan.reuseProducts = ['bundle'];
    bundle.analysisReuse!.examples[0].productId = 'bundle';
    expect(() => resolveAnalysisReuse(bundle, [bundle])).toThrow('再利用計画にない');
    bundle.analysisPlan.reuseProducts = ['source'];
    bundle.analysisReuse!.examples[0].productId = 'source';
    delete source.analysisRevision;
    expect(() => resolveAnalysisReuse(bundle, [source])).toThrow('版が一致しません');
  });
});
