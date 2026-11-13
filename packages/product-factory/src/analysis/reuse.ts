import type { AuthoredAnalysisRevision, ProductAnalysisPlan } from './catalog';
import type { AnalysisRecipe } from './compute';
import { resolveProductThemeReferences } from './theme-references';

/** 再計算せず、版を固定した元商品の作成例と納品を参照する。 */
export interface AnalysisReuse {
  version: string; title: string; description: string;
  useCases: { title: string; description: string }[]; notes: string[];
  format: 'figures' | 'packs';
  examples: { productId: string; version: string; recipeId: string }[];
}
export interface ReusableAnalysisProduct {
  productId: string;
  analysisPlan: Pick<ProductAnalysisPlan, 'reuseProducts'>;
  analysisRevision?: AuthoredAnalysisRevision;
  analysisReuse?: AnalysisReuse;
}

export function recipeShowcaseMetadata(recipe: AnalysisRecipe) {
  return { id: recipe.id, heading: recipe.heading, lead: recipe.lead, note: recipe.limitation,
    themeRefs: resolveProductThemeReferences(recipe.themeRefs ?? []) };
}

export function resolveAnalysisReuse(product: ReusableAnalysisProduct, products: readonly ReusableAnalysisProduct[]) {
  const plan = product.analysisReuse;
  if (!plan || product.analysisRevision) throw Error(`${product.productId}: 計算と再利用の台帳はどちらか一つです`);
  const seen = new Set<string>();
  return plan.examples.map(reference => {
    const key = `${reference.productId}/${reference.recipeId}`;
    if (seen.has(key)) throw Error(`再利用する作成例が重複しています: ${key}`);
    seen.add(key);
    if (reference.productId === product.productId || !product.analysisPlan.reuseProducts.includes(reference.productId))
      throw Error(`再利用計画にない商品です: ${reference.productId}`);
    const source = products.find(item => item.productId === reference.productId)?.analysisRevision;
    if (!source || source.version !== reference.version) throw Error(`再利用元の分析版が一致しません: ${reference.productId}/${reference.version}`);
    const recipe = source.recipes.find(item => item.id === reference.recipeId);
    if (!recipe) throw Error(`再利用元の作成例がありません: ${key}`);
    return { ...reference, source, recipe, prefix: `${reference.productId.toLowerCase()}-`,
      metadata: { ...recipeShowcaseMetadata(recipe), id: `${reference.productId.toLowerCase()}-${recipe.id}` } };
  });
}
