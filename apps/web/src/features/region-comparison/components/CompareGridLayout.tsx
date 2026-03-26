import { Suspense } from "react";

import { ChartSkeleton } from "@/features/stat-charts";
import { DashboardComponentRenderer, computeSharedYDomain } from "@/features/stat-charts/server";
import type { Area } from "@stats47/area";
import type { PageComponent } from "@/features/stat-charts/services/load-page-components";
import type { DashboardComponent, DashboardComponentType } from "@/features/stat-charts";

import type { ComparisonRegion } from "../types";

function toArea(region: ComparisonRegion): Area {
  return {
    areaCode: region.areaCode,
    areaName: region.areaName,
    areaType: "prefecture",
  };
}

function pageComponentToDashboard(comp: PageComponent, titlePrefix?: string): DashboardComponent {
  return {
    id: comp.componentKey,
    componentType: comp.componentType,
    title: titlePrefix ? `${titlePrefix}の${comp.title}` : comp.title,
    componentProps: JSON.stringify(comp.componentProps),
    rankingLink: comp.rankingLink,
    sourceLink: comp.sourceLink,
    sourceName: comp.sourceName,
    dataSource: comp.dataSource,
    gridColumnSpan: comp.gridColumnSpan,
    gridColumnSpanTablet: comp.gridColumnSpanTablet,
    gridColumnSpanSm: comp.gridColumnSpanSm,
    gridColumnSpanMobile: null,
    sortOrder: comp.sortOrder,
  };
}

// ─── Y 軸ドメイン対象チャート ─────────────────────────────────

const CHART_TYPES_WITH_Y_AXIS = new Set<string>([
  "line-chart",
  "stacked-area",
  "diverging-bar-chart",
]);

// ─── メインコンポーネント ─────────────────────────────────────

interface CompareGridLayoutProps {
  regions: [ComparisonRegion, ComparisonRegion];
  components: PageComponent[];
}

/**
 * 比較コンポーネントを地域ごとに左右に並べて描画するサーバーコンポーネント。
 * page_components → DashboardComponentRenderer パイプラインで描画。
 *
 * チャート系コンポーネントは選択中の全地域データから共有 Y 軸ドメインを事前算出し、
 * 東京と大阪など異なるスケールの地域でもグラフのスケールが揃う。
 */
export async function CompareGridLayout({ regions, components }: CompareGridLayoutProps) {
  if (components.length === 0) return null;

  const areaCodes = regions.map((r) => r.areaCode);

  // チャート系コンポーネントの共有 Y 軸ドメインを並列で事前計算
  const yDomainMap = new Map<string, [number, number]>();
  const chartComps = components.filter((c) => CHART_TYPES_WITH_Y_AXIS.has(c.componentType));

  const domains = await Promise.all(
    chartComps.map(async (comp) => {
      const domain = await computeSharedYDomain(
        comp.componentType as DashboardComponentType,
        comp.componentProps,
        areaCodes,
      );
      return { id: comp.componentKey, domain };
    }),
  );

  for (const { id, domain } of domains) {
    if (domain) yDomainMap.set(id, domain);
  }

  return (
    <>
      {components.map((comp) => (
        <div key={comp.componentKey} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {regions.map((region) => (
            <div
              key={`${comp.componentKey}-${region.areaCode}`}
              className="overflow-hidden rounded-lg border"
              style={{ borderColor: `${region.color}33` }}
            >
                <Suspense fallback={<ChartSkeleton />}>
                  <DashboardComponentRenderer
                    component={pageComponentToDashboard(comp, region.areaName)}
                    area={toArea(region)}
                    sharedYDomain={yDomainMap.get(comp.componentKey)}
                    hideSource
                  />
                </Suspense>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
