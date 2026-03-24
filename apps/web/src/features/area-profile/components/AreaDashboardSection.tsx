import type { Area } from "@stats47/area";
import type { Category } from "@stats47/category";
import { getComparisonRepository } from "@stats47/database/server";
import { isOk } from "@stats47/types";
import { logger } from "@/lib/logger";
import { DashboardGridLayout } from "@/features/stat-charts";
import { toDashboardComponent } from "@/features/stat-charts/server";
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

  // エリア単独ページでは sync モード（全都道府県スケール）を auto（自エリアスケール）に切替
  const allComponents = components.map((comp) => {
    if (comp.componentProps) {
      try {
        const props = JSON.parse(comp.componentProps) as Record<string, unknown>;
        const yAxisConfig = props.yAxisConfig as { mode?: string } | undefined;
        if (yAxisConfig?.mode === "sync") {
          props.yAxisConfig = { ...yAxisConfig, mode: "auto" };
          return toDashboardComponent({ ...comp, componentProps: JSON.stringify(props) });
        }
      } catch { /* ignore parse errors */ }
    }
    return toDashboardComponent(comp);
  });
  const kpiComponents = allComponents.filter((c) => c.componentType === "kpi-card");
  const dashboardComponents = allComponents.filter((c) => c.componentType !== "kpi-card");

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
