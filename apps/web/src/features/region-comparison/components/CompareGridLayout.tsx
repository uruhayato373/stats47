import { Suspense } from "react";

import { ChartSkeleton } from "@/features/stat-charts";
import { DashboardComponentRenderer, computeSharedYDomain, toDashboardComponent } from "@/features/stat-charts/server";
import type { Area } from "@stats47/area";
import type { ComparisonComponent } from "@stats47/database/server";
import type { DashboardComponentType } from "@/features/stat-charts";

import type { ComparisonRegion } from "../types";

function toArea(region: ComparisonRegion): Area {
  return {
    areaCode: region.areaCode,
    areaName: region.areaName,
    areaType: "prefecture",
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
  components: ComparisonComponent[];
}

/**
 * 比較コンポーネントを地域ごとに左右に並べて描画するサーバーコンポーネント。
 * DB の comparison_components → DashboardComponentRenderer パイプラインで描画。
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
      const config = comp.componentProps ? JSON.parse(comp.componentProps) as Record<string, unknown> : {};
      const domain = await computeSharedYDomain(
        comp.componentType as DashboardComponentType,
        config,
        areaCodes,
      );
      return { id: comp.id, domain };
    }),
  );

  for (const { id, domain } of domains) {
    if (domain) yDomainMap.set(id, domain);
  }

  return (
    <>
      {components.map((comp) => (
        <div key={comp.id} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {regions.map((region) => (
            <div
              key={`${comp.id}-${region.areaCode}`}
              className="overflow-hidden rounded-lg border"
              style={{ borderColor: `${region.color}33` }}
            >
                <Suspense fallback={<ChartSkeleton />}>
                  <DashboardComponentRenderer
                    component={toDashboardComponent(comp, { titlePrefix: region.areaName })}
                    area={toArea(region)}
                    sharedYDomain={yDomainMap.get(comp.id)}
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
