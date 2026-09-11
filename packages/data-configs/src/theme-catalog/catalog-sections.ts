import type { ThemeCatalog } from './types';

/** 章の参照切れ・二重配置・配置漏れを公開前に止める。 */
export function validateCatalogSections(catalog: ThemeCatalog): string[] {
  const errors: string[] = [];
  const sections = catalog.sections;
  if (!sections?.length) {
    return [`[section-missing] ${catalog.key}: 読者の問いに沿う sections が必要`];
  }
  const groups = new Set((catalog.metricGroups ?? []).map((group) => group.key));
  const charts = new Set(catalog.charts.map((chart) => chart.componentKey));
  const sectionKeys = new Set<string>();
  const assignedGroups = new Set<string>();
  const assignedCharts = new Set<string>();
  const assignedEmbedded = new Set<string>();
  const assign = (
    sectionKey: string,
    kind: string,
    keys: string[],
    known: Set<string> | undefined,
    assigned: Set<string>,
  ) => {
    for (const key of keys) {
      if (known && !known.has(key)) {
        errors.push(`[section-reference] ${catalog.key}/${sectionKey}: ${kind} "${key}" が同じテーマに不在`);
      }
      if (assigned.has(key)) {
        errors.push(`[section-duplicate] ${catalog.key}/${sectionKey}: ${kind} "${key}" を二重配置`);
      }
      assigned.add(key);
    }
  };
  for (const section of sections) {
    const where = `${catalog.key}/${section.key}`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(section.key)) {
      errors.push(`[section-key] ${where}: key は kebab-case にする`);
    }
    if (sectionKeys.has(section.key)) errors.push(`[section-key] ${where}: key が重複`);
    sectionKeys.add(section.key);
    if (!section.title.trim()) errors.push(`[section-title] ${where}: title は空にできない`);
    if (!section.metricGroupKeys.length && !section.chartKeys?.length && !section.embeddedSectionKeys?.length) {
      errors.push(`[section-empty] ${where}: 表示する指標・図・埋め込みが無い`);
    }
    assign(section.key, 'metricGroup', section.metricGroupKeys, groups, assignedGroups);
    assign(section.key, 'chart', section.chartKeys ?? [], charts, assignedCharts);
    assign(section.key, 'embedded', section.embeddedSectionKeys ?? [], undefined, assignedEmbedded);
  }
  for (const key of groups) {
    if (!assignedGroups.has(key)) errors.push(`[section-unassigned] ${catalog.key}: metricGroup "${key}" の章が未定義`);
  }
  for (const key of charts) {
    if (!assignedCharts.has(key)) errors.push(`[section-unassigned] ${catalog.key}: chart "${key}" の章が未定義`);
  }
  return errors;
}
