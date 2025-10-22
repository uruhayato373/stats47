---
title: Rechartsライブラリ統合
created: 2025-01-20
updated: 2025-01-20
tags:
  - 開発ガイド
  - 可視化
  - Recharts
  - ベストプラクティス
---

# Rechartsライブラリ統合

## 概要

Rechartsライブラリのベストプラクティスとカスタムコンポーネントの作成方法について説明します。パフォーマンス最適化、アクセシビリティ対応、カスタマイズ方法を詳しく解説します。

## ベストプラクティス

### 1. コンポーネント設計

Rechartsコンポーネントは再利用可能で、設定可能な形で設計します。

```typescript
interface BaseChartProps {
  data: ChartData[];
  width?: number | string;
  height?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  className?: string;
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// ベースチャートコンポーネント
export const BaseChart: React.FC<BaseChartProps> = ({
  data,
  width = '100%',
  height = 400,
  margin = { top: 20, right: 30, left: 20, bottom: 5 },
  className
}) => {
  return (
    <ResponsiveContainer width={width} height={height}>
      <div className={className}>
        {/* チャートコンテンツ */}
      </div>
    </ResponsiveContainer>
  );
};
```

### 2. データフォーマット

Rechartsで使用するデータの標準フォーマットを定義します。

```typescript
// 時系列データのフォーマット
export interface TimeSeriesData {
  date: string;
  value: number;
  areaCode?: string;
  areaName?: string;
}

// ランキングデータのフォーマット
export interface RankingData {
  rank: number;
  areaName: string;
  value: number;
  areaCode: string;
}

// カテゴリ別データのフォーマット
export interface CategoryData {
  category: string;
  value: number;
  percentage?: number;
}

// データ変換ユーティリティ
export const transformDataForRecharts = {
  timeSeries: (data: EstatDataPoint[]): TimeSeriesData[] => {
    return data.map(point => ({
      date: point.year?.toString() || point.areaName,
      value: point.value,
      areaCode: point.areaCode,
      areaName: point.areaName
    }));
  },

  ranking: (data: EstatDataPoint[]): RankingData[] => {
    return data
      .sort((a, b) => b.value - a.value)
      .map((point, index) => ({
        rank: index + 1,
        areaName: point.areaName,
        value: point.value,
        areaCode: point.areaCode
      }));
  },

  category: (data: EstatDataPoint[]): CategoryData[] => {
    const total = data.reduce((sum, point) => sum + point.value, 0);
    return data.map(point => ({
      category: point.areaName,
      value: point.value,
      percentage: (point.value / total) * 100
    }));
  }
};
```

### 3. カスタムツールチップ

デフォルトのツールチップをカスタマイズして、より詳細な情報を表示します。

```typescript
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: number) => string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatter = (value) => value.toLocaleString()
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey}: {formatter(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 使用例
<LineChart data={data}>
  <Tooltip content={<CustomTooltip />} />
</LineChart>
```

### 4. カスタムレジェンド

レジェンドの表示をカスタマイズします。

```typescript
interface CustomLegendProps {
  payload?: any[];
  onClick?: (data: any) => void;
}

export const CustomLegend: React.FC<CustomLegendProps> = ({ payload, onClick }) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-4">
      {payload?.map((entry, index) => (
        <div
          key={index}
          className="flex items-center gap-2 cursor-pointer hover:opacity-70"
          onClick={() => onClick?.(entry)}
        >
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// 使用例
<LineChart data={data}>
  <Legend content={<CustomLegend />} />
</LineChart>
```

## カスタムコンポーネントの作成

### 1. 統計チャートコンポーネント

統計データ専用のチャートコンポーネントを作成します。

```typescript
interface StatisticsChartProps {
  data: EstatDataPoint[];
  chartType: 'line' | 'bar' | 'area';
  title?: string;
  subtitle?: string;
  showTrend?: boolean;
  showComparison?: boolean;
}

export const StatisticsChart: React.FC<StatisticsChartProps> = ({
  data,
  chartType,
  title,
  subtitle,
  showTrend = false,
  showComparison = false
}) => {
  const chartData = transformDataForRecharts.timeSeries(data);

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            {showTrend && <Line type="monotone" dataKey="trend" stroke="#ff7300" strokeDasharray="5 5" />}
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            <Bar dataKey="value" fill="#82ca9d" />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
          </AreaChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={400}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
```

### 2. 比較チャートコンポーネント

複数の地域を比較するチャートコンポーネントです。

```typescript
interface ComparisonChartProps {
  data: Record<string, EstatDataPoint[]>;
  chartType: 'line' | 'bar';
  title?: string;
  colors?: string[];
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  data,
  chartType,
  title,
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1']
}) => {
  // データをRecharts形式に変換
  const chartData = useMemo(() => {
    const allDates = new Set<string>();
    Object.values(data).forEach(areaData => {
      areaData.forEach(point => {
        allDates.add(point.year?.toString() || point.areaName);
      });
    });

    return Array.from(allDates).map(date => {
      const dataPoint: any = { date };
      Object.entries(data).forEach(([areaCode, areaData]) => {
        const point = areaData.find(p => (p.year?.toString() || p.areaName) === date);
        dataPoint[areaCode] = point?.value || 0;
      });
      return dataPoint;
    });
  }, [data]);

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {Object.keys(data).map((areaCode, index) => (
            <Line
              key={areaCode}
              type="monotone"
              dataKey={areaCode}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              name={data[areaCode][0]?.areaName || areaCode}
            />
          ))}
        </LineChart>
      );
    }

    return (
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
        {Object.keys(data).map((areaCode, index) => (
          <Bar
            key={areaCode}
            dataKey={areaCode}
            fill={colors[index % colors.length]}
            name={data[areaCode][0]?.areaName || areaCode}
          />
        ))}
      </BarChart>
    );
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={400}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
```

## パフォーマンス最適化

### 1. メモ化

不要な再レンダリングを防ぐためにメモ化を活用します。

```typescript
import { memo, useMemo } from 'react';

// チャートコンポーネントのメモ化
export const OptimizedChart = memo<ChartProps>(({ data, config }) => {
  // データのメモ化
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedValue: item.value.toLocaleString()
    }));
  }, [data]);

  // 設定のメモ化
  const chartConfig = useMemo(() => ({
    ...config,
    margin: { top: 20, right: 30, left: 20, bottom: 5 }
  }), [config]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={processedData} {...chartConfig}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
});
```

### 2. データサンプリング

大量データの表示時の最適化です。

```typescript
export const useDataSampling = (data: ChartData[], maxPoints: number = 1000) => {
  return useMemo(() => {
    if (data.length <= maxPoints) return data;

    // データサンプリング（等間隔で抽出）
    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, index) => index % step === 0);
  }, [data, maxPoints]);
};

// 使用例
export const SampledChart: React.FC<ChartProps> = ({ data }) => {
  const sampledData = useDataSampling(data, 500);
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={sampledData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### 3. 遅延読み込み

チャートの遅延読み込み実装です。

```typescript
import { useState, useEffect, useRef } from 'react';

export const LazyChart: React.FC<ChartProps> = ({ data, config }) => {
  const [isVisible, setIsVisible] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={chartRef} className="w-full h-96">
      {isVisible ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded">
          <div className="text-gray-500">チャートを読み込み中...</div>
        </div>
      )}
    </div>
  );
};
```

## アクセシビリティ対応

### 1. ARIAラベル

スクリーンリーダー対応のためのARIAラベルを追加します。

```typescript
export const AccessibleChart: React.FC<ChartProps> = ({ data, title, description }) => {
  return (
    <div role="img" aria-label={title} aria-describedby="chart-description">
      <h3 id="chart-title" className="sr-only">{title}</h3>
      <p id="chart-description" className="sr-only">{description}</p>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
      
      {/* データテーブル（代替表示） */}
      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th>項目</th>
              <th>値</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

### 2. キーボードナビゲーション

キーボードでの操作を可能にします。

```typescript
export const KeyboardAccessibleChart: React.FC<ChartProps> = ({ data }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!data.length) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev === null ? data.length - 1 : Math.max(0, prev - 1)
        );
        break;
      case 'ArrowRight':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev === null ? 0 : Math.min(data.length - 1, prev + 1)
        );
        break;
      case 'Escape':
        setSelectedIndex(null);
        break;
    }
  };

  return (
    <div 
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
          {selectedIndex !== null && (
            <ReferenceLine 
              x={data[selectedIndex]?.name} 
              stroke="red" 
              strokeDasharray="3 3" 
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      
      {selectedIndex !== null && (
        <div className="mt-2 p-2 bg-blue-50 rounded">
          <p>
            選択中: {data[selectedIndex]?.name} - {data[selectedIndex]?.value}
          </p>
        </div>
      )}
    </div>
  );
};
```

## エラーハンドリング

チャート表示時のエラー処理パターンです。

```typescript
interface ChartWithErrorHandlingProps extends ChartProps {
  error?: Error | null;
  loading?: boolean;
  fallbackMessage?: string;
}

export const ChartWithErrorHandling: React.FC<ChartWithErrorHandlingProps> = ({
  data,
  config,
  error,
  loading,
  fallbackMessage = "データを表示できません"
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">
            エラーが発生しました
          </div>
          <p className="text-red-500 text-sm mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center text-gray-600">
          <p className="text-lg font-semibold mb-2">データがありません</p>
          <p className="text-sm">{fallbackMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

## 関連ドキュメント

- [01_可視化実装概要.md](./01_可視化実装概要.md) - 可視化ライブラリと全体アーキテクチャ
- [02_チャート実装ガイド.md](./02_チャート実装ガイド.md) - Rechartsによるグラフ実装

---

**更新履歴**:
- 2025-01-20: 初版作成
