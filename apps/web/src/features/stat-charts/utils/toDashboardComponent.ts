import type { ComparisonComponent } from "@stats47/database/server";
import type { DashboardComponent } from "../types";

export function toDashboardComponent(
  comp: ComparisonComponent,
  options?: { titlePrefix?: string }
): DashboardComponent {
  const prefix = options?.titlePrefix;
  return {
    id: comp.id,
    componentType: comp.componentType,
    title: prefix ? `${prefix}の${comp.title ?? ""}` : (comp.title ?? ""),
    componentProps: comp.componentProps,
    rankingLink: comp.rankingLink,
    sourceLink: comp.sourceLink,
    sourceName: comp.sourceName,
    dataSource: comp.dataSource,
    gridColumnSpan: comp.gridColumnSpan ?? null,
    gridColumnSpanTablet: comp.gridColumnSpanTablet ?? null,
    gridColumnSpanSm: comp.gridColumnSpanSm ?? null,
    gridColumnSpanMobile: null,
    sortOrder: comp.displayOrder ?? 0,
  };
}
