"use client";

import { useMemo } from "react";

import Link from "next/link";

import { lookupArea } from "@stats47/area";
import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@stats47/components/atoms/ui/tabs";
import { MapPin } from "lucide-react";

import { KpiCardClient } from "@/features/stat-charts";

import { ThemeDbChartRenderer } from "./ThemeDbChartRenderer";

import type { ThemeConfig } from "../types";

interface Props {
  /** 選択中の都道府県コード（null なら全国） */
  selectedPrefectureCode: string | null;
  /** 現在選択中の指標キー（ランキングリンク用） */
  selectedIndicatorKey: string;
  /** テーマ設定（panelTabs 用） */
  themeConfig?: ThemeConfig;
  /** DB 管理チャート（page_components） */
  pageCharts?: import("@/features/stat-charts/services/load-page-components").PageComponent[];
  /** KPI カードの全都道府県データ（chartKey → areaCode → KpiCardClientProps） */
  kpiDataByArea?: Record<string, Record<string, import("@/features/stat-charts/components/cards/KpiCard/KpiCardClient").KpiCardClientProps>>;
}

/**
 * 都道府県統計パネル
 *
 * DB 管理の page_components（KPI カード + チャート）を表示。
 * 都道府県未選択時は全国（00000）のデータを表示する。
 */
export function PrefectureStatsPanel({
  selectedPrefectureCode,
  selectedIndicatorKey,
  themeConfig,
  pageCharts,
  kpiDataByArea,
}: Props) {
  const areaName = useMemo(() => {
    if (!selectedPrefectureCode) return "全国";
    return lookupArea(selectedPrefectureCode)?.areaName ?? "不明";
  }, [selectedPrefectureCode]);

  const areaCode = selectedPrefectureCode ?? "00000";
  const kpiCharts = pageCharts?.filter((c) => c.componentType === "kpi-card") ?? [];
  const hasDbKpis = kpiCharts.length > 0 && kpiDataByArea && Object.keys(kpiDataByArea).length > 0;

  return (
    <Card className="border border-border shadow-sm rounded-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <CardTitle className="text-lg">{areaName}</CardTitle>
        </div>
        {!selectedPrefectureCode && (
          <p className="text-xs text-muted-foreground mt-1">
            全国データを表示中。地図で都道府県を選択できます。
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI カード + チャート（panelTabs 対応） */}
        {hasDbKpis && themeConfig?.panelTabs ? (
          <Tabs defaultValue={themeConfig.panelTabs[0].label} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-0.5 p-0.5">
              {themeConfig.panelTabs.map((tab) => (
                <TabsTrigger key={tab.label} value={tab.label} className="text-xs px-2 py-1 flex-1 min-w-0">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {themeConfig.panelTabs.map((tab) => {
              const tabKpiCharts = kpiCharts.filter((c) => c.section === tab.label);
              const tabCharts = pageCharts?.filter((c) => c.section === tab.label && c.componentType !== "kpi-card") ?? [];
              return (
                <TabsContent key={tab.label} value={tab.label} className="mt-2 space-y-4">
                  {tabKpiCharts.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {tabKpiCharts.map((chart) => {
                        const kpiData = kpiDataByArea?.[chart.componentKey]?.[areaCode];
                        if (!kpiData) return null;
                        return <KpiCardClient key={chart.componentKey} {...kpiData} />;
                      })}
                    </div>
                  )}
                  {tabCharts.map((chart) => (
                    <div key={chart.componentKey}>
                      <h3 className="text-sm font-medium mb-2">{chart.title}</h3>
                      <ThemeDbChartRenderer
                        chart={chart}
                        prefCode={areaCode}
                        prefName={areaName}
                      />
                    </div>
                  ))}
                </TabsContent>
              );
            })}
          </Tabs>
        ) : hasDbKpis ? (
          <div className="grid grid-cols-2 gap-2">
            {kpiCharts.map((chart) => {
              const kpiData = kpiDataByArea?.[chart.componentKey]?.[areaCode];
              if (!kpiData) return null;
              return <KpiCardClient key={chart.componentKey} {...kpiData} />;
            })}
          </div>
        ) : null}

        {/* DB 管理チャート（section が null = トップレベル） */}
        {pageCharts
          ?.filter((c) => c.section === null && c.componentType !== "kpi-card")
          .map((chart) => (
            <div key={chart.componentKey} className="border-t border-border pt-3">
              <h3 className="text-sm font-medium mb-2">{chart.title}</h3>
              <ThemeDbChartRenderer
                chart={chart}
                prefCode={areaCode}
                prefName={areaName}
              />
            </div>
          ))}

        {/* リンク */}
        <div className="flex gap-3 pt-1">
          {selectedPrefectureCode && (
            <Link
              href={`/areas/${selectedPrefectureCode}`}
              className="text-xs text-primary hover:underline"
            >
              {areaName}の詳細 →
            </Link>
          )}
          <Link
            href={`/ranking/${selectedIndicatorKey}`}
            className="text-xs text-primary hover:underline"
          >
            全国ランキング →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
