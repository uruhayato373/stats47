import type { MetricConfig } from '@stats47/data-configs';
import {
  describeMetricCapability, resolveAnalysisInput, resolveAnalysisRevision,
  type AuthoredAnalysisRevision, type ProductAnalysisPlan, type SourceVariant,
} from './catalog';

export interface AnalysisCatalogProduct {
  productId: string;
  articleKey: string;
  examples: { metricKeys: string[] }[];
  analysisPlan: ProductAnalysisPlan;
  analysisRevision?: AuthoredAnalysisRevision;
}
export interface AnalysisCatalogContext {
  registry: Record<string, MetricConfig>;
  variants: SourceVariant[];
  paidProductIds: readonly string[];
  articleKeysByProduct: ReadonlyMap<string, string>;
  paidArticleKeys: ReadonlySet<string>;
  analysisIds: ReadonlySet<string>;
  figures: ReadonlyMap<string, { analysis: string }>;
  areaCodes: { prefecture: ReadonlySet<string>; municipality: ReadonlySet<string> };
}

/** 通信なしで、原典を取得する前に商品・分析・入力の誤配線を止める。 */
export function validateAnalysisCatalog(products: readonly AnalysisCatalogProduct[], context: AnalysisCatalogContext): string[] {
  const errors: string[] = [];
  const check = (condition: unknown, message: string) => { if (!condition) errors.push(message); };
  const attempt = (label: string, action: () => unknown) => {
    try { action(); } catch (error) { errors.push(`${label}: ${error instanceof Error ? error.message : String(error)}`); }
  };
  const unique = (values: readonly string[], label: string) => check(new Set(values).size === values.length, `${label}: 重複ID`);
  unique(products.map(product => product.productId), '商品');
  unique(products.map(product => product.articleKey), '販売記事');
  unique(context.variants.map(variant => variant.id), '原典の別定義');
  const byId = new Map(products.map(product => [product.productId, product]));
  for (const id of context.paidProductIds) check(byId.has(id), `${id}: 有料商品の分析計画がありません`);
  for (const variant of context.variants) {
    check(Boolean(context.registry[variant.metricKey]), `${variant.id}: 未登録の指標 ${variant.metricKey}`);
  }
  for (const product of products) {
    const id = product.productId;
    check(context.paidProductIds.includes(id), `${id}: 有料商品台帳にありません`);
    check(context.paidArticleKeys.has(product.articleKey), `${id}: 有料記事の参照が不正です`);
    check(context.articleKeysByProduct.get(id) === product.articleKey, `${id}: 商品と販売記事の対応が一致しません`);
    const plan = product.analysisPlan;
    if (!plan) { errors.push(`${id}: 分析計画がありません`); continue; }
    unique(plan.inputs.map(input => `${input.metricKey}/${input.scope}/${input.variantId ?? ''}`), `${id}/inputs`);
    for (const input of plan.inputs) {
      const label = `${id}/${input.metricKey}/${input.scope}`;
      if (!context.registry[input.metricKey]) { errors.push(`${label}: 未登録の指標`); continue; }
      if (input.variantId) {
        attempt(label, () => {
          if (input.scope === 'capital-city') throw Error('対象都市の値に県・市区町村用の別定義は使えません');
          resolveAnalysisInput(input, input.scope, context.variants, context.registry);
        });
      } else if (input.decision === 'use') {
        check(describeMetricCapability(input.metricKey, context.registry).scopes.includes(input.scope), `${label}: 統計対象と採用地域が一致しません`);
      }
    }
    for (const key of product.examples.flatMap(example => example.metricKeys)) {
      check(Boolean(context.registry[key]), `${id}/example: 未登録の指標 ${key}`);
      check(plan.inputs.some(input => input.metricKey === key && input.decision === 'use'), `${id}/${key}: 現行見本が採用計画にありません`);
    }
    for (const reference of plan.analysisRefs) check(context.analysisIds.has(reference), `${id}: 未登録の分析 ${reference}`);
    for (const reference of plan.figureRefs) {
      const figure = context.figures.get(reference);
      check(Boolean(figure), `${id}: 未登録の図 ${reference}`);
      if (figure) check(plan.analysisRefs.includes(figure.analysis), `${id}/${reference}: 図の分析参照がありません`);
    }
    for (const dependency of plan.reuseProducts) check(byId.has(dependency), `${id}: 再利用元の商品がありません ${dependency}`);
    const revision = product.analysisRevision;
    if (!revision) continue;
    unique(revision.sources.map(source => source.id), `${id}/sources`);
    unique(revision.recipes.map(recipe => recipe.id), `${id}/recipes`);
    unique(revision.research.references.map(reference => reference.id), `${id}/references`);
    attempt(id, () => resolveAnalysisRevision(revision, context.variants, context.registry));
    for (const source of revision.sources) {
      for (const input of source.inputs) {
        check(plan.inputs.some(adopted => adopted.metricKey === input.metricKey && adopted.scope === source.grain &&
          adopted.decision === 'use' && adopted.variantId === input.variantId), `${id}/${source.id}/${input.metricKey}: 改訂入力が採用計画と一致しません`);
      }
    }
    for (const recipe of revision.recipes) {
      const label = `${id}/${recipe.id}`;
      const source = revision.sources.find(item => item.id === recipe.sourceId);
      if (!source) { errors.push(`${label}: 分析の取得元がありません`); continue; }
      const metricKeys = source.inputs.map(input => input.metricKey);
      unique(recipe.metricIds, label);
      for (const key of [...recipe.metricIds, ...(recipe.denominatorId ? [recipe.denominatorId] : []),
        ...(recipe.balances?.flatMap(balance => [balance.positiveId, balance.negativeId]) ?? [])]) {
        check(metricKeys.includes(key), `${label}: 分子・分母・増減の入力が未収録です ${key}`);
      }
      check(recipe.references.length > 0 && recipe.references.every(reference => revision.research.references.some(item => item.id === reference)), `${label}: 参考資料の参照がありません`);
      check(recipe.metricIds.length > 0, `${label}: 分子の指標がありません`);
      for (const year of [recipe.year, recipe.from, recipe.to]) if (year !== undefined) check(source.years.includes(year), `${label}: 未収録の年 ${year}`);
      check(!(recipe.year !== undefined && (recipe.from !== undefined || recipe.to !== undefined)), `${label}: 単年と期間の指定が重複しています`);
      if (recipe.from !== undefined && recipe.to !== undefined) check(recipe.from < recipe.to, `${label}: 分析期間が不正です`);
      const areas = recipe.areaCodes ?? (recipe.areaCode ? [recipe.areaCode] : []);
      check(!(recipe.areaCode && recipe.areaCodes), `${label}: 地域指定が重複しています`);
      unique(areas, `${label}/areas`);
      for (const code of areas) check(context.areaCodes[source.grain].has(code), `${label}: 対象地域にないコード ${code}`);
      if (recipe.within) check(source.grain === 'municipality' && (recipe.within.kind === 'nation' ||
        (recipe.within.kind === 'prefecture' && context.areaCodes.prefecture.has(`${recipe.within.prefCode}000`))), `${label}: 市区町村の表示範囲が不正です`);
      if (recipe.presentationMetricKey) check(Boolean(context.registry[recipe.presentationMetricKey]), `${label}: 配色の参照指標がありません`);
      if (recipe.template === 'bar' || recipe.template === 'choropleth') {
        check(Boolean(recipe.presentationMetricKey), `${label}: 地域比較の配色参照がありません`);
        check(recipe.metricIds.length === 1 && (recipe.method === 'change' || recipe.year !== undefined), `${label}: 地域比較は1時点・1指標です`);
        if (recipe.template === 'choropleth') check(source.grain === 'municipality' && Boolean(recipe.within) && !areas.length,
          `${label}: 市区町村地図は全国または県内全域を指定します`);
      } else {
        const years = source.years.filter(year => (recipe.year === undefined || year === recipe.year) && (recipe.from === undefined || year >= recipe.from) && (recipe.to === undefined || year <= recipe.to));
        check(years.length >= 2, `${label}: 折れ線には2時点以上が必要です`);
      }
      if (recipe.method === 'share' || recipe.method === 'ratio') check(Boolean(recipe.denominatorId), `${label}: 分母がありません`);
      if (recipe.method === 'ratio') check(Number.isFinite(recipe.scale) && recipe.scale! > 0 && Boolean(recipe.unit?.trim()), `${label}: 比率の倍率・単位が不正です`);
      if (recipe.method === 'change') check(recipe.from !== undefined && recipe.to !== undefined, `${label}: 増減率の期間がありません`);
    }
  }
  const visited = new Set<string>();
  function visit(id: string, path: string[] = []) {
    if (path.includes(id)) { errors.push(`商品の再利用が循環しています: ${[...path, id].join(' → ')}`); return; }
    if (visited.has(id)) return;
    for (const dependency of byId.get(id)?.analysisPlan?.reuseProducts ?? []) visit(dependency, [...path, id]);
    visited.add(id);
  }
  for (const product of products) visit(product.productId);
  return errors;
}
