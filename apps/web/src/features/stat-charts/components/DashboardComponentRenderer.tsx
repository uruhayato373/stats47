import React, { Suspense } from "react";

import { extractDashboardProps } from "../utils";

import { DefinitionsCard, KpiCard, KpiCardSkeleton, MultiStatCard, SlidePresentation, StatsTable } from "./cards";
import {
  AttributeMatrixDashboard,
  D3BarChartRaceDashboard,
  DashboardBarChart,
  DivergingBarChartDashboard,
  LineChart,
  MixedChartDashboard,
  PyramidChartDashboard,
  RadarChartDashboard,
  RankingChartDashboard,
  StackedAreaDashboard,
  SunburstDashboardChart,
  TreemapDashboardChart,
  CompositionChartDashboard,
} from "./charts";

import type { Area } from "@stats47/area";
import type {
  DashboardComponent,
  DashboardComponentType,
  DashboardItemProps,
} from "../types";

/**
 * componentType → React コンポーネントのレジストリ
 * 正規の componentType のみ登録。未登録は UnknownComponentPlaceholder に落とす。
 */
const COMPONENT_REGISTRY: Omit<Record<
  DashboardComponentType,
  React.ComponentType<DashboardItemProps<DashboardComponentType>>
>, 'kpi-card'> = {
  "line-chart": LineChart as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "bar-chart": DashboardBarChart as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "diverging-bar-chart": DivergingBarChartDashboard as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  sunburst: SunburstDashboardChart as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  treemap: TreemapDashboardChart as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "bar-chart-race": D3BarChartRaceDashboard as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "multi-stats-card": MultiStatCard as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "definitions-card": DefinitionsCard as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "slide-presentation": SlidePresentation as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "stats-table": StatsTable as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "mixed-chart": MixedChartDashboard as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "stacked-area": StackedAreaDashboard as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "radar-chart": RadarChartDashboard as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "attribute-matrix": AttributeMatrixDashboard as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "ranking-chart": RankingChartDashboard as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "pyramid-chart": PyramidChartDashboard as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
  "composition-chart": CompositionChartDashboard as React.ComponentType<DashboardItemProps<DashboardComponentType>>,
};

interface DashboardComponentRendererProps {
  component: DashboardComponent;
  area: Area;
  /** 比較ページで事前計算された共有 Y 軸ドメイン */
  sharedYDomain?: [number, number];
}

export const DashboardComponentRenderer: React.FC<
  DashboardComponentRendererProps
> = ({ component, area, sharedYDomain }) => {
  const type = component.componentType as DashboardComponentType;
  const { common, config } = extractDashboardProps(component, area);

  // 共有 Y 軸ドメインがあれば config に注入（チャートコンポーネントが優先的に使用）
  if (sharedYDomain && config && typeof config === "object") {
    (config as Record<string, unknown>).sharedYDomain = sharedYDomain;
  }

  if (type === 'kpi-card') {
    return (
      <Suspense fallback={<KpiCardSkeleton />}>
        <KpiCard common={common} config={config as DashboardItemProps<'kpi-card'>['config']} />
      </Suspense>
    )
  }

  const Component = COMPONENT_REGISTRY[type as keyof typeof COMPONENT_REGISTRY];

  if (!Component) {
    return (
      <UnknownComponentPlaceholder
        componentType={component.componentType}
        title={component.title}
      />
    );
  }

  return <Component common={common} config={config} />;
};

interface UnknownComponentPlaceholderProps {
  componentType: string;
  title?: string | null;
}

const UnknownComponentPlaceholder: React.FC<
  UnknownComponentPlaceholderProps
> = ({ componentType, title }) => (
  <div className="bg-muted/50 border border-dashed rounded-lg p-4">
    <p className="text-muted-foreground text-sm">
      未対応のコンポーネント: {componentType}
    </p>
    {title && (
      <p className="text-xs text-muted-foreground mt-1">{title}</p>
    )}
  </div>
);
