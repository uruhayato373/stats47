import { METRICS_REGISTRY } from '@stats47/data-configs/registry';
import { buildRecipe } from '@stats47/data-configs/recipe';
import { prefToCityStatsDataId } from '@stats47/data-configs/ssds/entity-source';
import { isCapitalCityValueMetric } from '@stats47/data-configs/provenance';
import { getMunicipalityMetricAvailability } from '@stats47/data-configs/geo-scope';
import { parseUnit } from '@stats47/data-configs/unit';
import type { MetricConfig } from '@stats47/data-configs';
import type { AnalysisRevision } from './compute';

export type AnalysisScope = 'prefecture' | 'municipality' | 'capital-city';
export interface AnalysisInput { metricKey: string; variantId?: string }
export interface SourceVariant {
  id: string; metricKey: string; scope: 'prefecture' | 'municipality';
  statsDataId: string; code: string; unit: string; rawUnit?: string; label: string;
  yearFormat: 'calendar' | 'fiscal'; definition: string; url: string;
}
export interface SourcePlan {
  id: string; title: string; grain: 'prefecture' | 'municipality'; years: number[];
  inputs: AnalysisInput[]; definition: string; boundary: string;
}
export interface AuthoredAnalysisRevision extends Omit<AnalysisRevision, 'sources'> { sources: SourcePlan[] }
export interface ProductAnalysisPlan {
  objective: string;
  inputs: (AnalysisInput & { scope: AnalysisScope; decision: 'use' | 'investigate' | 'exclude'; reason: string })[];
  analysisRefs: string[]; figureRefs: string[]; reuseProducts: string[]; limitations: string[];
}
export interface ResolvedInput {
  metricKey: string; variantId?: string; id: string; code: string; label: string; unit: string; rawUnit?: string;
  statsDataId: string; url: string; yearFormat: NonNullable<MetricConfig['yearFormat']>; definition: string;
}
export type ResolvedSource = AnalysisRevision['sources'][number] & {
  inputs: ResolvedInput[];
};
export interface ResolvedAnalysisRevision extends Omit<AnalysisRevision, 'sources'> { sources: ResolvedSource[] }

/** Source availability is distinct from publication and from a frozen paid delivery. */
export function describeMetricCapability(metricKey: string, registry: Record<string, MetricConfig> = METRICS_REGISTRY) {
  const metric = registry[metricKey];
  if (!metric) throw Error(`未登録の指標: ${metricKey}`);
  const capital = isCapitalCityValueMetric(metric, registry);
  return {
    metricKey, title: metric.title, unit: metric.unit, yearFormat: metric.yearFormat ?? 'calendar',
    scopes: capital ? ['capital-city'] : metric.entities.flatMap(entity => entity === 'city' ? ['municipality'] : entity === 'prefecture' ? ['prefecture'] : []),
    configuredYears: metric.years,
    municipalityPublication: getMunicipalityMetricAvailability(metricKey).status,
  };
}

/** A variant is an explicit source definition, never an implicit unit conversion. */
export function resolveAnalysisInput(input: AnalysisInput, scope: SourcePlan['grain'], variants: readonly SourceVariant[],
  registry: Record<string, MetricConfig> = METRICS_REGISTRY, years: readonly number[] = []): ResolvedInput {
  const metric = registry[input.metricKey];
  if (!metric) throw Error(`未登録の指標: ${input.metricKey}`);
  if (input.variantId) {
    const matches = variants.filter(item => item.id === input.variantId);
    const variant = matches[0];
    if (matches.length !== 1 || variant.metricKey !== input.metricKey || variant.scope !== scope)
      throw Error(`指標・地域と原典の別定義が一致しません: ${input.metricKey}/${input.variantId}`);
    if (variant.rawUnit) {
      const raw = parseUnit(variant.rawUnit), displayed = parseUnit(variant.unit);
      if (raw.dimension && displayed.dimension && (raw.dimension !== displayed.dimension ||
          raw.baseUnit !== displayed.baseUnit || raw.scaleExponent !== displayed.scaleExponent ||
          JSON.stringify(raw.denominator) !== JSON.stringify(displayed.denominator)))
        throw Error(`原単位を表示名だけで換算できません: ${variant.id}`);
    }
    return { ...variant, variantId: variant.id, id: input.metricKey };
  }
  if (!describeMetricCapability(input.metricKey, registry).scopes.includes(scope))
    throw Error(`指標の統計対象が地域に対応しません: ${input.metricKey}/${scope}`);
  const source = scope === 'municipality' && metric.citySource ? metric.citySource : metric.source;
  const recipe = buildRecipe({ ...metric, source });
  const params = recipe.estatParams;
  if (!params?.cdCat01 || Object.keys(recipe.ops ?? {}).some(key => key !== 'supplements') ||
      recipe.ops?.supplements?.some(item => item.years.some(year => years.includes(year))) ||
      Object.keys(params).some(key => !['statsDataId', 'cdCat01'].includes(key)))
    throw Error(`分析用の原典取得に未対応の分類・加工があります: ${input.metricKey}`);
  const statsDataId = scope === 'municipality' && !metric.citySource ? prefToCityStatsDataId(params.statsDataId) : params.statsDataId;
  if (!statsDataId) throw Error(`対応する市区町村の原典がありません: ${input.metricKey}`);
  // SSDS indicators (#...) use different codes between prefecture and municipality.
  if (scope === 'municipality' && statsDataId !== params.statsDataId && params.cdCat01.startsWith('#'))
    throw Error(`市区町村の項目コードの確認と別定義の登録が必要です: ${input.metricKey}`);
  return {
    metricKey: metric.key, id: metric.key, code: params.cdCat01, label: metric.title, unit: metric.unit,
    statsDataId, url: `https://www.e-stat.go.jp/dbview?sid=${statsDataId}`,
    yearFormat: metric.yearFormat ?? 'calendar', definition: metric.description ?? metric.subtitle ?? metric.title,
  };
}

export function resolveAnalysisRevision(plan: AuthoredAnalysisRevision, variants: readonly SourceVariant[],
  registry: Record<string, MetricConfig> = METRICS_REGISTRY): ResolvedAnalysisRevision {
  if (!plan.sources.length || new Set(plan.sources.map(source => source.id)).size !== plan.sources.length)
    throw Error('分析取得元が空または重複しています');
  const sources = plan.sources.map(source => {
    if (!['prefecture', 'municipality'].includes(source.grain) || !source.years.length ||
        new Set(source.years).size !== source.years.length || source.years.some(year => !Number.isInteger(year) || year < 1900 || year > 2100))
      throw Error(`分析の地域単位または年が不正です: ${source.id}`);
    if (!source.inputs.length || new Set(source.inputs.map(input => input.metricKey)).size !== source.inputs.length)
      throw Error(`分析入力が空または重複しています: ${source.id}`);
    const inputs = source.inputs.map(input => resolveAnalysisInput(input, source.grain, variants, registry, source.years));
    if (new Set(inputs.map(input => input.yearFormat)).size !== 1)
      throw Error(`暦年と年度を同じ分析へ結合できません: ${source.id}`);
    if (new Set(inputs.map(input => `${input.statsDataId}/${input.code}`)).size !== inputs.length)
      throw Error(`同じ原典座標に複数の指標を割り当てています: ${source.id}`);
    return { ...source, inputs, metrics: inputs.map(({ id, code, label, unit }) => ({ id, code, label, unit })),
      label: [...new Set(inputs.map(input => {
        const origin = registry[input.metricKey].source;
        return 'displayName' in origin ? origin.displayName ?? '政府統計' : '政府統計';
      }))].join('・'),
      url: inputs[0].url,
      ...(new Set(inputs.map(input => input.statsDataId)).size === 1 ? { statsDataId: inputs[0].statsDataId } : {}),
    };
  });
  for (const recipe of plan.recipes) {
    if (recipe.template === 'choropleth' &&
        (sources.find(source => source.id === recipe.sourceId)?.grain !== 'municipality' ||
         !recipe.within || !['nation', 'prefecture'].includes(recipe.within.kind) ||
         (recipe.within.kind === 'prefecture' && !/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(recipe.within.prefCode)) ||
         recipe.areaCode || recipe.areaCodes || !recipe.presentationMetricKey))
      throw Error(`市区町村地図は指標の配色と全国または県内全域を指定してください: ${recipe.id}`);
  }
  return { ...plan, sources };
}

export { productMetricKeys } from '@stats47/data-configs/product-metric-keys';
