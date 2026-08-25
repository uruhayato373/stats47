import { BarChart3 } from "lucide-react";

import { ChartPanel } from "@/components/charts/ChartPanel";
import { DashboardComponentRenderer, loadPageComponents, type PageComponent } from "@/components/stat-charts/server";
import { resolveChartSourceLinks } from "@/components/stat-charts/utils/resolveChartSourceLinks";

interface Props {
  areaCode: string;
  areaName: string;
}

/**
 * エリアページのチャートセクション
 *
 * page_components + page_component_assignments から DB 管理されたチャートを取得し、
 * DashboardComponentRenderer で描画する。
 */
export async function AreaChartSection({ areaCode, areaName }: Props) {
  const charts = await loadPageComponents("area", areaCode);
  if (charts.length === 0) return null;

  // section でグルーピング
  const sections = new Map<string, PageComponent[]>();
  for (const chart of charts) {
    const key = chart.section ?? "その他";
    const list = sections.get(key) ?? [];
    list.push(chart);
    sections.set(key, list);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{areaName}の統計チャート</h2>
      </div>

      {Array.from(sections.entries()).map(([sectionName, sectionCharts]) => (
        <ChartPanel
          key={sectionName}
          title={sectionName}
          titleClassName="text-base"
          contentClassName="space-y-4"
        >
            {sectionCharts.map((chart) => (
              <div key={chart.componentKey}>
                <DashboardComponentRenderer
                  component={{
                    id: chart.componentKey,
                    componentType: chart.componentType,
                    componentProps: JSON.stringify({
                      ...chart.componentProps,
                      sourceLinks: resolveChartSourceLinks({
                        rankingLink: chart.rankingLink,
                        rankingLinks: chart.componentProps.rankingLinks,
                      }),
                    }),
                    title: chart.title,
                    sortOrder: chart.sortOrder,
                    gridColumnSpan: chart.gridColumnSpan,
                    gridColumnSpanTablet: null,
                    gridColumnSpanSm: null,
                    gridColumnSpanMobile: null,
                    sourceName: chart.sourceName,
                    sourceLink: chart.sourceLink,
                    rankingLink: chart.rankingLink,
                    dataSource: null,
                  }}
                  area={{
                    areaCode,
                    areaName,
                    areaType: "prefecture",
                  }}
                />
              </div>
            ))}
        </ChartPanel>
      ))}
    </section>
  );
}
