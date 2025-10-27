'use client';

import React, { useEffect, useState } from 'react';
import {
  DashboardConfig,
  DashboardWidget,
  LayoutTemplate,
  WidgetData,
} from '@/types/dashboard';
import { getMockDashboardConfig, getMockWidgetData } from '@/lib/dashboard/mock-data';
import { DashboardLayout } from './DashboardLayout';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DashboardError } from './DashboardError';
import { WidgetRenderer } from './WidgetRenderer';

interface DynamicDashboardProps {
  subcategoryId: string;
  areaCode: string;
  areaType: 'national' | 'prefecture';
}

export function DynamicDashboard({
  subcategoryId,
  areaCode,
  areaType,
}: DynamicDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [layout, setLayout] = useState<LayoutTemplate | null>(null);
  const [widgetData, setWidgetData] = useState<Record<string, WidgetData>>({});

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        // 1. ダッシュボード設定を取得
        const dashboardData = await getMockDashboardConfig(subcategoryId, areaType);
        setConfig(dashboardData.config);
        setWidgets(dashboardData.widgets);
        setLayout(dashboardData.layout);

        // 2. 各ウィジェットのデータを取得
        const data: Record<string, WidgetData> = {};
        dashboardData.widgets.forEach((widget) => {
          const widgetData = getMockWidgetData(widget.dataSourceKey);
          if (widgetData) {
            data[widget.widgetKey] = widgetData;
          }
        });
        setWidgetData(data);

        setLoading(false);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError(err as Error);
        setLoading(false);
      }
    }

    loadDashboard();
  }, [subcategoryId, areaCode, areaType]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} />;
  }

  if (!config || !layout || widgets.length === 0) {
    return <div>ダッシュボード設定が見つかりません</div>;
  }

  return (
    <div className="dynamic-dashboard p-4">
      <DashboardLayout layout={layout}>
        {widgets
          .filter((widget) => widget.isVisible)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((widget) => (
            <WidgetRenderer
              key={widget.id}
              widget={widget}
              data={widgetData[widget.widgetKey]}
            />
          ))}
      </DashboardLayout>
    </div>
  );
}
