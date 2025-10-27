'use client';

import React from 'react';
import { DashboardWidget, WidgetData, MetricCardConfig } from '@/types/dashboard';
import {
  MetricCardWidget,
  LineChartWidget,
  BarChartWidget,
  AreaChartWidget,
} from './widgets';

interface WidgetRendererProps {
  widget: DashboardWidget;
  data: WidgetData;
}

export function WidgetRenderer({ widget, data }: WidgetRendererProps) {
  const { widgetType, config, position } = widget;

  // ウィジェットタイプに応じたコンポーネントを選択
  const renderWidget = () => {
    switch (widgetType) {
      case 'metric':
        return <MetricCardWidget data={data} config={config as MetricCardConfig} />;

      case 'chart':
        // チャートタイプに応じて分岐
        const chartConfig = config as any;
        switch (chartConfig.chartType) {
          case 'line':
            return <LineChartWidget data={data} config={chartConfig} />;
          case 'bar':
            return <BarChartWidget data={data} config={chartConfig} />;
          case 'area':
            return <AreaChartWidget data={data} config={chartConfig} />;
          default:
            return <div>Unknown chart type: {chartConfig.chartType}</div>;
        }

      default:
        return <div>Unknown widget type: {widgetType}</div>;
    }
  };

  return (
    <div
      className="widget-container"
      style={{
        gridRow: `${position.row + 1} / span ${position.height}`,
        gridColumn: `${position.col + 1} / span ${position.width}`,
      }}
    >
      {renderWidget()}
    </div>
  );
}
