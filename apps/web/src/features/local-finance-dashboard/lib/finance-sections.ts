import type { CatalogSection } from '@stats47/data-configs/theme-catalog/types';

/** 実際に表示する専用ブロック。章の文言・順序は ThemeCatalog.sections が所有する。 */
export const LOCAL_FINANCE_EMBEDDED_KEYS = [
  'finance-overview',
  'finance-sustainability',
  'finance-flow',
] as const;

export type LocalFinanceEmbeddedKey = (typeof LOCAL_FINANCE_EMBEDDED_KEYS)[number];

/** The page sends dedicated blocks and generic metric chapters to their actual renderers. */
export function splitLocalFinanceSections(sections: readonly CatalogSection[]) {
  const dedicated = sections.filter((section) => section.embeddedSectionKeys?.length);
  const supplementary = sections.filter((section) => !section.embeddedSectionKeys?.length);
  const errors = validateLocalFinanceSections(dedicated);
  for (const section of supplementary) {
    if (!section.metricGroupKeys.length || section.chartKeys?.length) {
      errors.push(`${section.key}: 補足章には指標グループが必要で、汎用図は使用しない`);
    }
  }
  if (errors.length) throw new Error(errors.join('; '));
  return { dedicated, supplementary };
}

/** 専用画面が消費できない設定と、専用ブロックの配置漏れを止める。 */
export function validateLocalFinanceSections(sections: readonly CatalogSection[]): string[] {
  const errors: string[] = [];
  const keys = sections.flatMap((section) => section.embeddedSectionKeys ?? []);
  for (const section of sections) {
    if (section.metricGroupKeys.length || section.chartKeys?.length) {
      errors.push(`${section.key}: 地方財政は専用ブロックで表示するため metricGroupKeys / chartKeys は使用しない`);
    }
  }
  for (const key of LOCAL_FINANCE_EMBEDDED_KEYS) {
    if (keys.filter((value) => value === key).length !== 1) {
      errors.push(`${key}: 専用ブロックは一度だけ配置する`);
    }
  }
  for (const key of keys) {
    if (!LOCAL_FINANCE_EMBEDDED_KEYS.some((known) => known === key)) {
      errors.push(`${key}: 地方財政に対応する専用ブロックがない`);
    }
  }
  return errors;
}
