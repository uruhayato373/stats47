---
title: 動的ダッシュボード実装計画（モックデータ版）
created: 2025-10-28
updated: 2025-10-28
tags:
  - 実装計画
  - ダッシュボード
  - shadcn/ui
  - モックデータ
related:
  - subcategory-dashboard-architecture.md
---

# 動的ダッシュボード実装計画（モックデータ版）

## 1. 概要

`subcategory-dashboard-architecture.md` の設計に基づき、shadcn/UIのchartコンポーネントを使用してモックデータで動的ダッシュボードのプロトタイプを構築します。

### 1.1 実装スコープ

**Phase 0: プロトタイプ実装（本計画）**
- shadcn/ui chartコンポーネントの導入
- モックデータを使用した基本ウィジェットの実装
- 動的ダッシュボードシステムのコア機能の実装
- サンプルページでの動作確認

**対象外（将来実装）**
- D1データベース連携
- R2ストレージ連携
- 実データの取得（Ranking API、e-Stat API）
- 管理UI

## 2. 技術スタック

### 2.1 使用ライブラリ

| ライブラリ | 用途 | バージョン |
|-----------|------|-----------|
| Next.js | フレームワーク | 既存 |
| React | UIライブラリ | 既存 |
| TypeScript | 型安全性 | 既存 |
| shadcn/ui | UIコンポーネント | 既存 |
| **recharts** | **チャートライブラリ** | **導入必要** |

### 2.2 shadcn/ui chartについて

shadcn/uiのchartコンポーネントは内部でrechartsを使用しています。
- 公式ドキュメント: https://ui.shadcn.com/docs/components/chart
- サポートするチャートタイプ:
  - Line Chart（折れ線グラフ）
  - Bar Chart（棒グラフ）
  - Area Chart（エリアチャート）
  - Pie Chart（円グラフ）
  - Radar Chart（レーダーチャート）
  - Radial Chart（放射状チャート）

## 3. ディレクトリ構造

```
src/
├── components/
│   ├── atoms/
│   │   └── ui/
│   │       └── chart.tsx                    # [新規] shadcn/ui chart
│   ├── organisms/
│   │   └── dashboard/
│   │       ├── DynamicDashboard.tsx         # [新規] メインコンポーネント
│   │       ├── DashboardLayout.tsx          # [新規] レイアウトコンポーネント
│   │       ├── DashboardSkeleton.tsx        # [新規] ローディング表示
│   │       ├── DashboardError.tsx           # [新規] エラー表示
│   │       ├── WidgetRenderer.tsx           # [新規] ウィジェット描画
│   │       └── widgets/
│   │           ├── MetricCardWidget.tsx     # [新規] メトリックカード
│   │           ├── ChartWidget.tsx          # [新規] チャートウィジェット
│   │           ├── LineChartWidget.tsx      # [新規] 折れ線グラフ
│   │           ├── BarChartWidget.tsx       # [新規] 棒グラフ
│   │           ├── AreaChartWidget.tsx      # [新規] エリアチャート
│   │           └── index.ts                 # [新規] エクスポート
│   └── pages/
│       └── subcategories/
│           └── _dynamic-sample/             # [新規] サンプルディレクトリ
│               └── DynamicSampleDashboard.tsx
├── types/
│   └── dashboard/
│       ├── config.ts                        # [新規] 型定義
│       ├── widget.ts                        # [新規] 型定義
│       └── layout.ts                        # [新規] 型定義
└── lib/
    └── dashboard/
        ├── mock-data.ts                     # [新規] モックデータ
        └── widget-registry.ts               # [新規] ウィジェット登録
```

## 4. 実装ステップ

### Step 1: 環境準備

#### 1.1 shadcn/ui chartコンポーネントのインストール

```bash
# shadcn/ui chartコンポーネントを追加
npx shadcn@latest add chart

# rechartsが自動的にインストールされます
# package.jsonに以下が追加されます:
# - recharts
# - recharts-react-wrapper (shadcn/uiが使用)
```

**確認事項:**
- `src/components/atoms/ui/chart.tsx` が作成されること
- `package.json` に `recharts` が追加されること

#### 1.2 TypeScript型定義ファイルの作成

必要な型定義を準備します。

---

### Step 2: 型定義の実装

#### 2.1 ダッシュボード設定の型（`src/types/dashboard/config.ts`）

```typescript
/**
 * ダッシュボードの設定型定義
 */

export type AreaType = 'national' | 'prefecture';

export type LayoutType = 'grid' | 'stacked' | 'custom';

/**
 * ダッシュボードの基本設定
 */
export interface DashboardConfig {
  id: number;
  subcategoryId: string;
  areaType: AreaType;
  layoutType: LayoutType;
  version: number;
  isActive: boolean;
}

/**
 * レイアウトのグリッド設定
 */
export interface GridConfig {
  columns: number;
  gap: string;
  responsive?: {
    mobile?: { columns: number };
    tablet?: { columns: number };
    desktop?: { columns: number };
  };
}

/**
 * レイアウトセクション
 */
export interface LayoutSection {
  id: string;
  title?: string;
  gridArea?: string;
  widgetSlots: number;
}

/**
 * レイアウトテンプレート
 */
export interface LayoutTemplate {
  version: string;
  layoutType: LayoutType;
  gridConfig?: GridConfig;
  sections: LayoutSection[];
}
```

#### 2.2 ウィジェットの型（`src/types/dashboard/widget.ts`）

```typescript
/**
 * ウィジェットの型定義
 */

export type WidgetType = 'metric' | 'chart' | 'table' | 'map' | 'custom';

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'radar' | 'radial';

export type DataSourceType = 'ranking' | 'estat' | 'custom' | 'mock';

/**
 * ウィジェットの位置情報
 */
export interface WidgetPosition {
  row: number;
  col: number;
  width: number;
  height: number;
}

/**
 * メトリックカードの設定
 */
export interface MetricCardConfig {
  title: string;
  unit: string;
  icon?: string;
  color?: string;
  showTrend?: boolean;
  showComparison?: boolean;
  decimalPlaces?: number;
  formatting?: {
    thousandsSeparator?: boolean;
    prefix?: string;
    suffix?: string;
  };
}

/**
 * チャートウィジェットの設定
 */
export interface ChartConfig {
  title: string;
  description?: string;
  chartType: ChartType;
  showGrid?: boolean;
  showLegend?: boolean;
  xAxisKey: string;
  yAxisKey: string;
  colorScheme?: string;
  height?: number;
}

/**
 * ウィジェット定義
 */
export interface DashboardWidget {
  id: number;
  dashboardConfigId: number;
  widgetType: WidgetType;
  widgetKey: string;
  position: WidgetPosition;
  config: MetricCardConfig | ChartConfig | Record<string, any>;
  dataSourceType: DataSourceType;
  dataSourceKey: string;
  displayOrder: number;
  isVisible: boolean;
}

/**
 * ウィジェットのデータ
 */
export interface MetricData {
  value: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
}

export interface ChartDataPoint {
  [key: string]: string | number;
}

export type WidgetData = MetricData | ChartDataPoint[] | any;
```

#### 2.3 レイアウトの型（`src/types/dashboard/layout.ts`）

```typescript
/**
 * レイアウトの型定義
 */

export type ResponsiveBreakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveConfig {
  breakpoint: ResponsiveBreakpoint;
  columns: number;
  gap?: string;
}

export interface LayoutProps {
  layoutType: string;
  children: React.ReactNode;
  className?: string;
}
```

---

### Step 3: モックデータの実装

#### 3.1 モックデータファイル（`src/lib/dashboard/mock-data.ts`）

```typescript
/**
 * ダッシュボードのモックデータ
 */

import {
  DashboardConfig,
  DashboardWidget,
  LayoutTemplate,
  MetricData,
  ChartDataPoint,
} from '@/types/dashboard';

/**
 * サンプルダッシュボード設定
 */
export const mockDashboardConfig: DashboardConfig = {
  id: 1,
  subcategoryId: 'dynamic-sample',
  areaType: 'national',
  layoutType: 'grid',
  version: 1,
  isActive: true,
};

/**
 * グリッドレイアウトテンプレート
 */
export const mockLayoutTemplate: LayoutTemplate = {
  version: '1.0',
  layoutType: 'grid',
  gridConfig: {
    columns: 3,
    gap: '1rem',
    responsive: {
      mobile: { columns: 1 },
      tablet: { columns: 2 },
      desktop: { columns: 3 },
    },
  },
  sections: [
    {
      id: 'metrics',
      title: '主要指標',
      gridArea: '1 / 1 / 2 / 4',
      widgetSlots: 3,
    },
    {
      id: 'charts',
      title: 'データ推移',
      gridArea: '2 / 1 / 3 / 4',
      widgetSlots: 2,
    },
  ],
};

/**
 * サンプルウィジェット定義
 */
export const mockDashboardWidgets: DashboardWidget[] = [
  // メトリックカード 1
  {
    id: 1,
    dashboardConfigId: 1,
    widgetType: 'metric',
    widgetKey: 'total-population',
    position: { row: 0, col: 0, width: 1, height: 1 },
    config: {
      title: '総人口',
      unit: '万人',
      icon: 'Users',
      color: 'blue',
      showTrend: true,
      decimalPlaces: 1,
    },
    dataSourceType: 'mock',
    dataSourceKey: 'population-total',
    displayOrder: 1,
    isVisible: true,
  },
  // メトリックカード 2
  {
    id: 2,
    dashboardConfigId: 1,
    widgetType: 'metric',
    widgetKey: 'birth-rate',
    position: { row: 0, col: 1, width: 1, height: 1 },
    config: {
      title: '出生率',
      unit: '‰',
      icon: 'TrendingUp',
      color: 'green',
      showTrend: true,
      decimalPlaces: 2,
    },
    dataSourceType: 'mock',
    dataSourceKey: 'birth-rate',
    displayOrder: 2,
    isVisible: true,
  },
  // メトリックカード 3
  {
    id: 3,
    dashboardConfigId: 1,
    widgetType: 'metric',
    widgetKey: 'aging-rate',
    position: { row: 0, col: 2, width: 1, height: 1 },
    config: {
      title: '高齢化率',
      unit: '%',
      icon: 'Activity',
      color: 'orange',
      showTrend: true,
      decimalPlaces: 1,
    },
    dataSourceType: 'mock',
    dataSourceKey: 'aging-rate',
    displayOrder: 3,
    isVisible: true,
  },
  // 折れ線グラフ
  {
    id: 4,
    dashboardConfigId: 1,
    widgetType: 'chart',
    widgetKey: 'population-trend',
    position: { row: 1, col: 0, width: 2, height: 1 },
    config: {
      title: '人口推移',
      description: '過去10年間の人口推移',
      chartType: 'line',
      showGrid: true,
      showLegend: true,
      xAxisKey: 'year',
      yAxisKey: 'population',
      colorScheme: 'blue',
      height: 300,
    },
    dataSourceType: 'mock',
    dataSourceKey: 'population-trend',
    displayOrder: 4,
    isVisible: true,
  },
  // 棒グラフ
  {
    id: 5,
    dashboardConfigId: 1,
    widgetType: 'chart',
    widgetKey: 'age-distribution',
    position: { row: 1, col: 2, width: 1, height: 1 },
    config: {
      title: '年齢別人口分布',
      chartType: 'bar',
      showGrid: true,
      showLegend: false,
      xAxisKey: 'ageGroup',
      yAxisKey: 'count',
      colorScheme: 'green',
      height: 300,
    },
    dataSourceType: 'mock',
    dataSourceKey: 'age-distribution',
    displayOrder: 5,
    isVisible: true,
  },
];

/**
 * ウィジェット用モックデータ
 */
export const mockWidgetData: Record<string, any> = {
  // メトリックデータ
  'population-total': {
    value: 12580.3,
    previousValue: 12710.5,
    trend: 'down',
    changePercent: -1.02,
  } as MetricData,

  'birth-rate': {
    value: 6.8,
    previousValue: 7.0,
    trend: 'down',
    changePercent: -2.86,
  } as MetricData,

  'aging-rate': {
    value: 29.1,
    previousValue: 28.6,
    trend: 'up',
    changePercent: 1.75,
  } as MetricData,

  // チャートデータ：人口推移
  'population-trend': [
    { year: '2014', population: 12710 },
    { year: '2015', population: 12680 },
    { year: '2016', population: 12650 },
    { year: '2017', population: 12620 },
    { year: '2018', population: 12600 },
    { year: '2019', population: 12590 },
    { year: '2020', population: 12580 },
    { year: '2021', population: 12570 },
    { year: '2022', population: 12560 },
    { year: '2023', population: 12550 },
  ] as ChartDataPoint[],

  // チャートデータ：年齢別分布
  'age-distribution': [
    { ageGroup: '0-14歳', count: 1520 },
    { ageGroup: '15-64歳', count: 7450 },
    { ageGroup: '65歳以上', count: 3610 },
  ] as ChartDataPoint[],
};

/**
 * モックデータを取得する関数
 */
export function getMockWidgetData(dataSourceKey: string): any {
  return mockWidgetData[dataSourceKey] || null;
}

/**
 * ダッシュボード設定を取得する関数（モック）
 */
export async function getMockDashboardConfig(
  subcategoryId: string,
  areaType: 'national' | 'prefecture'
): Promise<{
  config: DashboardConfig;
  widgets: DashboardWidget[];
  layout: LayoutTemplate;
}> {
  // 実際のAPIコールをシミュレート
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    config: mockDashboardConfig,
    widgets: mockDashboardWidgets,
    layout: mockLayoutTemplate,
  };
}
```

---

### Step 4: ウィジェットコンポーネントの実装

#### 4.1 メトリックカードウィジェット（`src/components/organisms/dashboard/widgets/MetricCardWidget.tsx`）

```typescript
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MetricData, MetricCardConfig } from '@/types/dashboard';

interface MetricCardWidgetProps {
  data: MetricData;
  config: MetricCardConfig;
}

export function MetricCardWidget({ data, config }: MetricCardWidgetProps) {
  const {
    title,
    unit,
    color = 'blue',
    showTrend = true,
    decimalPlaces = 0,
    formatting,
  } = config;

  const { value, previousValue, trend, changePercent } = data;

  // 値のフォーマット
  const formattedValue = formatting?.thousandsSeparator
    ? value.toLocaleString('ja-JP', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })
    : value.toFixed(decimalPlaces);

  // トレンドアイコン
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // 色のマッピング
  const colorClass = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    teal: 'text-teal-600',
  }[color] || 'text-blue-600';

  const trendColorClass =
    trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>
          {formatting?.prefix}
          {formattedValue}
          {formatting?.suffix}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{unit}</p>

        {showTrend && changePercent !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trendColorClass}`}>
            <TrendIcon className="w-3 h-3" />
            <span>
              {Math.abs(changePercent).toFixed(1)}% 前年比
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 4.2 折れ線グラフウィジェット（`src/components/organisms/dashboard/widgets/LineChartWidget.tsx`）

```typescript
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/atoms/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/atoms/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartDataPoint } from '@/types/dashboard';

interface LineChartWidgetProps {
  data: ChartDataPoint[];
  config: ChartConfig;
}

export function LineChartWidget({ data, config }: LineChartWidgetProps) {
  const {
    title,
    description,
    showGrid = true,
    showLegend = true,
    xAxisKey,
    yAxisKey,
    height = 300,
  } = config;

  const chartConfig = {
    [yAxisKey]: {
      label: title,
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey={yAxisKey}
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

#### 4.3 棒グラフウィジェット（`src/components/organisms/dashboard/widgets/BarChartWidget.tsx`）

```typescript
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/atoms/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/atoms/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartDataPoint } from '@/types/dashboard';

interface BarChartWidgetProps {
  data: ChartDataPoint[];
  config: ChartConfig;
}

export function BarChartWidget({ data, config }: BarChartWidgetProps) {
  const {
    title,
    description,
    showGrid = true,
    xAxisKey,
    yAxisKey,
    height = 300,
  } = config;

  const chartConfig = {
    [yAxisKey]: {
      label: title,
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey={yAxisKey}
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

#### 4.4 エリアチャートウィジェット（`src/components/organisms/dashboard/widgets/AreaChartWidget.tsx`）

```typescript
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/atoms/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/atoms/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartDataPoint } from '@/types/dashboard';

interface AreaChartWidgetProps {
  data: ChartDataPoint[];
  config: ChartConfig;
}

export function AreaChartWidget({ data, config }: AreaChartWidgetProps) {
  const {
    title,
    description,
    showGrid = true,
    xAxisKey,
    yAxisKey,
    height = 300,
  } = config;

  const chartConfig = {
    [yAxisKey]: {
      label: title,
      color: 'hsl(var(--chart-3))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey={yAxisKey}
                stroke="hsl(var(--chart-3))"
                fill="hsl(var(--chart-3))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

#### 4.5 ウィジェットのindex（`src/components/organisms/dashboard/widgets/index.ts`）

```typescript
export { MetricCardWidget } from './MetricCardWidget';
export { LineChartWidget } from './LineChartWidget';
export { BarChartWidget } from './BarChartWidget';
export { AreaChartWidget } from './AreaChartWidget';
```

---

### Step 5: ウィジェットレンダラーの実装

#### 5.1 WidgetRenderer（`src/components/organisms/dashboard/WidgetRenderer.tsx`）

```typescript
'use client';

import React from 'react';
import { DashboardWidget, WidgetData } from '@/types/dashboard';
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
        return <MetricCardWidget data={data} config={config} />;

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
```

---

### Step 6: レイアウトコンポーネントの実装

#### 6.1 DashboardLayout（`src/components/organisms/dashboard/DashboardLayout.tsx`）

```typescript
'use client';

import React from 'react';
import { LayoutTemplate } from '@/types/dashboard';

interface DashboardLayoutProps {
  layout: LayoutTemplate;
  children: React.ReactNode;
}

export function DashboardLayout({ layout, children }: DashboardLayoutProps) {
  const { gridConfig } = layout;

  if (!gridConfig) {
    return <div className="space-y-4">{children}</div>;
  }

  return (
    <div
      className="dashboard-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
        gap: gridConfig.gap,
      }}
    >
      {children}
    </div>
  );
}
```

#### 6.2 DashboardSkeleton（`src/components/organisms/dashboard/DashboardSkeleton.tsx`）

```typescript
'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/atoms/ui/card';
import { Skeleton } from '@/components/atoms/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* メトリックカードのスケルトン */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* チャートのスケルトン */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### 6.3 DashboardError（`src/components/organisms/dashboard/DashboardError.tsx`）

```typescript
'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/atoms/ui/alert';
import { AlertCircle } from 'lucide-react';

interface DashboardErrorProps {
  error: Error;
}

export function DashboardError({ error }: DashboardErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>エラーが発生しました</AlertTitle>
      <AlertDescription>
        ダッシュボードの読み込みに失敗しました。
        <br />
        {error.message}
      </AlertDescription>
    </Alert>
  );
}
```

---

### Step 7: メインコンポーネントの実装

#### 7.1 DynamicDashboard（`src/components/organisms/dashboard/DynamicDashboard.tsx`）

```typescript
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
```

---

### Step 8: サンプルページの作成

#### 8.1 サンプルダッシュボードページ（`src/components/pages/subcategories/_dynamic-sample/DynamicSampleDashboard.tsx`）

```typescript
'use client';

import React from 'react';
import { DynamicDashboard } from '@/components/organisms/dashboard/DynamicDashboard';

export const DynamicSampleDashboard: React.FC<{ areaCode: string }> = ({ areaCode }) => {
  return (
    <div>
      <DynamicDashboard
        subcategoryId="dynamic-sample"
        areaCode={areaCode}
        areaType={areaCode === '00000' ? 'national' : 'prefecture'}
      />
    </div>
  );
};
```

---

## 5. 実装順序

### タスクリスト

1. **環境準備**
   - [ ] shadcn/ui chartコンポーネントのインストール
   - [ ] rechartsの確認

2. **型定義の作成**
   - [ ] `src/types/dashboard/config.ts` 作成
   - [ ] `src/types/dashboard/widget.ts` 作成
   - [ ] `src/types/dashboard/layout.ts` 作成

3. **モックデータの作成**
   - [ ] `src/lib/dashboard/mock-data.ts` 作成
   - [ ] モックデータの動作確認

4. **ウィジェットコンポーネントの実装**
   - [ ] `MetricCardWidget.tsx` 実装
   - [ ] `LineChartWidget.tsx` 実装
   - [ ] `BarChartWidget.tsx` 実装
   - [ ] `AreaChartWidget.tsx` 実装
   - [ ] `widgets/index.ts` 作成

5. **レイアウトコンポーネントの実装**
   - [ ] `DashboardLayout.tsx` 実装
   - [ ] `DashboardSkeleton.tsx` 実装
   - [ ] `DashboardError.tsx` 実装

6. **コアコンポーネントの実装**
   - [ ] `WidgetRenderer.tsx` 実装
   - [ ] `DynamicDashboard.tsx` 実装

7. **サンプルページの作成**
   - [ ] `DynamicSampleDashboard.tsx` 作成
   - [ ] Next.jsルーティングとの統合

8. **テストと動作確認**
   - [ ] ローカル環境での動作確認
   - [ ] レスポンシブデザインの確認
   - [ ] エラーハンドリングの確認

---

## 6. 動作確認方法

### 6.1 開発サーバーの起動

```bash
npm run dev:mock
```

### 6.2 確認URL

サンプルページにアクセスして動作を確認します：

```
http://localhost:3000/[適切なルート]/dynamic-sample/national
```

### 6.3 確認ポイント

1. **メトリックカード**
   - 3つのメトリックカードが正しく表示されるか
   - トレンド情報（前年比）が表示されるか
   - 数値のフォーマットが正しいか

2. **チャート**
   - 折れ線グラフが正しく表示されるか
   - 棒グラフが正しく表示されるか
   - ツールチップが機能するか
   - レスポンシブデザインが機能するか

3. **レイアウト**
   - グリッドレイアウトが正しく機能するか
   - モバイル、タブレット、デスクトップで適切に表示されるか

4. **エラーハンドリング**
   - ローディング状態が正しく表示されるか
   - エラー時に適切なメッセージが表示されるか

---

## 7. 次のステップ（将来実装）

### Phase 1: データベース連携

1. D1マイグレーションファイルの作成
2. DashboardResolverの実装
3. API Routesの実装

### Phase 2: データソース統合

1. Ranking APIとの連携
2. e-Stat APIとの連携
3. キャッシュ戦略の実装

### Phase 3: R2ストレージ連携

1. レイアウトテンプレートのR2保存
2. ウィジェットテンプレートのR2保存
3. テンプレート管理機能

### Phase 4: 管理UI

1. ダッシュボード設定管理画面
2. ウィジェット配置エディター
3. ドラッグ&ドロップ機能

### Phase 5: 全体移行

1. 既存ダッシュボードからのデータ抽出
2. 段階的移行スクリプトの作成
3. 旧コンポーネントの削除

---

## 8. まとめ

この実装計画により、以下を実現します：

### 8.1 実装成果物

- ✅ shadcn/ui chartコンポーネントを使用したチャート表示
- ✅ モックデータによる動的ダッシュボードの動作確認
- ✅ 型安全な実装
- ✅ 再利用可能なウィジェットシステム
- ✅ レスポンシブデザイン対応

### 8.2 設計の検証

この実装により、`subcategory-dashboard-architecture.md` で提案された設計の以下の点を検証できます：

1. **ウィジェットシステムの有効性**
   - 汎用的なウィジェットコンポーネントで多様なダッシュボードを構築可能か
   - ウィジェット追加時の拡張性

2. **データ駆動アプローチの妥当性**
   - 設定データによるダッシュボード生成が効率的か
   - 保守性の向上が期待できるか

3. **パフォーマンス**
   - チャートライブラリのパフォーマンスは許容範囲か
   - レンダリング速度は問題ないか

### 8.3 今後の展開

プロトタイプの成功を確認後、以下の順序で本番実装に進みます：

1. D1データベースとの統合
2. 実データソースとの連携
3. パイロット移行（3-5サブカテゴリ）
4. 全体移行と旧コンポーネント削除

---

## 関連ドキュメント

- [サブカテゴリダッシュボード効率化設計](./subcategory-dashboard-architecture.md)
- [shadcn/ui Chart ドキュメント](https://ui.shadcn.com/docs/components/chart)
- [Recharts ドキュメント](https://recharts.org/)
