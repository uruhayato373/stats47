---
title: Recharts共通実装パターン
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - implementation
---

# Recharts共通実装パターン

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: Rechartsを使用した可視化の共通実装パターン

---

## 概要

このドキュメントは、Rechartsを使用した可視化コンポーネントの共通実装パターンをまとめています。一貫性のある実装と保守性の向上を目的とします。

## 共通コンポーネント

### 1. チャートコンテナ

```typescript
// src/components/charts/recharts/common/ChartContainer.tsx

import React from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
  height?: number;
  aspect?: number;
}

export function ChartContainer({ 
  title, 
  subtitle, 
  children, 
  className = "",
  loading = false,
  error,
  height = 400,
  aspect = 2
}: ChartContainerProps) {
  if (loading) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="chart-loading">
          <div className="spinner" />
          <p>データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="chart-error">
          <p>エラーが発生しました: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chart-container ${className}`}>
      {(title || subtitle) && (
        <div className="chart-header">
          {title && <h3 className="chart-title">{title}</h3>}
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

### 2. カスタムツールチップ

```typescript
// src/components/charts/recharts/common/CustomTooltip.tsx

import React from 'react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string) => [string, string];
  labelFormatter?: (label: string) => string;
}

export function CustomTooltip({ 
  active, 
  payload, 
  label, 
  formatter,
  labelFormatter 
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;
  const formattedLabel = labelFormatter ? labelFormatter(label || '') : label;

  return (
    <div className="recharts-tooltip">
      <div className="tooltip-header">
        {formattedLabel}
      </div>
      <div className="tooltip-content">
        {payload.map((entry, index) => {
          const [formattedValue, formattedName] = formatter 
            ? formatter(entry.value, entry.name)
            : [entry.value.toLocaleString(), entry.name];
            
          return (
            <div key={index} className="tooltip-item">
              <span 
                className="tooltip-color" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="tooltip-name">{formattedName}:</span>
              <span className="tooltip-value">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 3. カスタム凡例

```typescript
// src/components/charts/recharts/common/CustomLegend.tsx

import React from 'react';

interface CustomLegendProps {
  payload?: any[];
  onClick?: (data: any) => void;
}

export function CustomLegend({ payload, onClick }: CustomLegendProps) {
  if (!payload || !payload.length) {
    return null;
  }

  return (
    <div className="recharts-legend">
      {payload.map((entry, index) => (
        <div 
          key={index}
          className="legend-item"
          onClick={() => onClick?.(entry)}
        >
          <span 
            className="legend-color"
            style={{ backgroundColor: entry.color }}
          />
          <span className="legend-text">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
```

### 4. カスタムラベル

```typescript
// src/components/charts/recharts/common/CustomLabel.tsx

import React from 'react';

interface CustomLabelProps {
  x?: number;
  y?: number;
  value?: any;
  index?: number;
  payload?: any;
  formatter?: (value: any) => string;
}

export function CustomLabel({ 
  x, 
  y, 
  value, 
  index, 
  payload, 
  formatter 
}: CustomLabelProps) {
  if (value === undefined || value === null) {
    return null;
  }

  const displayValue = formatter ? formatter(value) : value.toLocaleString();

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      className="custom-label"
    >
      {displayValue}
    </text>
  );
}
```

## 共通フック

### 1. チャートデータフック

```typescript
// src/hooks/useChartData.ts

import { useMemo } from 'react';

interface UseChartDataOptions {
  sortBy?: 'value' | 'name' | 'rank' | 'none';
  sortOrder?: 'asc' | 'desc';
  maxItems?: number;
  filter?: (item: any) => boolean;
}

export function useChartData<T>(
  data: T[],
  options: UseChartDataOptions = {}
) {
  const processedData = useMemo(() => {
    let result = [...data];

    // フィルタリング
    if (options.filter) {
      result = result.filter(options.filter);
    }

    // ソート
    if (options.sortBy && options.sortBy !== 'none') {
      result.sort((a, b) => {
        const aValue = (a as any)[options.sortBy!];
        const bValue = (b as any)[options.sortBy!];
        
        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        return options.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // 表示件数制限
    if (options.maxItems) {
      result = result.slice(0, options.maxItems);
    }

    return result;
  }, [data, options]);

  return processedData;
}
```

### 2. チャート設定フック

```typescript
// src/hooks/useChartConfig.ts

import { useMemo } from 'react';
import { ChartTheme } from '@/infrastructure/visualization/recharts/theme';

interface UseChartConfigOptions {
  colorScheme?: string;
  showValues?: boolean;
  showLegend?: boolean;
  animation?: boolean;
  height?: number;
}

export function useChartConfig(options: UseChartConfigOptions = {}) {
  const config = useMemo(() => ({
    colorScheme: options.colorScheme || 'category10',
    showValues: options.showValues ?? true,
    showLegend: options.showLegend ?? true,
    animation: options.animation ?? true,
    height: options.height || 400,
    colors: ChartTheme.scales[options.colorScheme || 'category10'],
    margin: {
      top: 20,
      right: 30,
      left: 20,
      bottom: 5
    }
  }), [options]);

  return config;
}
```

### 3. レスポンシブフック

```typescript
// src/hooks/useResponsiveChart.ts

import { useState, useEffect } from 'react';

interface UseResponsiveChartOptions {
  defaultHeight?: number;
  aspectRatio?: number;
  minHeight?: number;
  maxHeight?: number;
}

export function useResponsiveChart(options: UseResponsiveChartOptions = {}) {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: options.defaultHeight || 400
  });

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.querySelector('.chart-container');
      if (container) {
        const width = container.clientWidth;
        const height = Math.max(
          options.minHeight || 200,
          Math.min(
            options.maxHeight || 800,
            options.aspectRatio ? width / options.aspectRatio : options.defaultHeight || 400
          )
        );
        
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [options]);

  return dimensions;
}
```

## 共通ユーティリティ

### 1. データフォーマッター

```typescript
// src/infrastructure/visualization/recharts/utils/formatters.ts

export const formatters = {
  // 数値フォーマット
  number: (value: number, unit?: string) => {
    const formatted = value.toLocaleString();
    return unit ? `${formatted} ${unit}` : formatted;
  },

  // パーセンテージフォーマット
  percentage: (value: number, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  // 通貨フォーマット
  currency: (value: number, currency = 'JPY') => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency
    }).format(value);
  },

  // 日付フォーマット
  date: (value: string | number, format = 'YYYY-MM-DD') => {
    const date = new Date(value);
    return date.toLocaleDateString('ja-JP');
  },

  // 時間フォーマット
  time: (value: string | number, format = 'HH:mm') => {
    const date = new Date(value);
    return date.toLocaleTimeString('ja-JP');
  }
};
```

### 2. カラーユーティリティ

```typescript
// src/infrastructure/visualization/recharts/utils/colors.ts

export const colorUtils = {
  // カラーパレットの取得
  getColorPalette: (scheme: string) => {
    const palettes: Record<string, string[]> = {
      category10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
      category20: ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c'],
      blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6'],
      reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a']
    };
    
    return palettes[scheme] || palettes.category10;
  },

  // 透明度付きカラー
  withOpacity: (color: string, opacity: number) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },

  // カラーの明度調整
  adjustBrightness: (color: string, amount: number) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
};
```

### 3. データ変換ユーティリティ

```typescript
// src/infrastructure/visualization/recharts/utils/transformers.ts

export const transformers = {
  // ランキングデータの変換
  toRankingData: (data: any[], valueKey: string, nameKey: string) => {
    return data.map((item, index) => ({
      name: item[nameKey],
      value: item[valueKey],
      rank: index + 1,
      ...item
    }));
  },

  // 時系列データの変換
  toTimeSeriesData: (data: any[], timeKey: string, valueKey: string) => {
    return data.map(item => ({
      time: item[timeKey],
      value: item[valueKey],
      ...item
    }));
  },

  // 複数系列データの変換
  toMultiSeriesData: (data: any[], seriesKey: string, valueKey: string) => {
    const series = [...new Set(data.map(item => item[seriesKey]))];
    const result: any[] = [];
    
    data.forEach(item => {
      const existing = result.find(r => r.time === item.time);
      if (existing) {
        existing[item[seriesKey]] = item[valueKey];
      } else {
        const newItem: any = { time: item.time };
        newItem[item[seriesKey]] = item[valueKey];
        result.push(newItem);
      }
    });
    
    return result;
  }
};
```

## 共通スタイル

### 1. CSS変数

```css
/* src/styles/charts.css */

:root {
  --chart-primary-color: #1f77b4;
  --chart-secondary-color: #ff7f0e;
  --chart-success-color: #2ca02c;
  --chart-warning-color: #ff7f0e;
  --chart-danger-color: #d62728;
  --chart-info-color: #17becf;
  
  --chart-text-color: #333333;
  --chart-text-secondary: #666666;
  --chart-background: #ffffff;
  --chart-border: #e0e0e0;
  
  --chart-font-family: 'Noto Sans JP', sans-serif;
  --chart-font-size: 14px;
  --chart-font-size-small: 12px;
  --chart-font-size-large: 16px;
  
  --chart-border-radius: 4px;
  --chart-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-container {
  font-family: var(--chart-font-family);
  font-size: var(--chart-font-size);
  color: var(--chart-text-color);
  background: var(--chart-background);
  border-radius: var(--chart-border-radius);
  box-shadow: var(--chart-shadow);
  padding: 16px;
}

.chart-title {
  font-size: var(--chart-font-size-large);
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--chart-text-color);
}

.chart-subtitle {
  font-size: var(--chart-font-size-small);
  color: var(--chart-text-secondary);
  margin-bottom: 16px;
}
```

### 2. ツールチップスタイル

```css
.recharts-tooltip {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.tooltip-header {
  font-weight: 600;
  margin-bottom: 4px;
}

.tooltip-item {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.tooltip-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 8px;
}

.tooltip-name {
  margin-right: 8px;
}

.tooltip-value {
  font-weight: 600;
}
```

## テストパターン

### 1. 共通テストユーティリティ

```typescript
// src/test-utils/chart-test-utils.tsx

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChartContainer } from '@/components/charts/recharts/common/ChartContainer';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {children}
    </div>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### 2. 共通テストケース

```typescript
// src/components/charts/recharts/__tests__/common.test.tsx

import { render, screen } from '@/test-utils/chart-test-utils';
import { ChartContainer } from '../common/ChartContainer';

describe('ChartContainer', () => {
  it('renders loading state', () => {
    render(
      <ChartContainer loading={true}>
        <div>Chart content</div>
      </ChartContainer>
    );
    
    expect(screen.getByText('データを読み込み中...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <ChartContainer error="Test error">
        <div>Chart content</div>
      </ChartContainer>
    );
    
    expect(screen.getByText('エラーが発生しました: Test error')).toBeInTheDocument();
  });

  it('renders with title and subtitle', () => {
    render(
      <ChartContainer title="Test Chart" subtitle="Test subtitle">
        <div>Chart content</div>
      </ChartContainer>
    );
    
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });
});
```

## 関連ドキュメント

- [Recharts実装ガイド](../仕様/recharts-implementation-guide.md)
- [棒グラフ仕様](../仕様/chart-types/bar-chart.md)
- [折れ線グラフ仕様](../仕様/chart-types/line-chart.md)

---

**更新履歴**:
- 2025-10-16: 初版作成
