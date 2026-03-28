import { Suspense } from "react";

import { DashboardGridLayout } from "@/features/stat-charts";
import { loadPageComponents, type PageComponent } from "@/features/stat-charts/server";
import type { DashboardComponent } from "@/features/stat-charts/types";


import { CityRankingPreview } from "./CityRankingPreview";

import type { Area } from "@stats47/area";
import type { Category } from "@stats47/category";

interface Props {
  area: Area;
  categoryKey: string;
  categories: Category[];
  basePath?: string;
  selectedRankingKey?: string;
}

export async function AreaDashboardSection({ area, categoryKey, selectedRankingKey }: Props) {
  // loadPageComponents で KPI もチャートも一括取得
  // city の場合は city-category、prefecture の場合は area-category から取得
  const pageType = area.areaType === "city" ? "city-category" : "area-category";
  const allComponents = await loadPageComponents(pageType, categoryKey);

  // KPI とチャートを分離
  const kpiPageComponents = allComponents.filter(
    (c) => c.componentType === "kpi-card" || c.componentType === "attribute-matrix"
  );
  const chartPageComponents = allComponents.filter(
    (c) => c.componentType !== "kpi-card" && c.componentType !== "attribute-matrix"
  );

  const pageComponentToDashboard = (c: PageComponent, propsOverride?: Record<string, unknown>): DashboardComponent => ({
    id: c.componentKey,
    componentType: c.componentType,
    componentProps: JSON.stringify(propsOverride ?? c.componentProps),
    title: c.title,
    sortOrder: c.sortOrder,
    gridColumnSpan: c.gridColumnSpan,
    gridColumnSpanTablet: c.gridColumnSpanTablet,
    gridColumnSpanSm: c.gridColumnSpanSm,
    gridColumnSpanMobile: null,
    sourceName: c.sourceName,
    sourceLink: c.sourceLink,
    rankingLink: c.rankingLink,
    dataSource: c.dataSource,
  });

  const kpiComponents = kpiPageComponents.map((c) => pageComponentToDashboard(c));

  const dashboardComponents: DashboardComponent[] = chartPageComponents.map((c) => {
    // エリア単独ページでは sync モードを auto に切替
    const props = { ...c.componentProps };
    const yAxisConfig = props.yAxisConfig as { mode?: string } | undefined;
    if (yAxisConfig?.mode === "sync") {
      props.yAxisConfig = { ...yAxisConfig, mode: "auto" };
    }
    return pageComponentToDashboard(c, props);
  });

  return (
    <section className="space-y-6">
      {kpiComponents.length > 0 && (
        <DashboardGridLayout area={area} components={kpiComponents} />
      )}
      {dashboardComponents.length === 0 ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            このカテゴリのデータはまだ準備中です。
          </p>
        </div>
      ) : (
        <DashboardGridLayout area={area} components={dashboardComponents} />
      )}
      {area.areaType === "prefecture" && (
        <Suspense fallback={null}>
          <CityRankingPreview
            areaCode={area.areaCode}
            prefName={area.areaName}
            categoryKey={categoryKey}
            selectedRankingKey={selectedRankingKey}
          />
        </Suspense>
      )}
    </section>
  );
}
