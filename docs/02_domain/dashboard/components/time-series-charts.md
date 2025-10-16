# 時系列グラフコンポーネント

## 概要

時系列グラフコンポーネントは、ダッシュボードで時系列データを可視化するためのコンポーネントです。全国・都道府県・市区町村の3階層すべてで使用でき、単一系列や複数系列のデータを効率的に表示します。

## コンポーネント一覧

### 1. EstatLineChart

単一系列の時系列データを折れ線グラフで表示するコンポーネントです。

#### Props API

```typescript
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
  showTooltip?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
}
```

#### 使用例

```typescript
// 基本使用
<EstatLineChart
  params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
  areaCode="00000"
  title="全国総人口推移"
  years={["2010", "2015", "2020", "2023"]}
/>

// 詳細設定
<EstatLineChart
  params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
  areaCode="13000"
  title="東京都総人口推移"
  years={["2010", "2015", "2020", "2023"]}
  color="#4f46e5"
  showDataPoints={true}
  showGrid={true}
  height={350}
  showLegend={false}
  showTooltip={true}
/>
```

#### 実装例

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
import { formatNumber } from '@/lib/utils/format';
import { ChartSkeleton } from '@/components/common/ChartSkeleton';
import { ChartError } from '@/components/common/ChartError';

export const EstatLineChart: React.FC<EstatLineChartProps> = ({
  params,
  areaCode,
  title,
  years,
  color = '#8884d8',
  showDataPoints = true,
  showGrid = true,
  height = 300,
  showLegend = false,
  showTooltip = true
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
          {showTooltip && (
            <Tooltip 
              formatter={(value: any) => [formatNumber(value), title]}
              labelFormatter={(label) => `${label}年`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          )}
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

複数系列の時系列データを折れ線グラフで表示するコンポーネントです。

#### Props API

```typescript
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
  showTooltip?: boolean;
  showGrid?: boolean;
}
```

#### 使用例

```typescript
// 複数系列の比較
<EstatMultiLineChart
  params={{ 
    statsDataId: "0000010101", 
    cdCat01: ["A110101", "A110102"] 
  }}
  areaCode="00000"
  title="男女別人口推移"
  years={["2010", "2015", "2020", "2023"]}
  series={[
    { key: "A110101", name: "男性", color: "#3b82f6" },
    { key: "A110102", name: "女性", color: "#ec4899" }
  ]}
  height={350}
  showLegend={true}
/>
```

#### 実装例

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
import { formatNumber } from '@/lib/utils/format';
import { ChartSkeleton } from '@/components/common/ChartSkeleton';
import { ChartError } from '@/components/common/ChartError';

export const EstatMultiLineChart: React.FC<EstatMultiLineChartProps> = ({
  params,
  areaCode,
  title,
  years,
  series,
  height = 300,
  showLegend = true,
  showTooltip = true,
  showGrid = true
}) => {
  const { data, loading, error } = useEstatMultiTimeSeriesData(params, areaCode, years);
  
  if (loading) return <ChartSkeleton height={height} />;
  if (error) return <ChartError error={error} height={height} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={showGrid ? 0.3 : 0} />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={formatNumber} />
          {showTooltip && (
            <Tooltip 
              formatter={(value: any, name: string) => [
                formatNumber(value), 
                series.find(s => s.key === name)?.name || name
              ]}
              labelFormatter={(label) => `${label}年`}
            />
          )}
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

### 3. EstatAreaChart

時系列データをエリアチャートで表示するコンポーネントです。

#### Props API

```typescript
interface EstatAreaChartProps {
  params: {
    statsDataId: string;
    cdCat01: string;
  };
  areaCode: string;
  title: string;
  years: string[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
}
```

#### 使用例

```typescript
// エリアチャート
<EstatAreaChart
  params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
  areaCode="00000"
  title="全国総人口推移（エリア）"
  years={["2010", "2015", "2020", "2023"]}
  color="#4f46e5"
  height={300}
/>
```

#### 実装例

```typescript
// src/components/dashboard/EstatAreaChart.tsx
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useEstatTimeSeriesData } from '@/hooks/useEstatTimeSeriesData';
import { formatNumber } from '@/lib/utils/format';
import { ChartSkeleton } from '@/components/common/ChartSkeleton';
import { ChartError } from '@/components/common/ChartError';

export const EstatAreaChart: React.FC<EstatAreaChartProps> = ({
  params,
  areaCode,
  title,
  years,
  color = '#8884d8',
  height = 300,
  showGrid = true,
  showTooltip = true
}) => {
  const { data, loading, error } = useEstatTimeSeriesData(params, areaCode, years);
  
  if (loading) return <ChartSkeleton height={height} />;
  if (error) return <ChartError error={error} height={height} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={showGrid ? 0.3 : 0} />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={formatNumber} />
          {showTooltip && (
            <Tooltip 
              formatter={(value: any) => [formatNumber(value), title]}
              labelFormatter={(label) => `${label}年`}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### 4. EstatBarChart

時系列データを棒グラフで表示するコンポーネントです。

#### Props API

```typescript
interface EstatBarChartProps {
  params: {
    statsDataId: string;
    cdCat01: string;
  };
  areaCode: string;
  title: string;
  years: string[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  horizontal?: boolean;
}
```

#### 使用例

```typescript
// 棒グラフ
<EstatBarChart
  params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
  areaCode="00000"
  title="全国総人口推移（棒グラフ）"
  years={["2010", "2015", "2020", "2023"]}
  color="#4f46e5"
  height={300}
/>

// 横棒グラフ
<EstatBarChart
  params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
  areaCode="00000"
  title="全国総人口推移（横棒）"
  years={["2010", "2015", "2020", "2023"]}
  color="#4f46e5"
  height={300}
  horizontal={true}
/>
```

#### 実装例

```typescript
// src/components/dashboard/EstatBarChart.tsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useEstatTimeSeriesData } from '@/hooks/useEstatTimeSeriesData';
import { formatNumber } from '@/lib/utils/format';
import { ChartSkeleton } from '@/components/common/ChartSkeleton';
import { ChartError } from '@/components/common/ChartError';

export const EstatBarChart: React.FC<EstatBarChartProps> = ({
  params,
  areaCode,
  title,
  years,
  color = '#8884d8',
  height = 300,
  showGrid = true,
  showTooltip = true,
  horizontal = false
}) => {
  const { data, loading, error } = useEstatTimeSeriesData(params, areaCode, years);
  
  if (loading) return <ChartSkeleton height={height} />;
  if (error) return <ChartError error={error} height={height} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {horizontal ? (
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" opacity={showGrid ? 0.3 : 0} />
            <XAxis type="number" tickFormatter={formatNumber} />
            <YAxis dataKey="year" type="category" width={100} />
            {showTooltip && (
              <Tooltip 
                formatter={(value: any) => [formatNumber(value), title]}
                labelFormatter={(label) => `${label}年`}
              />
            )}
            <Bar dataKey="value" fill={color} />
          </BarChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={showGrid ? 0.3 : 0} />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={formatNumber} />
            {showTooltip && (
              <Tooltip 
                formatter={(value: any) => [formatNumber(value), title]}
                labelFormatter={(label) => `${label}年`}
              />
            )}
            <Bar dataKey="value" fill={color} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
```

## 共通機能

### 1. データ取得フック

```typescript
// src/hooks/useEstatTimeSeriesData.ts
import { useState, useEffect } from 'react';
import { EstatDataService } from '@/lib/services/EstatDataService';

export function useEstatTimeSeriesData(
  params: { statsDataId: string; cdCat01: string },
  areaCode: string,
  years: string[]
) {
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const promises = years.map(async (year) => {
          const result = await EstatDataService.getStatsData(
            params.statsDataId,
            params.cdCat01,
            areaCode
          );
          
          const yearData = result.values.find(
            (value) => value.timeCode === year
          );
          
          return {
            year,
            value: yearData?.value || 0
          };
        });
        
        const results = await Promise.all(promises);
        setData(results);
      } catch (err) {
        setError(err as Error);
        console.error('Estat time series data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.statsDataId, params.cdCat01, areaCode, years]);
  
  return { data, loading, error };
}
```

### 2. 複数系列データ取得フック

```typescript
// src/hooks/useEstatMultiTimeSeriesData.ts
import { useState, useEffect } from 'react';
import { EstatDataService } from '@/lib/services/EstatDataService';

export function useEstatMultiTimeSeriesData(
  params: { statsDataId: string; cdCat01: string[] },
  areaCode: string,
  years: string[]
) {
  const [data, setData] = useState<MultiTimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const promises = params.cdCat01.map(async (categoryCode) => {
          const result = await EstatDataService.getStatsData(
            params.statsDataId,
            categoryCode,
            areaCode
          );
          
          const timeSeriesData = years.map((year) => {
            const yearData = result.values.find(
              (value) => value.timeCode === year
            );
            
            return {
              year,
              value: yearData?.value || 0
            };
          });
          
          return {
            categoryCode,
            data: timeSeriesData
          };
        });
        
        const results = await Promise.all(promises);
        
        // データを結合
        const combinedData = years.map((year) => {
          const yearData: any = { year };
          results.forEach((result) => {
            const yearValue = result.data.find((item) => item.year === year);
            yearData[result.categoryCode] = yearValue?.value || 0;
          });
          return yearData;
        });
        
        setData(combinedData);
      } catch (err) {
        setError(err as Error);
        console.error('Estat multi time series data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.statsDataId, params.cdCat01, areaCode, years]);
  
  return { data, loading, error };
}
```

### 3. チャートスケルトン

```typescript
// src/components/common/ChartSkeleton.tsx
import React from 'react';

interface ChartSkeletonProps {
  height?: number;
  width?: number;
}

export function ChartSkeleton({ height = 300, width }: ChartSkeletonProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded mb-4 w-1/3 animate-pulse"></div>
      <div 
        className="bg-gray-200 dark:bg-neutral-700 rounded animate-pulse"
        style={{ height, width: width || '100%' }}
      ></div>
    </div>
  );
}
```

### 4. チャートエラー

```typescript
// src/components/common/ChartError.tsx
import React from 'react';

interface ChartErrorProps {
  error: Error;
  height?: number;
  width?: number;
}

export function ChartError({ error, height = 300, width }: ChartErrorProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded mb-4 w-1/3"></div>
      <div 
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center justify-center"
        style={{ height, width: width || '100%' }}
      >
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">
            <ExclamationTriangleIcon className="h-8 w-8 mx-auto" />
          </div>
          <p className="text-sm text-red-800 dark:text-red-200">
            グラフの読み込みに失敗しました
          </p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            {error.message}
          </p>
        </div>
      </div>
    </div>
  );
}
```

## アクセシビリティ

### 1. セマンティックHTML

```typescript
// アクセシブルな時系列グラフ
export function AccessibleEstatLineChart(props: EstatLineChartProps) {
  return (
    <div
      role="img"
      aria-label={`${props.title}の時系列グラフ`}
      className="bg-white dark:bg-neutral-800 rounded-lg border p-4"
    >
      <h3 className="text-lg font-semibold mb-4">{props.title}</h3>
      <ResponsiveContainer width="100%" height={props.height}>
        <LineChart data={data}>
          {/* グラフの実装 */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 2. キーボードナビゲーション

```typescript
// キーボードで操作可能なグラフ
export function KeyboardNavigableChart(props: EstatLineChartProps) {
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
        // 次のデータポイントにフォーカス
        break;
      case 'ArrowLeft':
        // 前のデータポイントにフォーカス
        break;
      case 'Enter':
      case ' ':
        // データポイントの詳細表示
        break;
    }
  };
  
  return (
    <div
      role="img"
      aria-label={`${props.title}の時系列グラフ`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {/* グラフの実装 */}
    </div>
  );
}
```

## テスト

### 1. コンポーネントテスト

```typescript
// EstatLineChart.test.tsx
import { render, screen } from '@testing-library/react';
import { EstatLineChart } from './EstatLineChart';

describe('EstatLineChart', () => {
  const mockProps = {
    params: { statsDataId: '0000010101', cdCat01: 'A1101' },
    areaCode: '00000',
    title: '全国総人口推移',
    years: ['2010', '2015', '2020', '2023']
  };
  
  it('should render title and chart', () => {
    render(<EstatLineChart {...mockProps} />);
    
    expect(screen.getByText('全国総人口推移')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
  
  it('should show loading state', () => {
    // ローディング状態のテスト
  });
  
  it('should show error state', () => {
    // エラー状態のテスト
  });
  
  it('should be accessible', () => {
    render(<EstatLineChart {...mockProps} />);
    
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByLabelText('全国総人口推移の時系列グラフ')).toBeInTheDocument();
  });
});
```

### 2. フックテスト

```typescript
// useEstatTimeSeriesData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useEstatTimeSeriesData } from './useEstatTimeSeriesData';

describe('useEstatTimeSeriesData', () => {
  it('should fetch time series data successfully', async () => {
    const { result } = renderHook(() => 
      useEstatTimeSeriesData(
        { statsDataId: '0000010101', cdCat01: 'A1101' },
        '00000',
        ['2010', '2015', '2020', '2023']
      )
    );
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
  
  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => 
      useEstatTimeSeriesData(
        { statsDataId: 'invalid', cdCat01: 'A1101' },
        '00000',
        ['2010', '2015', '2020', '2023']
      )
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

時系列グラフコンポーネントは、ダッシュボードで時系列データを可視化するための重要なコンポーネントです。主な特徴は以下の通りです：

1. **多様なグラフタイプ**: 折れ線、エリア、棒グラフなど
2. **3階層対応**: 全国・都道府県・市区町村の3階層すべてで使用可能
3. **複数系列対応**: 複数の指標を同時に表示
4. **カスタマイズ性**: 色、サイズ、表示オプションの柔軟な設定
5. **アクセシビリティ**: セマンティックHTMLとキーボードナビゲーション対応
6. **エラーハンドリング**: ローディング・エラー状態の適切な表示

これらのコンポーネントにより、ユーザーは時系列データの変化を直感的に理解し、地域間の比較や時系列の傾向を把握することができます。
