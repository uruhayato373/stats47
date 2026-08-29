import type { JapanZueEvidenceItem, JapanZueLineageAudit } from "./types";

export type JapanZueLineageCatalogs = {
  metricKeys: ReadonlySet<string>;
  surveyIds: ReadonlySet<string>;
  themeSlugs: ReadonlySet<string>;
  categoryKeys: ReadonlySet<string>;
};

const PRODUCTION_RESOLUTIONS = new Set([
  "reuse-existing-metric",
  "new-metric",
  "combined-analysis",
  "context-only",
]);

export function auditJapanZueLineage(
  inventory: readonly JapanZueEvidenceItem[],
  catalogs: JapanZueLineageCatalogs,
): JapanZueLineageAudit {
  const missingMetricKeys: Array<{ id: string; key: string }> = [];
  const missingSurveyIds: Array<{ id: string; key: string }> = [];
  const missingThemeSlugs: Array<{ id: string; key: string }> = [];
  const missingCategoryKeys: Array<{ id: string; key: string }> = [];
  const orphanProductionIds: Array<{ id: string; reasons: string[] }> = [];

  for (const item of inventory) {
    for (const key of item.mapping?.metricKeys ?? []) {
      if (!catalogs.metricKeys.has(key)) missingMetricKeys.push({ id: item.id, key });
    }
    for (const key of item.mapping?.surveyIds ?? []) {
      if (!catalogs.surveyIds.has(key)) missingSurveyIds.push({ id: item.id, key });
    }
    for (const key of item.mapping?.themeSlugs ?? []) {
      if (!catalogs.themeSlugs.has(key)) missingThemeSlugs.push({ id: item.id, key });
    }
    if (item.mapping?.categoryKey && !catalogs.categoryKeys.has(item.mapping.categoryKey)) {
      missingCategoryKeys.push({ id: item.id, key: item.mapping.categoryKey });
    }
    if (!PRODUCTION_RESOLUTIONS.has(item.resolution)) continue;

    const reasons: string[] = [];
    const mappingCount =
      (item.mapping?.metricKeys?.length ?? 0) +
      (item.mapping?.surveyIds?.length ?? 0) +
      (item.mapping?.themeSlugs?.length ?? 0) +
      (item.mapping?.contentRoles?.length ?? 0) +
      (item.mapping?.categoryKey ? 1 : 0);
    if (mappingCount === 0) reasons.push("no-downstream-mapping");
    if (
      (item.resolution === "reuse-existing-metric" || item.resolution === "new-metric") &&
      (item.mapping?.metricKeys?.length ?? 0) === 0
    ) {
      reasons.push("metric-key-required");
    }
    if (
      item.resolution === "combined-analysis" &&
      (item.mapping?.themeSlugs?.length ?? 0) === 0 &&
      (item.mapping?.contentRoles?.length ?? 0) === 0
    ) {
      reasons.push("analysis-destination-required");
    }
    if (reasons.length > 0) orphanProductionIds.push({ id: item.id, reasons });
  }

  const sort = <T extends { id: string; key?: string }>(values: T[]): T[] =>
    values.sort((left, right) => left.id.localeCompare(right.id) || (left.key ?? "").localeCompare(right.key ?? ""));
  sort(missingMetricKeys);
  sort(missingSurveyIds);
  sort(missingThemeSlugs);
  sort(missingCategoryKeys);
  sort(orphanProductionIds);
  const isClean =
    missingMetricKeys.length === 0 &&
    missingSurveyIds.length === 0 &&
    missingThemeSlugs.length === 0 &&
    missingCategoryKeys.length === 0 &&
    orphanProductionIds.length === 0;
  return {
    missingMetricKeys,
    missingSurveyIds,
    missingThemeSlugs,
    missingCategoryKeys,
    orphanProductionIds,
    isClean,
  };
}
