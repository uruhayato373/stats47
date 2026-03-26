import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { BarChart3 } from "lucide-react";

import { loadPageComponents, type PageComponent } from "@/features/stat-charts/services/load-page-components";
import { DashboardComponentRenderer } from "@/features/stat-charts/components/DashboardComponentRenderer";

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
        <Card key={sectionName} className="border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{sectionName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sectionCharts.map((chart) => (
              <div key={chart.componentKey}>
                <h3 className="text-sm font-medium mb-2">{chart.title}</h3>
                <DashboardComponentRenderer
                  component={{
                    id: chart.componentKey,
                    componentType: chart.componentType,
                    componentProps: JSON.stringify(chart.componentProps),
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
                  hideSource
                />
                {chart.sourceName && (
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    出典: {chart.sourceName}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
