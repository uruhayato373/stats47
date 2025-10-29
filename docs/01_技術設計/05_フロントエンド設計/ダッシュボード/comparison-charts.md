---
title: 比較グラフコンポーネント
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/dashboard
  - components
---

> **注意**: このコンポーネントは現在未実装です。
> 実装時にはこのドキュメントを参考に、`src/features/visualization/components/` 配下に作成してください。

# 比較グラフコンポーネント

## 概要

比較グラフコンポーネントは、ダッシュボードで複数のデータを比較表示するためのコンポーネントです。全国・都道府県・市区町村の 3 階層すべてで使用でき、ランキング表示や積み上げ表示などの機能を提供します。

## コンポーネント一覧

### 1. StackedBarChart

積み上げ棒グラフで内訳を表示するコンポーネントです。

#### Props API

```typescript
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
  showTooltip?: boolean;
  showGrid?: boolean;
  showValues?: boolean;
}
```

#### 使用例

```typescript
// 基本使用
<StackedBarChart
  data={populationData}
  title="都道府県別人口構成"
  series={[
    { key: 'male', name: '男性', color: '#3b82f6' },
    { key: 'female', name: '女性', color: '#ec4899' }
  ]}
  height={400}
/>

// 横棒グラフ
<StackedBarChart
  data={gdpData}
  title="都道府県別GDP構成"
  series={[
    { key: 'primary', name: '第一次産業', color: '#10b981' },
    { key: 'secondary', name: '第二次産業', color: '#f59e0b' },
    { key: 'tertiary', name: '第三次産業', color: '#8b5cf6' }
  ]}
  height={400}
  horizontal={true}
  showValues={true}
/>
```

#### 実装例

```typescript
// src/components/dashboard/StackedBarChart.tsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/infrastructure/utils/format";

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data,
  title,
  series,
  height = 300,
  horizontal = false,
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  showValues = false,
}) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {horizontal ? (
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" opacity={showGrid ? 0.3 : 0} />
            <XAxis type="number" tickFormatter={formatNumber} />
            <YAxis dataKey="name" type="category" width={100} />
            {showTooltip && (
              <Tooltip
                formatter={(value: any, name: string) => [
                  formatNumber(value),
                  series.find((s) => s.key === name)?.name || name,
                ]}
              />
            )}
            {showLegend && <Legend />}
            {series.map((serie) => (
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
            <CartesianGrid strokeDasharray="3 3" opacity={showGrid ? 0.3 : 0} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatNumber} />
            {showTooltip && (
              <Tooltip
                formatter={(value: any, name: string) => [
                  formatNumber(value),
                  series.find((s) => s.key === name)?.name || name,
                ]}
              />
            )}
            {showLegend && <Legend />}
            {series.map((serie) => (
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

ランキング表示を行うコンポーネントです。

#### Props API

```typescript
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
  showTrend?: boolean;
  height?: number;
  onItemClick?: (item: RankingItem) => void;
}
```

#### 使用例

```typescript
// 基本使用
<RankingChart
  data={prefectureRanking}
  title="都道府県別人口ランキング"
  maxItems={10}
  showValues={true}
  showPercentages={true}
/>

// 市区町村ランキング
<RankingChart
  data={municipalityRanking}
  title="市区町村別人口ランキング"
  maxItems={20}
  showValues={true}
  showPercentages={true}
  onItemClick={(item) => {
    router.push(`/population/basic-population/dashboard/${item.areaCode}`);
  }}
/>
```

#### 実装例

```typescript
// src/components/dashboard/RankingChart.tsx
import React from "react";
import { formatNumber } from "@/infrastructure/utils/format";

export const RankingChart: React.FC<RankingChartProps> = ({
  data,
  title,
  maxItems = 10,
  showValues = true,
  showPercentages = true,
  showTrend = false,
  height = 400,
  onItemClick,
}) => {
  const displayData = data.slice(0, maxItems);
  const maxValue = Math.max(...displayData.map((item) => item.value));

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div
        className="space-y-2 overflow-y-auto"
        style={{ height: height - 60 }}
      >
        {displayData.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded cursor-pointer"
            onClick={() => onItemClick?.(item)}
          >
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
                    backgroundColor: item.color || "#3b82f6",
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

### 3. ComparisonChart

複数の地域を比較表示するコンポーネントです。

#### Props API

```typescript
interface ComparisonChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title: string;
  chartType?: "bar" | "line" | "area";
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  onItemClick?: (item: ComparisonItem) => void;
}
```

#### 使用例

```typescript
// 都道府県比較
<ComparisonChart
  data={prefectureComparison}
  title="主要都道府県比較"
  chartType="bar"
  height={400}
  onItemClick={(item) => {
    router.push(`/population/basic-population/dashboard/${item.areaCode}`);
  }}
/>

// 市区町村比較
<ComparisonChart
  data={municipalityComparison}
  title="周辺市区町村比較"
  chartType="line"
  height={400}
  onItemClick={(item) => {
    router.push(`/population/basic-population/dashboard/${item.areaCode}`);
  }}
/>
```

#### 実装例

```typescript
// src/components/dashboard/ComparisonChart.tsx
import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/infrastructure/utils/format";

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  data,
  title,
  chartType = "bar",
  height = 400,
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  onItemClick,
}) => {
  const renderChart = () => {
    const commonProps = {
      data,
      height: height - 60,
    };

    switch (chartType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={showGrid ? 0.3 : 0} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatNumber} />
            {showTooltip && (
              <Tooltip formatter={(value: any) => [formatNumber(value), ""]} />
            )}
            {showLegend && <Legend />}
            <Bar
              dataKey="value"
              fill="#3b82f6"
              onClick={(data) => onItemClick?.(data)}
            />
          </BarChart>
        );

      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={showGrid ? 0.3 : 0} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatNumber} />
            {showTooltip && (
              <Tooltip formatter={(value: any) => [formatNumber(value), ""]} />
            )}
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={showGrid ? 0.3 : 0} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatNumber} />
            {showTooltip && (
              <Tooltip formatter={(value: any) => [formatNumber(value), ""]} />
            )}
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
```

### 4. TrendComparisonChart

時系列での比較表示を行うコンポーネントです。

#### Props API

```typescript
interface TrendComparisonChartProps {
  data: Array<{
    year: string;
    [key: string]: any;
  }>;
  title: string;
  series: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  chartType?: "line" | "area" | "bar";
}
```

#### 使用例

```typescript
// 都道府県の時系列比較
<TrendComparisonChart
  data={trendData}
  title="都道府県別人口推移比較"
  series={[
    { key: 'tokyo', name: '東京都', color: '#3b82f6' },
    { key: 'osaka', name: '大阪府', color: '#ec4899' },
    { key: 'aichi', name: '愛知県', color: '#10b981' }
  ]}
  height={400}
  chartType="line"
/>

// 市区町村の時系列比較
<TrendComparisonChart
  data={municipalityTrendData}
  title="市区町村別人口推移比較"
  series={[
    { key: 'chiyoda', name: '千代田区', color: '#3b82f6' },
    { key: 'chuo', name: '中央区', color: '#ec4899' },
    { key: 'minato', name: '港区', color: '#10b981' }
  ]}
  height={400}
  chartType="area"
/>
```

#### 実装例

```typescript
// src/components/dashboard/TrendComparisonChart.tsx
import React from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/infrastructure/utils/format";

export const TrendComparisonChart: React.FC<TrendComparisonChartProps> = ({
  data,
  title,
  series,
  height = 400,
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  chartType = "line",
}) => {
  const renderChart = () => {
    const commonProps = {
      data,
      height: height - 60,
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={showGrid ? 0.3 : 0} />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={formatNumber} />
            {showTooltip && (
              <Tooltip
                formatter={(value: any, name: string) => [
                  formatNumber(value),
                  series.find((s) => s.key === name)?.name || name,
                ]}
                labelFormatter={(label) => `${label}年`}
              />
            )}
            {showLegend && <Legend />}
            {series.map((serie) => (
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
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={showGrid ? 0.3 : 0} />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={formatNumber} />
            {showTooltip && (
              <Tooltip
                formatter={(value: any, name: string) => [
                  formatNumber(value),
                  series.find((s) => s.key === name)?.name || name,
                ]}
                labelFormatter={(label) => `${label}年`}
              />
            )}
            {showLegend && <Legend />}
            {series.map((serie) => (
              <Area
                key={serie.key}
                type="monotone"
                dataKey={serie.key}
                name={serie.name}
                stroke={serie.color}
                fill={serie.color}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={showGrid ? 0.3 : 0} />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={formatNumber} />
            {showTooltip && (
              <Tooltip
                formatter={(value: any, name: string) => [
                  formatNumber(value),
                  series.find((s) => s.key === name)?.name || name,
                ]}
                labelFormatter={(label) => `${label}年`}
              />
            )}
            {showLegend && <Legend />}
            {series.map((serie) => (
              <Bar
                key={serie.key}
                dataKey={serie.key}
                name={serie.name}
                fill={serie.color}
              />
            ))}
          </BarChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
```

## 共通機能

### 1. データ取得フック

```typescript
// src/hooks/useRankingData.ts
import { useState, useEffect } from "react";
import { RankingDataService } from "@/infrastructure/services/RankingDataService";

export function useRankingData(
  areaLevel: "national" | "prefecture" | "municipality",
  areaCode: string,
  metric: string
) {
  const [data, setData] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let result;
        if (areaLevel === "national") {
          result = await RankingDataService.getPrefectureRanking(
            areaCode,
            metric
          );
        } else if (areaLevel === "prefecture") {
          result = await RankingDataService.getMunicipalityRanking(
            areaCode,
            metric
          );
        } else if (areaLevel === "municipality") {
          result = await RankingDataService.getNeighboringMunicipalityRanking(
            areaCode,
            metric
          );
        }

        setData(result);
      } catch (err) {
        setError(err as Error);
        console.error("Ranking data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [areaLevel, areaCode, metric]);

  return { data, loading, error };
}
```

### 2. 比較データ取得フック

```typescript
// src/hooks/useComparisonData.ts
import { useState, useEffect } from "react";
import { ComparisonDataService } from "@/infrastructure/services/ComparisonDataService";

export function useComparisonData(
  areaLevel: "national" | "prefecture" | "municipality",
  areaCode: string,
  metric: string
) {
  const [data, setData] = useState<ComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let result;
        if (areaLevel === "national") {
          result = await ComparisonDataService.getPrefectureComparison(
            areaCode,
            metric
          );
        } else if (areaLevel === "prefecture") {
          result = await ComparisonDataService.getMunicipalityComparison(
            areaCode,
            metric
          );
        } else if (areaLevel === "municipality") {
          result =
            await ComparisonDataService.getNeighboringMunicipalityComparison(
              areaCode,
              metric
            );
        }

        setData(result);
      } catch (err) {
        setError(err as Error);
        console.error("Comparison data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [areaLevel, areaCode, metric]);

  return { data, loading, error };
}
```

### 3. トレンドデータ取得フック

```typescript
// src/hooks/useTrendComparisonData.ts
import { useState, useEffect } from "react";
import { TrendComparisonDataService } from "@/infrastructure/services/TrendComparisonDataService";

export function useTrendComparisonData(
  areaLevel: "national" | "prefecture" | "municipality",
  areaCode: string,
  metric: string,
  years: string[]
) {
  const [data, setData] = useState<TrendComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let result;
        if (areaLevel === "national") {
          result =
            await TrendComparisonDataService.getPrefectureTrendComparison(
              areaCode,
              metric,
              years
            );
        } else if (areaLevel === "prefecture") {
          result =
            await TrendComparisonDataService.getMunicipalityTrendComparison(
              areaCode,
              metric,
              years
            );
        } else if (areaLevel === "municipality") {
          result =
            await TrendComparisonDataService.getNeighboringMunicipalityTrendComparison(
              areaCode,
              metric,
              years
            );
        }

        setData(result);
      } catch (err) {
        setError(err as Error);
        console.error("Trend comparison data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [areaLevel, areaCode, metric, years]);

  return { data, loading, error };
}
```

## アクセシビリティ

### 1. セマンティック HTML

```typescript
// アクセシブルな比較グラフ
export function AccessibleStackedBarChart(props: StackedBarChartProps) {
  return (
    <div
      role="img"
      aria-label={`${props.title}の積み上げ棒グラフ`}
      className="bg-white dark:bg-neutral-800 rounded-lg border p-4"
    >
      <h3 className="text-lg font-semibold mb-4">{props.title}</h3>
      <ResponsiveContainer width="100%" height={props.height}>
        <BarChart data={props.data}>{/* グラフの実装 */}</BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 2. キーボードナビゲーション

```typescript
// キーボードで操作可能なランキングチャート
export function KeyboardNavigableRankingChart(props: RankingChartProps) {
  const [focusedItem, setFocusedItem] = useState<number | null>(null);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        setFocusedItem((prev) =>
          prev === null ? 0 : Math.min(prev + 1, props.data.length - 1)
        );
        break;
      case "ArrowUp":
        setFocusedItem((prev) =>
          prev === null ? props.data.length - 1 : Math.max(prev - 1, 0)
        );
        break;
      case "Enter":
      case " ":
        if (focusedItem !== null && props.onItemClick) {
          props.onItemClick(props.data[focusedItem]);
        }
        break;
    }
  };

  return (
    <div
      role="list"
      aria-label={`${props.title}のランキング`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {/* ランキングの実装 */}
    </div>
  );
}
```

## テスト

### 1. コンポーネントテスト

```typescript
// StackedBarChart.test.tsx
import { render, screen } from "@testing-library/react";
import { StackedBarChart } from "./StackedBarChart";

describe("StackedBarChart", () => {
  const mockData = [
    { name: "東京都", male: 1000000, female: 1100000 },
    { name: "大阪府", male: 800000, female: 900000 },
  ];

  const mockSeries = [
    { key: "male", name: "男性", color: "#3b82f6" },
    { key: "female", name: "女性", color: "#ec4899" },
  ];

  it("should render title and chart", () => {
    render(
      <StackedBarChart
        data={mockData}
        title="都道府県別人口構成"
        series={mockSeries}
      />
    );

    expect(screen.getByText("都道府県別人口構成")).toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("should show legend when enabled", () => {
    render(
      <StackedBarChart
        data={mockData}
        title="都道府県別人口構成"
        series={mockSeries}
        showLegend={true}
      />
    );

    expect(screen.getByText("男性")).toBeInTheDocument();
    expect(screen.getByText("女性")).toBeInTheDocument();
  });

  it("should be accessible", () => {
    render(
      <StackedBarChart
        data={mockData}
        title="都道府県別人口構成"
        series={mockSeries}
      />
    );

    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(
      screen.getByLabelText("都道府県別人口構成の積み上げ棒グラフ")
    ).toBeInTheDocument();
  });
});
```

### 2. フックテスト

```typescript
// useRankingData.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useRankingData } from "./useRankingData";

describe("useRankingData", () => {
  it("should fetch ranking data successfully", async () => {
    const { result } = renderHook(() =>
      useRankingData("national", "00000", "population")
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it("should handle errors gracefully", async () => {
    const { result } = renderHook(() =>
      useRankingData("invalid", "00000", "population")
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeDefined();
  });
});
```

## まとめ

比較グラフコンポーネントは、ダッシュボードで複数のデータを比較表示するための重要なコンポーネントです。主な特徴は以下の通りです：

1. **3 階層対応**: 全国・都道府県・市区町村の 3 階層すべてで使用可能
2. **多様な表示形式**: 積み上げ棒グラフ、ランキング、比較グラフ、トレンド比較
3. **インタラクティブ機能**: クリック、ホバー、キーボードナビゲーション
4. **カスタマイズ性**: 色、サイズ、表示オプションの柔軟な設定
5. **アクセシビリティ**: セマンティック HTML とキーボードナビゲーション対応
6. **エラーハンドリング**: ローディング・エラー状態の適切な表示

これらのコンポーネントにより、ユーザーは複数の地域や指標を効率的に比較し、データの傾向や関係性を理解することができます。
