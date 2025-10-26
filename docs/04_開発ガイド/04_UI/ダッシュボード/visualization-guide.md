---
title: 可視化実装ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/dashboard
  - implementation
---

# 可視化実装ガイド

## 概要

このガイドでは、ダッシュボードドメインで使用する可視化コンポーネントの実装方法について説明します。RechartsとD3.jsを活用した、階層対応の可視化コンポーネントの作成方法を学習できます。

## 可視化コンポーネントの分類

### 1. 統計カード系
- **StatisticsMetricCard**: 単一指標の数値表示
- **ComparisonCard**: 比較データ付きカード
- **TrendCard**: トレンド表示付きカード

### 2. 時系列グラフ系
- **EstatLineChart**: 単一系列折れ線グラフ
- **EstatMultiLineChart**: 複数系列折れ線グラフ
- **EstatAreaChart**: エリアチャート
- **EstatBarChart**: 棒グラフ

### 3. 構成比グラフ系
- **EstatGenderDonutChart**: 男女比率円グラフ
- **EstatPopulationPyramid**: 人口ピラミッド
- **EstatPieChart**: 一般的な円グラフ
- **EstatDonutChart**: ドーナツチャート

### 4. 比較・ランキング系
- **StackedBarChart**: 積み上げ棒グラフ
- **RankingChart**: ランキング表示
- **ComparisonChart**: 比較グラフ

### 5. 地図系
- **PrefectureChoroplethMap**: 都道府県別コロプレス地図
- **MunicipalityChoroplethMap**: 市区町村別コロプレス地図
- **InteractiveMap**: インタラクティブ地図

## 統計カードコンポーネント

### 1. StatisticsMetricCard

```typescript
// src/components/dashboard/StatisticsMetricCard.tsx
import React from 'react';
import { useEstatData } from '@/hooks/useEstatData';
import { formatValue } from '@/infrastructure/utils/format';
import { TrendIndicator } from '@/components/common/TrendIndicator';
import { CardSkeleton } from '@/components/common/CardSkeleton';
import { CardError } from '@/components/common/CardError';

interface StatisticsMetricCardProps {
  params: {
    statsDataId: string;
    cdCat01: string;
  };
  areaCode: string;
  title: string;
  color: string;
  showComparison?: boolean;
  showTrend?: boolean;
  format?: 'number' | 'percentage' | 'currency';
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatisticsMetricCard: React.FC<StatisticsMetricCardProps> = ({
  params,
  areaCode,
  title,
  color,
  showComparison = true,
  showTrend = true,
  format = 'number',
  unit,
  size = 'md'
}) => {
  const { data, loading, error } = useEstatData(params, areaCode);
  
  if (loading) return <CardSkeleton size={size} />;
  if (error) return <CardError error={error} size={size} />;
  
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };
  
  return (
    <div className={`
      bg-white dark:bg-neutral-800 
      rounded-lg border border-gray-200 dark:border-neutral-700 
      ${sizeClasses[size]} 
      transition-all duration-200
      hover:shadow-md hover:scale-105
    `}>
      <h3 className="text-sm font-medium text-gray-500 dark:text-neutral-400 mb-2">
        {title}
      </h3>
      <div className="flex items-baseline justify-between">
        <div className={`font-bold ${textSizeClasses[size]}`} style={{ color }}>
          {formatValue(data.value, format)}
          {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
        </div>
        {showTrend && data.previousValue && (
          <TrendIndicator
            current={data.value}
            previous={data.previousValue}
            format={format}
            size={size}
          />
        )}
      </div>
      {showComparison && data.previousValue && (
        <div className="mt-2 text-sm text-gray-500">
          {formatComparison(data.value, data.previousValue, format)}
        </div>
      )}
    </div>
  );
};
```

### 2. ComparisonCard

```typescript
// src/components/dashboard/ComparisonCard.tsx
import React from 'react';
import { useEstatData } from '@/hooks/useEstatData';
import { formatValue, calculateComparison } from '@/infrastructure/utils/format';

interface ComparisonCardProps {
  params: {
    statsDataId: string;
    cdCat01: string;
  };
  areaCode: string;
  compareAreaCode: string;
  title: string;
  color: string;
  format?: 'number' | 'percentage' | 'currency';
  unit?: string;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  params,
  areaCode,
  compareAreaCode,
  title,
  color,
  format = 'number',
  unit
}) => {
  const { data: currentData } = useEstatData(params, areaCode);
  const { data: compareData } = useEstatData(params, compareAreaCode);
  
  const comparison = calculateComparison(currentData.value, compareData.value);
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-neutral-400 mb-2">
        {title}
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">現在の地域</span>
          <span className="font-semibold" style={{ color }}>
            {formatValue(currentData.value, format)}
            {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">比較対象</span>
          <span className="text-gray-600">
            {formatValue(compareData.value, format)}
            {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">差</span>
          <div className="flex items-center">
            <span className={`font-semibold ${comparison.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {comparison.isPositive ? '+' : ''}{formatValue(comparison.difference, format)}
              {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
            </span>
            <span className="text-xs text-gray-500 ml-1">
              ({comparison.percentage}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 時系列グラフコンポーネント

### 1. EstatLineChart

```typescript
// src/components/dashboard/EstatLineChart.tsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useEstatTimeSeriesData } from '@/hooks/useEstatTimeSeriesData';
import { formatNumber } from '@/infrastructure/utils/format';
import { ChartSkeleton } from '@/components/common/ChartSkeleton';
import { ChartError } from '@/components/common/ChartError';

interface EstatLineChartProps {
  params: {
    statsDataId: string;
    cdCat01: string;
  };
  areaCode: string;
  title: string;
  years: string[];
  color?: string;
  showDataPoints?: boolean;
  showGrid?: boolean;
  height?: number;
  showLegend?: boolean;
}

export const EstatLineChart: React.FC<EstatLineChartProps> = ({
  params,
  areaCode,
  title,
  years,
  color = '#8884d8',
  showDataPoints = true,
  showGrid = true,
  height = 300,
  showLegend = false
}) => {
  const { data, loading, error } = useEstatTimeSeriesData(params, areaCode, years);
  
  if (loading) return <ChartSkeleton height={height} />;
  if (error) return <ChartError error={error} height={height} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={showGrid ? 0.3 : 0} />
          <XAxis 
            dataKey="year" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#666' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#666' }}
            tickFormatter={formatNumber}
          />
          <Tooltip 
            formatter={(value: any) => [formatNumber(value), title]}
            labelFormatter={(label) => `${label}年`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            dot={showDataPoints ? { r: 4 } : false}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### 2. EstatMultiLineChart

```typescript
// src/components/dashboard/EstatMultiLineChart.tsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useEstatMultiTimeSeriesData } from '@/hooks/useEstatMultiTimeSeriesData';
import { formatNumber } from '@/infrastructure/utils/format';
import { ChartSkeleton } from '@/components/common/ChartSkeleton';
import { ChartError } from '@/components/common/ChartError';

interface EstatMultiLineChartProps {
  params: {
    statsDataId: string;
    cdCat01: string[];
  };
  areaCode: string;
  title: string;
  years: string[];
  series: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  height?: number;
  showLegend?: boolean;
}

export const EstatMultiLineChart: React.FC<EstatMultiLineChartProps> = ({
  params,
  areaCode,
  title,
  years,
  series,
  height = 300,
  showLegend = true
}) => {
  const { data, loading, error } = useEstatMultiTimeSeriesData(params, areaCode, years);
  
  if (loading) return <ChartSkeleton height={height} />;
  if (error) return <ChartError error={error} height={height} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={formatNumber} />
          <Tooltip 
            formatter={(value: any, name: string) => [
              formatNumber(value), 
              series.find(s => s.key === name)?.name || name
            ]}
            labelFormatter={(label) => `${label}年`}
          />
          {showLegend && <Legend />}
          {series.map(serie => (
            <Line
              key={serie.key}
              type="monotone"
              dataKey={serie.key}
              name={serie.name}
              stroke={serie.color}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

## 構成比グラフコンポーネント

### 1. EstatGenderDonutChart

```typescript
// src/components/dashboard/EstatGenderDonutChart.tsx
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { useEstatGenderData } from '@/hooks/useEstatGenderData';
import { formatNumber } from '@/infrastructure/utils/format';
import { ChartSkeleton } from '@/components/common/ChartSkeleton';
import { ChartError } from '@/components/common/ChartError';

interface EstatGenderDonutChartProps {
  params: {
    statsDataId: string;
  };
  areaCode: string;
  maleCategoryCode: string;
  femaleCategoryCode: string;
  title: string;
  width?: number;
  height?: number;
  showLegend?: boolean;
}

export const EstatGenderDonutChart: React.FC<EstatGenderDonutChartProps> = ({
  params,
  areaCode,
  maleCategoryCode,
  femaleCategoryCode,
  title,
  width = 300,
  height = 300,
  showLegend = true
}) => {
  const { data, loading, error } = useEstatGenderData(
    params, 
    areaCode, 
    maleCategoryCode, 
    femaleCategoryCode
  );
  
  if (loading) return <ChartSkeleton width={width} height={height} />;
  if (error) return <ChartError error={error} width={width} height={height} />;
  
  const chartData = [
    { name: '男性', value: data.male, color: '#3b82f6' },
    { name: '女性', value: data.female, color: '#ec4899' }
  ];
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      <div className="flex justify-center">
        <ResponsiveContainer width={width} height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [
                `${formatNumber(value)}人 (${((value / data.total) * 100).toFixed(1)}%)`,
                '人数'
              ]}
            />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
```

### 2. EstatPopulationPyramid

```typescript
// src/components/dashboard/EstatPopulationPyramid.tsx
import React from 'react';
import { useEstatPopulationPyramidData } from '@/hooks/useEstatPopulationPyramidData';
import { PopulationPyramidChart } from '@/components/charts/PopulationPyramidChart';
import { ChartSkeleton } from '@/components/common/ChartSkeleton';
import { ChartError } from '@/components/common/ChartError';

interface EstatPopulationPyramidProps {
  params: {
    statsDataId: string;
  };
  areaCode: string;
  title: string;
  width?: number;
  height?: number;
  showLegend?: boolean;
}

export const EstatPopulationPyramid: React.FC<EstatPopulationPyramidProps> = ({
  params,
  areaCode,
  title,
  width = 600,
  height = 400,
  showLegend = true
}) => {
  const { data, loading, error } = useEstatPopulationPyramidData(params, areaCode);
  
  if (loading) return <ChartSkeleton width={width} height={height} />;
  if (error) return <ChartError error={error} width={width} height={height} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      <div className="flex justify-center">
        <PopulationPyramidChart
          data={data}
          width={width}
          height={height}
          showLegend={showLegend}
        />
      </div>
    </div>
  );
};
```

## 比較・ランキングコンポーネント

### 1. StackedBarChart

```typescript
// src/components/dashboard/StackedBarChart.tsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { formatNumber } from '@/infrastructure/utils/format';

interface StackedBarChartProps {
  data: Array<{
    name: string;
    [key: string]: any;
  }>;
  title: string;
  series: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  height?: number;
  horizontal?: boolean;
  showLegend?: boolean;
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data,
  title,
  series,
  height = 300,
  horizontal = false,
  showLegend = true
}) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {horizontal ? (
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={formatNumber} />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip formatter={(value: any) => [formatNumber(value), '']} />
            {showLegend && <Legend />}
            {series.map(serie => (
              <Bar
                key={serie.key}
                dataKey={serie.key}
                name={serie.name}
                stackId="a"
                fill={serie.color}
              />
            ))}
          </BarChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatNumber} />
            <Tooltip formatter={(value: any) => [formatNumber(value), '']} />
            {showLegend && <Legend />}
            {series.map(serie => (
              <Bar
                key={serie.key}
                dataKey={serie.key}
                name={serie.name}
                stackId="a"
                fill={serie.color}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
```

### 2. RankingChart

```typescript
// src/components/dashboard/RankingChart.tsx
import React from 'react';
import { formatNumber } from '@/infrastructure/utils/format';

interface RankingChartProps {
  data: Array<{
    name: string;
    value: number;
    rank: number;
    color?: string;
  }>;
  title: string;
  maxItems?: number;
  showValues?: boolean;
  showPercentages?: boolean;
}

export const RankingChart: React.FC<RankingChartProps> = ({
  data,
  title,
  maxItems = 10,
  showValues = true,
  showPercentages = true
}) => {
  const displayData = data.slice(0, maxItems);
  const maxValue = Math.max(...displayData.map(item => item.value));
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-2">
        {displayData.map((item, index) => (
          <div key={item.name} className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-500 w-6">
              {item.rank}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{item.name}</span>
                {showValues && (
                  <span className="text-sm text-gray-600">
                    {formatNumber(item.value)}
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || '#3b82f6'
                  }}
                />
              </div>
              {showPercentages && (
                <div className="text-xs text-gray-500 mt-1">
                  {((item.value / maxValue) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 地図コンポーネント

### 1. PrefectureChoroplethMap

```typescript
// src/components/dashboard/PrefectureChoroplethMap.tsx
import React, { useState } from 'react';
import { ChoroplethMap } from '@/components/maps/ChoroplethMap';
import { MapLegend } from '@/components/maps/MapLegend';
import { formatNumber } from '@/infrastructure/utils/format';

interface PrefectureChoroplethMapProps {
  data: Array<{
    prefectureCode: string;
    value: number;
    name: string;
  }>;
  title: string;
  metric: string;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple';
  height?: number;
  showLegend?: boolean;
}

export const PrefectureChoroplethMap: React.FC<PrefectureChoroplethMapProps> = ({
  data,
  title,
  metric,
  colorScheme = 'blue',
  height = 400,
  showLegend = true
}) => {
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="relative">
        <ChoroplethMap
          data={data}
          metric={metric}
          colorScheme={colorScheme}
          height={height}
          onPrefectureClick={setSelectedPrefecture}
          selectedPrefecture={selectedPrefecture}
        />
        {showLegend && (
          <MapLegend
            data={data}
            metric={metric}
            colorScheme={colorScheme}
            position="bottom-right"
          />
        )}
        {selectedPrefecture && (
          <div className="absolute top-4 left-4 bg-white dark:bg-neutral-800 border rounded-lg p-3 shadow-lg">
            <h4 className="font-semibold">
              {data.find(item => item.prefectureCode === selectedPrefecture)?.name}
            </h4>
            <p className="text-sm text-gray-600">
              {metric}: {formatNumber(
                data.find(item => item.prefectureCode === selectedPrefecture)?.value || 0
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 2. MunicipalityChoroplethMap

```typescript
// src/components/dashboard/MunicipalityChoroplethMap.tsx
import React, { useState } from 'react';
import { MunicipalityMap } from '@/components/maps/MunicipalityMap';
import { MapLegend } from '@/components/maps/MapLegend';
import { formatNumber } from '@/infrastructure/utils/format';

interface MunicipalityChoroplethMapProps {
  prefectureCode: string;
  data: Array<{
    municipalityCode: string;
    value: number;
    name: string;
  }>;
  title: string;
  metric: string;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple';
  height?: number;
  showLegend?: boolean;
}

export const MunicipalityChoroplethMap: React.FC<MunicipalityChoroplethMapProps> = ({
  prefectureCode,
  data,
  title,
  metric,
  colorScheme = 'blue',
  height = 400,
  showLegend = true
}) => {
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-50 dark:hover:bg-neutral-700"
          >
            -
          </button>
          <span className="px-2 py-1 text-sm">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-50 dark:hover:bg-neutral-700"
          >
            +
          </button>
        </div>
      </div>
      
      <div className="relative overflow-hidden">
        <MunicipalityMap
          prefectureCode={prefectureCode}
          data={data}
          metric={metric}
          colorScheme={colorScheme}
          height={height}
          zoomLevel={zoomLevel}
          onMunicipalityClick={setSelectedMunicipality}
          selectedMunicipality={selectedMunicipality}
        />
        
        {showLegend && (
          <MapLegend
            data={data}
            metric={metric}
            colorScheme={colorScheme}
            position="bottom-right"
          />
        )}
        
        {selectedMunicipality && (
          <div className="absolute top-4 left-4 bg-white dark:bg-neutral-800 border rounded-lg p-3 shadow-lg">
            <h4 className="font-semibold">
              {data.find(item => item.municipalityCode === selectedMunicipality)?.name}
            </h4>
            <p className="text-sm text-gray-600">
              {metric}: {formatNumber(
                data.find(item => item.municipalityCode === selectedMunicipality)?.value || 0
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
```

## 共通ユーティリティ

### 1. フォーマット関数

```typescript
// src/infrastructure/utils/format.ts
export function formatValue(value: number | null, format: string): string {
  if (value === null || value === undefined) return 'データなし';
  
  switch (format) {
    case 'number':
      return value.toLocaleString();
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return `¥${value.toLocaleString()}`;
    default:
      return value.toString();
  }
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function calculateComparison(current: number, previous: number) {
  const difference = current - previous;
  const percentage = previous !== 0 ? (difference / previous) * 100 : 0;
  
  return {
    difference,
    percentage: Math.abs(percentage).toFixed(1),
    isPositive: difference >= 0
  };
}

export function formatComparison(current: number, previous: number, format: string): string {
  const comparison = calculateComparison(current, previous);
  const formattedDifference = formatValue(comparison.difference, format);
  
  return `前年比: ${comparison.isPositive ? '+' : ''}${formattedDifference} (${comparison.percentage}%)`;
}
```

### 2. トレンドインジケーター

```typescript
// src/components/common/TrendIndicator.tsx
import React from 'react';
import { calculateComparison } from '@/infrastructure/utils/format';

interface TrendIndicatorProps {
  current: number;
  previous: number;
  format: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TrendIndicator({ 
  current, 
  previous, 
  format, 
  size = 'md' 
}: TrendIndicatorProps) {
  const comparison = calculateComparison(current, previous);
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  return (
    <div className={`flex items-center ${sizeClasses[size]} ${
      comparison.isPositive ? 'text-green-600' : 'text-red-600'
    }`}>
      {comparison.isPositive ? '↗' : '↘'}
      <span className="ml-1">
        {comparison.percentage}%
      </span>
    </div>
  );
}
```

## テスト

### 1. コンポーネントテスト

```typescript
// StatisticsMetricCard.test.tsx
import { render, screen } from '@testing-library/react';
import { StatisticsMetricCard } from './StatisticsMetricCard';

describe('StatisticsMetricCard', () => {
  const mockProps = {
    params: { statsDataId: '0000010101', cdCat01: 'A1101' },
    areaCode: '00000',
    title: '総人口',
    color: '#4f46e5'
  };
  
  it('should render title and value', () => {
    render(<StatisticsMetricCard {...mockProps} />);
    
    expect(screen.getByText('総人口')).toBeInTheDocument();
    expect(screen.getByText('データなし')).toBeInTheDocument();
  });
  
  it('should show trend indicator when data is available', () => {
    // モックデータの設定
    render(<StatisticsMetricCard {...mockProps} />);
    
    // トレンドインジケーターの確認
  });
});
```

### 2. フックテスト

```typescript
// useEstatData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useEstatData } from './useEstatData';

describe('useEstatData', () => {
  it('should fetch data successfully', async () => {
    const { result } = renderHook(() => 
      useEstatData({ statsDataId: '0000010101', cdCat01: 'A1101' }, '00000')
    );
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeDefined();
  });
});
```

## まとめ

可視化実装ガイドでは、以下の内容を説明しました：

1. **コンポーネント分類**: 統計カード、時系列グラフ、構成比グラフ、比較・ランキング、地図
2. **実装パターン**: 各コンポーネントの実装方法とベストプラクティス
3. **共通ユーティリティ**: フォーマット関数やトレンドインジケーター
4. **テスト**: コンポーネントとフックのテスト方法

これらの実装により、階層対応の可視化コンポーネントを効率的に開発し、ユーザーが直感的に統計データを理解できるダッシュボードを構築できます。
