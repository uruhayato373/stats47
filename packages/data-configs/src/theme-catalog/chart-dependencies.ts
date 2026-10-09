import { parseStatSeriesRefs, validateChartProps, type StatSeriesRef } from './stat-series-ref';
import type { CatalogChart, CatalogComponentType } from './types';
import { getMetricConfig } from '../registry';
import { buildRecipe } from '../recipe';

export interface ChartDependencies {
  componentKey: string;
  componentType: CatalogComponentType;
  metricRefs: StatSeriesRef[];
}

/** Every data chart reads registered metric IDs. Unknown recipes fail closed. */
export function collectChartDependencies(chart: CatalogChart): ChartDependencies {
  const props = chart.componentProps ?? {};
  const errors = validateChartProps(chart.componentType, props);
  if (errors.length) throw new Error(`${chart.componentKey}: ${errors.join('; ')}`);
  const fields = chart.componentType === 'mixed-chart' ? ['columnSeriesRefs', 'lineSeriesRefs'] : ['seriesRefs'];
  const metricRefs = fields.flatMap((field) => parseStatSeriesRefs(props[field]) ?? []);
  return { componentKey: chart.componentKey, componentType: chart.componentType, metricRefs };
}

export interface ThemeDependencySet {
  perChart: ChartDependencies[];
  totalMetricRefs: number;
  distinctMetricKeys: string[];
}
export function collectThemeDataDependencies(catalogs: Array<{ charts: CatalogChart[] }>): ThemeDependencySet {
  const perChart = catalogs.flatMap((catalog) => catalog.charts.map(collectChartDependencies));
  return { perChart, totalMetricRefs: perChart.reduce((sum, chart) => sum + chart.metricRefs.length, 0), distinctMetricKeys: [...new Set(perChart.flatMap((chart) => chart.metricRefs.map((ref) => ref.metricKey)))].sort() };
}
export interface MetricRefWithProvenance {
  metricKey: string;
  themeKey: string;
  componentKey: string;
  componentType: CatalogComponentType;
}
export interface ThemeDependencyProvenanceSet {
  distinctMetricRefs: MetricRefWithProvenance[];
  totalMetricRefs: number;
}
export function collectThemeDataDependenciesWithProvenance(catalogs: Record<string, { charts: CatalogChart[] }>): ThemeDependencyProvenanceSet {
  const metrics = new Map<string, MetricRefWithProvenance>();
  let totalMetricRefs = 0;
  for (const [themeKey, catalog] of Object.entries(catalogs)) for (const chart of catalog.charts) {
    for (const ref of collectChartDependencies(chart).metricRefs) {
      totalMetricRefs++;
      if (!metrics.has(ref.metricKey)) metrics.set(ref.metricKey, { metricKey: ref.metricKey, themeKey, componentKey: chart.componentKey, componentType: chart.componentType });
    }
  }
  return { totalMetricRefs, distinctMetricRefs: [...metrics.values()].sort((a, b) => a.metricKey.localeCompare(b.metricKey)) };
}
export interface ThemeDependencyMirror {
  generatedFrom: string;
  totalMetricRefs: number;
  distinctMetricRefs: number;
  metrics: Array<MetricRefWithProvenance & { expectedUnit: string; expectedConfigHash: string }>;
}
export function buildThemeDependencyMirror(catalogs: Record<string, { charts: CatalogChart[] }>): ThemeDependencyMirror {
  const { distinctMetricRefs, totalMetricRefs } = collectThemeDataDependenciesWithProvenance(catalogs);
  return { generatedFrom: 'collectThemeDataDependenciesWithProvenance(THEME_CATALOGS)', totalMetricRefs, distinctMetricRefs: distinctMetricRefs.length, metrics: distinctMetricRefs.map((ref) => {
    const config = getMetricConfig(ref.metricKey);
    if (!config) throw new Error('Unregistered metric: ' + ref.metricKey);
    return { ...ref, expectedUnit: config.unit, expectedConfigHash: buildRecipe(config).configHash };
  }) };
}
