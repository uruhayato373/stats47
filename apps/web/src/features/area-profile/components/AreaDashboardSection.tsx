import type { Area } from "@stats47/area";
import type { Category } from "@stats47/category";
import { getComparisonRepository } from "@stats47/database/server";
import { isOk } from "@stats47/types";
import { logger } from "@/lib/logger";
import { DashboardGridLayout } from "@/features/stat-charts";
import { toDashboardComponent } from "@/features/stat-charts/server";
import { loadPageCharts } from "@/features/stat-charts/services/load-page-charts";
import type { DashboardComponent } from "@/features/stat-charts/types";
import { Suspense } from "react";
import { CityRankingPreview } from "./CityRankingPreview";

interface Props {
  area: Area;
  categoryKey: string;
  categories: Category[];
  basePath?: string;
  selectedRankingKey?: string;
}

export async function AreaDashboardSection({ area, categoryKey, categories, basePath, selectedRankingKey }: Props) {
  const result = await getComparisonRepository().listComponentsByCategory(
    categoryKey,
    area.areaType === "national" ? undefined : area.areaType
  );
  if (!isOk(result)) {
    logger.error({ error: result.error, categoryKey, areaType: area.areaType }, "AreaDashboardSection: コンポーネント取得失敗");
    return (
      <section className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            データの読み込みに失敗しました。時間を置いて再度お試しください。
          </p>
        </div>
      </section>
    );
  }
  const components = result.data;

  // KPI は comparison_components から取得（変更なし）
  const kpiComponents = components
    .filter((c) => c.componentType === "kpi-card" || c.componentType === "multi-stats-card" || c.componentType === "stats-table" || c.componentType === "definitions-card" || c.componentType === "slide-presentation")
    .map((c) => toDashboardComponent(c));

  // チャートは chart_definitions (Single Source of Truth) から取得
  const pageCharts = await loadPageCharts("area-category", categoryKey);
  const dashboardComponents: DashboardComponent[] = pageCharts.map((c) => {
    // エリア単独ページでは sync モードを auto に切替
    const props = { ...c.componentProps };
    const yAxisConfig = props.yAxisConfig as { mode?: string } | undefined;
    if (yAxisConfig?.mode === "sync") {
      props.yAxisConfig = { ...yAxisConfig, mode: "auto" };
    }
    return {
      id: c.chartKey,
      componentType: c.componentType,
      componentProps: JSON.stringify(props),
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
    };
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
