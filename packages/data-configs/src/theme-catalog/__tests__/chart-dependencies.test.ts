import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { THEME_CATALOGS } from '../index';
import { getMetricConfig } from '../../registry';
import { buildRecipe } from '../../recipe';
import { buildThemeDependencyMirror, collectChartDependencies, collectThemeDataDependencies } from '../chart-dependencies';
import type { CatalogChart } from '../types';
const chart = (componentType: CatalogChart['componentType'], componentProps: CatalogChart['componentProps']): CatalogChart => ({ componentKey: 'fixture', componentType, componentProps, title: 'fixture', sortOrder: 0 });
describe('Theme charts depend exclusively on registered metric IDs', () => {
 it('every data chart has registered dependencies, including all pyramid series', () => {
  const dependencies = collectThemeDataDependencies(Object.values(THEME_CATALOGS));
  expect(dependencies.totalMetricRefs).toBe(162); expect(dependencies.distinctMetricKeys).toHaveLength(147);
  for (const row of dependencies.perChart) { expect(row).not.toHaveProperty('requests'); if (!['markdown-section', 'kpi-card'].includes(row.componentType)) expect(row.metricRefs.length).toBeGreaterThan(0); for (const ref of row.metricRefs) expect(getMetricConfig(ref.metricKey)).toBeDefined(); }
  expect(dependencies.perChart.find(row => row.componentType === 'pyramid-chart')?.metricRefs).toHaveLength(34);
 });
 it('fails on missing IDs or raw API coordinates instead of silently dropping dependencies', () => {
  expect(() => collectChartDependencies(chart('line-chart', { seriesRefs: [{ metricKey: 'missing-metric' }] }))).toThrow();
  expect(() => collectChartDependencies(chart('line-chart', { estatParams: [{ statsDataId: 'X' }] }))).toThrow();
  expect(() => collectChartDependencies(chart('line-chart', { seriesRefs: [{ metricKey: 'total-population' }], estatParams: [] }))).toThrow();
 });
 it('collects both sides of a mixed chart and preserves year/area selectors', () => {
  const dep = collectChartDependencies(chart('mixed-chart', { columnSeriesRefs: [{ metricKey: 'total-population', year: '2020', area: 'national' }], lineSeriesRefs: [{ metricKey: 'unemployment-rate' }] }));
  expect(dep.metricRefs).toEqual([{ metricKey: 'total-population', year: '2020', area: 'national' }, { metricKey: 'unemployment-rate' }]);
 });
 it('generates a fresh audit mirror with authoritative units and recipe hashes', () => {
  const mirror = buildThemeDependencyMirror(THEME_CATALOGS);
  const stored = JSON.parse(readFileSync(new URL('../../../../../.claude/scripts/audit/theme-chart-dependencies.generated.json', import.meta.url), 'utf8'));
  expect(stored).toEqual(mirror); expect(mirror).not.toHaveProperty('requests');
  for (const ref of mirror.metrics) { const metric = getMetricConfig(ref.metricKey)!; expect(ref.expectedUnit).toBe(metric.unit); expect(ref.expectedConfigHash).toBe(buildRecipe(metric).configHash); }
 });
});
