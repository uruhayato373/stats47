'use client';

import { ResolvedDashboard } from '@/features/dashboard/services/dashboard-service';
import {
  DashboardConfig,
  DashboardWidget,
  LayoutTemplate,
  WidgetData,
} from '@/types/dashboard';
import { useEffect, useState } from 'react';
import { DashboardError } from './DashboardError';
import { DashboardLayout } from './DashboardLayout';
import { DashboardSkeleton } from './DashboardSkeleton';
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

        // 1. ダッシュボード設定を取得（API）
        const response = await fetch(
          `/api/dashboard/${subcategoryId}/${areaType}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
        }

        const dashboardData: ResolvedDashboard = await response.json();
        setConfig(dashboardData.config);
        setWidgets(dashboardData.widgets);
        setLayout(dashboardData.layout);

        // 2. 各ウィジェットのデータを取得（API）
        const data: Record<string, WidgetData> = {};
        const dataPromises = dashboardData.widgets.map(async (widget) => {
          try {
            const widgetResponse = await fetch(
              `/api/dashboard/widgets/${widget.widgetKey}/data?areaCode=${areaCode}`
            );
            if (widgetResponse.ok) {
              const widgetDataResult = await widgetResponse.json();
              data[widget.widgetKey] = widgetDataResult.data;
            }
          } catch (err) {
            console.error(
              `Failed to load widget data for ${widget.widgetKey}:`,
              err
            );
          }
        });

        await Promise.all(dataPromises);
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
