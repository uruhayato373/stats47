import React, { Suspense } from "react";

import { DashboardComponentRenderer } from "./DashboardComponentRenderer";
import { ChartSkeleton } from "./shared/ChartSkeleton";

import type { DashboardComponent } from "../types";
import type { Area } from "@stats47/area";

/**
 * コンポーネントタイプ別のデフォルトグリッド幅
 * コンテナ幅に対応（@container クエリ、tailwind.config.ts で定義）
 *   @lg : コンテナ幅 >= 1024px（64rem）
 *   @md : コンテナ幅 >= 768px（48rem）
 *   @sm : コンテナ幅 >= 480px（30rem）
 *   base: コンテナ幅 <  480px
 */
const GRID_DEFAULTS: Record<string, { lg: number; md: number; sm: number; xs: number }> = {
  "kpi-card":           { lg: 3,  md: 6,  sm: 6,  xs: 12 },
  "line-chart":         { lg: 6,  md: 6,  sm: 12, xs: 12 },
  "bar-chart":          { lg: 6,  md: 6,  sm: 12, xs: 12 },
  "sunburst":           { lg: 6,  md: 6,  sm: 12, xs: 12 },
  "treemap":            { lg: 6,  md: 6,  sm: 12, xs: 12 },
  "bar-chart-race":     { lg: 6,  md: 12, sm: 12, xs: 12 },
  "multi-stats-card":   { lg: 4,  md: 6,  sm: 12, xs: 12 },
  "definitions-card":   { lg: 12, md: 12, sm: 6,  xs: 6  },
  "slide-presentation": { lg: 6,  md: 12, sm: 12, xs: 12 },
  "stats-table":        { lg: 6,  md: 6,  sm: 12, xs: 12 },
};

const GRID_FALLBACK = { lg: 4, md: 6, sm: 12, xs: 12 };

interface DashboardGridLayoutProps {
  area: Area;
  components?: DashboardComponent[];
}

export const DashboardGridLayout: React.FC<DashboardGridLayoutProps> = ({
  area,
  components = [],
}) => {
  if (components.length === 0) {
    return (
      <div className="@container grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              ダッシュボードコンポーネントがまだ設定されていません。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container grid grid-cols-12 gap-4">
      {components.map((component) => {
        // コンポーネントタイプ別デフォルト → DB個別設定で上書き
        const defaults = GRID_DEFAULTS[component.componentType] || GRID_FALLBACK;

        const colSpanLg = component.gridColumnSpan ?? defaults.lg;
        const colSpanMd = component.gridColumnSpanTablet ?? defaults.md;
        const colSpanSm = component.gridColumnSpanSm ?? defaults.sm;
        const colSpanXs = component.gridColumnSpanMobile ?? defaults.xs;

        return (
          <div
            key={component.id}
            className={`col-span-${colSpanXs} @sm:col-span-${colSpanSm} @md:col-span-${colSpanMd} @lg:col-span-${colSpanLg}`}
          >
            <Suspense fallback={<ChartSkeleton />}>
              <DashboardComponentRenderer
                component={component}
                area={area}
              />
            </Suspense>
          </div>
        );
      })}
    </div>
  );
};
