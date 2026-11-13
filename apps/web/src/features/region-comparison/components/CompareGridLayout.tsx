import { Fragment, Suspense, type ReactNode } from "react";

import { ChartLoadingCard, type DashboardComponent, type DashboardComponentType } from "@/components/stat-charts";
import { DashboardComponentRenderer, computeSharedYDomain, type PageComponent } from "@/components/stat-charts/server";
import { resolveChartSourceLinks } from "@/components/stat-charts/utils/resolveChartSourceLinks";

import type { ComparisonRegion } from "../types";
import type { Area } from "@stats47/area";

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
    componentKey: comp.componentKey,
    componentType: comp.componentType,
    title: titlePrefix ? `${titlePrefix}の${comp.title}` : comp.title,
    componentProps: JSON.stringify({
      ...comp.componentProps,
      sourceLinks: resolveChartSourceLinks({
        rankingLink: comp.rankingLink,
        rankingLinks: comp.componentProps.rankingLinks,
      }),
    }),
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
  /**
   * 比較の行の真ん中の後に置く要素 (ページが組み立てる記事内広告。2026-11-13 オーナー決定)。行が 4 つ以上のときだけ出す
   * (前後に比較の行が 2 つ以上ずつ入り、最初の画面とページの最後の広告に隣り合わない)
   */
  middleInsert?: ReactNode;
}

/** middleInsert を出す行の数の下限 */
const MIDDLE_INSERT_MIN_ROWS = 4;

/**
 * 比較コンポーネントを地域ごとに左右に並べて描画するサーバーコンポーネント。
 * page_components → DashboardComponentRenderer パイプラインで描画。
 *
 * チャート系コンポーネントは選択中の全地域データから共有 Y 軸ドメインを事前算出し、
 * 東京と大阪など異なるスケールの地域でもグラフのスケールが揃う。
 */
export async function CompareGridLayout({ regions, components, middleInsert }: CompareGridLayoutProps) {
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
      {components.map((comp, index) => (
        <Fragment key={comp.componentKey}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {regions.map((region) => (
            <div
              key={`${comp.componentKey}-${region.areaCode}`}
              className="min-w-0"
            >
                <Suspense fallback={<ChartLoadingCard />}>
                  <DashboardComponentRenderer
                    component={pageComponentToDashboard(comp, region.areaName)}
                    area={toArea(region)}
                    sharedYDomain={yDomainMap.get(comp.componentKey)}
                  />
                </Suspense>
            </div>
          ))}
        </div>
        {middleInsert && components.length >= MIDDLE_INSERT_MIN_ROWS && index + 1 === Math.floor(components.length / 2) && middleInsert}
        </Fragment>
      ))}
    </>
  );
}
