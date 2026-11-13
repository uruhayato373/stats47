import type { AuthoredAnalysisRevision } from './catalog';
import type { AnalysisRecipe, AnalysisResult } from './compute';
import { resolveAnalysisReuse, type ReusableAnalysisProduct } from './reuse';

export interface AnalysisAxis {
  axis: 'trend' | 'composition' | 'comparison';
  decision: 'required' | 'deferred' | 'not-applicable';
  reason: string;
  /** 自商品のrecipe ID。再利用はproductId/recipeId。 */
  recipeRefs: string[];
}
type Product = ReusableAnalysisProduct & { analysisPlan: ReusableAnalysisProduct['analysisPlan'] & { axes: AnalysisAxis[] } };
type RecipeEntry = { recipe: AnalysisRecipe; source: AuthoredAnalysisRevision['sources'][number] };

/** 素材集は選択した図、総合集は同梱する商品全体を対象とする。 */
export function analysisAxisRecipes(product: Product, products: readonly Product[]): Map<string, RecipeEntry> {
  const entries: [string, RecipeEntry][] = [];
  const add = (revision: AuthoredAnalysisRevision, recipe: AnalysisRecipe, prefix = '') => {
    const source = revision.sources.find(source => source.id === recipe.sourceId);
    if (!source) throw Error(`分析軸の取得元がありません: ${prefix}${recipe.id}`);
    entries.push([`${prefix}${recipe.id}`, { recipe, source }]);
  };
  if (product.analysisRevision) for (const recipe of product.analysisRevision.recipes) add(product.analysisRevision, recipe);
  if (product.analysisReuse) for (const selection of resolveAnalysisReuse(product, products)) {
    const recipes = product.analysisReuse.format === 'packs' ? selection.source.recipes : [selection.recipe];
    for (const recipe of recipes) add(selection.source, recipe, `${selection.productId}/`);
  }
  return new Map(entries);
}

function supports(axis: AnalysisAxis['axis'], { recipe, source }: RecipeEntry): boolean {
  const years = source.years.filter(year => (recipe.year === undefined || year === recipe.year) &&
    (recipe.from === undefined || year >= recipe.from) && (recipe.to === undefined || year <= recipe.to));
  if (axis === 'trend') return years.length >= 2 && (recipe.template === 'line' || recipe.template === 'stacked-bar' || recipe.method === 'change');
  if (axis === 'composition') return ['share', 'composition'].includes(recipe.method) && Boolean(recipe.denominatorId) && !recipe.metricIds.includes(recipe.denominatorId!);
  return !recipe.areaCode && (!recipe.areaCodes || recipe.areaCodes.length >= 2);
}

/** 計画で採用した軸と計算レシピの関係をCIで検査する。完了フラグは持たない。 */
export function assertAnalysisAxes(product: Product, products: readonly Product[], results?: ReadonlyMap<string, AnalysisResult[]>): void {
  const axes = product.analysisPlan.axes;
  if (!axes || axes.length !== 3 || new Set(axes.map(item => item.axis)).size !== 3 ||
      axes.some(item => !['trend', 'composition', 'comparison'].includes(item.axis)))
    throw Error('推移・構成・地域比較の採否をそれぞれ記録してください');
  const recipes = analysisAxisRecipes(product, products);
  for (const item of axes) {
    if (!item.reason?.trim() || !['required', 'deferred', 'not-applicable'].includes(item.decision)) throw Error('分析軸の採否理由がありません');
    if (new Set(item.recipeRefs).size !== item.recipeRefs.length ||
        (item.decision === 'required' ? !item.recipeRefs.length : item.recipeRefs.length > 0)) throw Error('採用した分析軸だけに計算レシピを接続してください');
    for (const ref of item.recipeRefs) {
      const entry = recipes.get(ref);
      if (!entry || !supports(item.axis, entry)) throw Error(`分析軸とレシピが一致しません: ${item.axis}/${ref}`);
      if (!results) continue;
      const rows = results.get(ref)?.filter(row => row.value !== null) ?? [];
      let valid = rows.length > 0;
      if (item.axis === 'trend' && entry.recipe.method !== 'change') {
        const series = new Map<string, Set<number>>();
        for (const row of rows) {
          const key = `${row.areaCode}/${row.seriesId}`;
          if (!series.has(key)) series.set(key, new Set());
          series.get(key)!.add(row.year);
        }
        valid = valid && [...series.values()].some(years => years.size >= 2);
      }
      if (item.axis === 'comparison') {
        const groups = new Map<string, Set<string>>();
        for (const row of rows) {
          const key = `${row.year}/${row.seriesId}`;
          if (!groups.has(key)) groups.set(key, new Set());
          groups.get(key)!.add(row.areaCode);
        }
        valid = valid && [...groups.values()].some(areas => areas.size >= 2);
      }
      if (!valid) throw Error(`採用した分析軸に比較可能な実測結果がありません: ${item.axis}/${ref}`);
    }
  }
}
