---
title: 統計カードコンポーネント
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/dashboard
  - components
---

# 統計カードコンポーネント

## 概要

統計カードコンポーネントは、ダッシュボードで単一指標の数値を表示するための基本的なコンポーネントです。全国・都道府県・市区町村の3階層すべてで使用でき、データの比較やトレンド表示などの機能を提供します。

## コンポーネント一覧

### 1. StatisticsMetricCard

単一指標の数値を表示する基本的なカードコンポーネントです。

#### Props API

```typescript
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
```

#### 使用例

```typescript
// 基本使用
<StatisticsMetricCard
  params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
  areaCode="00000"
  title="全国総人口"
  color="#4f46e5"
/>

// 詳細設定
<StatisticsMetricCard
  params={{ statsDataId: "0000010101", cdCat01: "A6108" }}
  areaCode="13000"
  title="昼夜間人口比率"
  color="#10b981"
  showComparison={true}
  showTrend={true}
  format="percentage"
  unit="%"
  size="lg"
/>
```

#### 実装例

```typescript
// src/components/dashboard/StatisticsMetricCard.tsx
import React from 'react';
import { useEstatData } from '@/hooks/useEstatData';
import { formatValue } from '@/lib/utils/format';
import { TrendIndicator } from '@/components/common/TrendIndicator';
import { CardSkeleton } from '@/components/common/CardSkeleton';
import { CardError } from '@/components/common/CardError';

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

比較データを表示するカードコンポーネントです。

#### Props API

```typescript
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
```

#### 使用例

```typescript
// 都道府県と全国の比較
<ComparisonCard
  params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
  areaCode="13000"
  compareAreaCode="00000"
  title="東京都 vs 全国"
  color="#4f46e5"
  format="number"
  unit="人"
/>

// 市区町村と都道府県の比較
<ComparisonCard
  params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
  areaCode="13101"
  compareAreaCode="13000"
  title="千代田区 vs 東京都"
  color="#10b981"
  format="number"
  unit="人"
/>
```

#### 実装例

```typescript
// src/components/dashboard/ComparisonCard.tsx
import React from 'react';
import { useEstatData } from '@/hooks/useEstatData';
import { formatValue, calculateComparison } from '@/lib/utils/format';

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

### 3. TrendCard

トレンド表示付きのカードコンポーネントです。

#### Props API

```typescript
interface TrendCardProps {
  params: {
    statsDataId: string;
    cdCat01: string;
  };
  areaCode: string;
  title: string;
  color: string;
  trendPeriod?: 'year' | 'month' | 'quarter';
  format?: 'number' | 'percentage' | 'currency';
  unit?: string;
}
```

#### 使用例

```typescript
// 年次トレンド
<TrendCard
  params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
  areaCode="00000"
  title="全国総人口推移"
  color="#4f46e5"
  trendPeriod="year"
  format="number"
  unit="人"
/>

// 月次トレンド
<TrendCard
  params={{ statsDataId: "0000010201", cdCat01: "A1101" }}
  areaCode="13000"
  title="東京都GDP推移"
  color="#10b981"
  trendPeriod="month"
  format="currency"
  unit="円"
/>
```

#### 実装例

```typescript
// src/components/dashboard/TrendCard.tsx
import React from 'react';
import { useEstatTimeSeriesData } from '@/hooks/useEstatTimeSeriesData';
import { formatValue } from '@/lib/utils/format';
import { TrendChart } from '@/components/charts/TrendChart';

export const TrendCard: React.FC<TrendCardProps> = ({
  params,
  areaCode,
  title,
  color,
  trendPeriod = 'year',
  format = 'number',
  unit
}) => {
  const { data, loading, error } = useEstatTimeSeriesData(
    params,
    areaCode,
    getTrendYears(trendPeriod)
  );
  
  if (loading) return <CardSkeleton />;
  if (error) return <CardError error={error} />;
  
  const currentValue = data[data.length - 1]?.value || 0;
  const previousValue = data[data.length - 2]?.value || 0;
  const trend = calculateTrend(data);
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-neutral-400 mb-2">
        {title}
      </h3>
      <div className="flex items-baseline justify-between mb-4">
        <div className="text-2xl font-bold" style={{ color }}>
          {formatValue(currentValue, format)}
          {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↗' : '↘'} {trend.percentage}%
          </span>
        </div>
      </div>
      <div className="h-20">
        <TrendChart
          data={data}
          color={color}
          height={80}
        />
      </div>
    </div>
  );
};
```

## 共通機能

### 1. データ取得フック

```typescript
// src/hooks/useEstatData.ts
import { useState, useEffect } from 'react';
import { EstatDataService } from '@/lib/services/EstatDataService';

export function useEstatData(
  params: { statsDataId: string; cdCat01: string },
  areaCode: string
) {
  const [data, setData] = useState<EstatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await EstatDataService.getStatsData(
          params.statsDataId,
          params.cdCat01,
          areaCode
        );
        
        setData(result);
      } catch (err) {
        setError(err as Error);
        console.error('Estat data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.statsDataId, params.cdCat01, areaCode]);
  
  return { data, loading, error };
}
```

### 2. フォーマット関数

```typescript
// src/lib/utils/format.ts
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

### 3. トレンドインジケーター

```typescript
// src/components/common/TrendIndicator.tsx
import React from 'react';
import { calculateComparison } from '@/lib/utils/format';

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

## ローディング・エラー状態

### 1. カードスケルトン

```typescript
// src/components/common/CardSkeleton.tsx
import React from 'react';

interface CardSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
}

export function CardSkeleton({ size = 'md' }: CardSkeletonProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  return (
    <div className={`
      bg-white dark:bg-neutral-800 
      rounded-lg border border-gray-200 dark:border-neutral-700 
      ${sizeClasses[size]} 
      animate-pulse
    `}>
      <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded mb-2 w-3/4"></div>
      <div className="h-8 bg-gray-200 dark:bg-neutral-700 rounded w-1/2"></div>
    </div>
  );
}
```

### 2. カードエラー

```typescript
// src/components/common/CardError.tsx
import React from 'react';

interface CardErrorProps {
  error: Error;
  size?: 'sm' | 'md' | 'lg';
}

export function CardError({ error, size = 'md' }: CardErrorProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  return (
    <div className={`
      bg-red-50 dark:bg-red-900/20 
      border border-red-200 dark:border-red-800 
      rounded-lg ${sizeClasses[size]}
    `}>
      <div className="flex items-center space-x-2">
        <div className="text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            エラーが発生しました
          </h3>
          <p className="text-xs text-red-600 dark:text-red-300">
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
// アクセシブルな統計カード
export function AccessibleStatisticsCard(props: StatisticsMetricCardProps) {
  return (
    <div
      role="region"
      aria-labelledby={`${props.areaCode}-${props.params.cdCat01}-title`}
      className="bg-white dark:bg-neutral-800 rounded-lg border p-4"
    >
      <h3 
        id={`${props.areaCode}-${props.params.cdCat01}-title`}
        className="text-sm font-medium text-gray-500 dark:text-neutral-400 mb-2"
      >
        {props.title}
      </h3>
      <div className="flex items-baseline justify-between">
        <div 
          className="text-2xl font-bold" 
          style={{ color: props.color }}
          aria-label={`${props.title}: ${formatValue(data.value, props.format)}`}
        >
          {formatValue(data.value, props.format)}
          {props.unit && (
            <span className="text-sm text-gray-500 ml-1" aria-label={props.unit}>
              {props.unit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 2. キーボードナビゲーション

```typescript
// キーボードで操作可能な統計カード
export function KeyboardNavigableCard(props: StatisticsMetricCardProps) {
  const [focused, setFocused] = useState(false);
  
  return (
    <div
      tabIndex={0}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`
        bg-white dark:bg-neutral-800 
        rounded-lg border p-4
        transition-all duration-200
        ${focused ? 'ring-2 ring-blue-500' : ''}
      `}
    >
      {/* コンテンツ */}
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
  
  it('should be accessible', () => {
    render(<StatisticsMetricCard {...mockProps} />);
    
    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByLabelText('総人口')).toBeInTheDocument();
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
    expect(result.current.error).toBeNull();
  });
  
  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => 
      useEstatData({ statsDataId: 'invalid', cdCat01: 'A1101' }, '00000')
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeDefined();
  });
});
```

## まとめ

統計カードコンポーネントは、ダッシュボードの基本的な構成要素です。主な特徴は以下の通りです：

1. **3階層対応**: 全国・都道府県・市区町村の3階層すべてで使用可能
2. **多様な表示形式**: 数値、パーセンテージ、通貨などのフォーマット対応
3. **比較機能**: 前年比や他地域との比較表示
4. **トレンド表示**: 時系列データのトレンド表示
5. **アクセシビリティ**: セマンティックHTMLとキーボードナビゲーション対応
6. **エラーハンドリング**: ローディング・エラー状態の適切な表示

これらのコンポーネントにより、ユーザーは直感的に統計データを理解し、地域間の比較や時系列の変化を把握することができます。
