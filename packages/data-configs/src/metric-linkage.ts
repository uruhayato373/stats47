import { WELL_KNOWN_DENOMINATORS } from '../../../data/metrics/defaults/normalization';
import type { EstatSource, MetricConfig } from './types';
import type { MetricRecipe } from './recipe';
import { buildRecipe } from './recipe';

export interface MetricSourceReference {
  role: 'primary' | 'city' | 'supplemental' | 'history';
  statsDataId: string;
  filters: Record<string, string>;
  years?: readonly number[];
}

/** A table ID alone is not a metric: retain every pinned classification coordinate. */
export function metricSourceReferences(
  metric: MetricConfig
): MetricSourceReference[] {
  const refs: MetricSourceReference[] = [];
  function add(
    source: Pick<
      EstatSource,
      | 'statsDataId'
      | 'cdTab'
      | 'cdCat01'
      | 'cdCat02'
      | 'cdCat03'
      | 'cdCat04'
      | 'cdCat05'
    >,
    role: MetricSourceReference['role'],
    years?: readonly number[]
  ) {
    const filters: Record<string, string> = {};
    for (const key of [
      'cdTab',
      'cdCat01',
      'cdCat02',
      'cdCat03',
      'cdCat04',
      'cdCat05',
    ] as const) {
      if (source[key]) filters[key] = source[key];
    }
    refs.push({
      role,
      statsDataId: source.statsDataId,
      filters,
      ...(years ? { years } : {}),
    });
  }
  const params = buildRecipe(metric).estatParams;
  if (params) add(params, 'primary');
  if (metric.citySource) add(metric.citySource, 'city');
  for (const supplemental of metric.supplementalSources ?? [])
    add(supplemental.source, 'supplemental', supplemental.years);
  if (metric.source.kind === 'external') {
    const config = metric.source.config;
    const estat = config.estat;
    if (
      !params &&
      typeof estat === 'object' &&
      estat !== null &&
      'statsDataId' in estat &&
      typeof estat.statsDataId === 'string'
    )
      add({ ...estat, statsDataId: estat.statsDataId }, 'primary');
    if (!params && typeof config.statsDataId === 'string')
      add(
        {
          statsDataId: config.statsDataId,
          ...(typeof config.cdCat01 === 'string'
            ? { cdCat01: config.cdCat01 }
            : {}),
        },
        'primary'
      );
    const extraction = config.extraction;
    if (
      typeof extraction === 'object' &&
      extraction !== null &&
      'history' in extraction
    ) {
      const history = extraction.history;
      if (
        typeof history === 'object' &&
        history !== null &&
        'statsDataId' in history &&
        typeof history.statsDataId === 'string'
      )
        add({ ...history, statsDataId: history.statsDataId }, 'history');
    }
  }
  return refs;
}

export function metricDependencies(metric: MetricConfig): string[] {
  const keys = [
    metric.calculation?.numeratorKey,
    metric.calculation?.denominatorKey,
  ];
  if (metric.source.kind === 'calculated') {
    const formula = metric.source.formula;
    if ('numerator' in formula) keys.push(formula.numerator);
    if ('denominator' in formula) keys.push(formula.denominator);
    if ('left' in formula) keys.push(formula.left, formula.right);
    if (formula.op === 'per_population') keys.push('total-population');
  }
  return [...new Set(keys.filter((key): key is string => Boolean(key)))].sort();
}

export interface MetricLinkageEntry {
  metricKey: string;
  pageId: string | null;
  title: string;
  sources: MetricSourceReference[];
  recipe: MetricRecipe;
  dependencies: string[];
  normalizationDependencies: string[];
  consumers: { pageId: string; kind: string }[];
  themes: string[];
}
export interface MetricLinkageIndex {
  version: 1;
  entries: MetricLinkageEntry[];
}

export function metricNormalizationDependencies(
  metric: MetricConfig
): string[] {
  return [
    ...new Set(
      (metric.calculation?.normalizationOptions ?? []).flatMap((option) =>
        metric.entities.flatMap((entity) => {
          const spec = WELL_KNOWN_DENOMINATORS[option.type]?.[entity];
          return spec ? [spec.key] : [];
        })
      )
    ),
  ].sort();
}
