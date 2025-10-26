---
title: 市区町村ダッシュボード実装ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/dashboard
  - implementation
---

# 市区町村ダッシュボード実装ガイド

## 概要

市区町村ダッシュボードは、都道府県内の市区町村レベルの統計データを表示するためのダッシュボードです。全国で約1,700の市区町村があり、データ量が多く、パフォーマンスの最適化が重要です。

## 市区町村ダッシュボードの特徴

### 1. データ量の多さ

- **市区町村数**: 全国で約1,700自治体
- **都道府県**: 47都道府県
- **データ量**: 都道府県と比較して大幅に増加

### 2. 表示内容

- **統計カード**: 市区町村の基本統計
- **都道府県内順位**: 当該都道府県内での順位
- **周辺比較**: 近隣市区町村との比較
- **推移グラフ**: 時系列データの表示
- **市区町村地図**: 都道府県内の市区町村分布

### 3. パフォーマンス考慮事項

- **遅延読み込み**: 大量データの効率的な読み込み
- **仮想スクロール**: 長いリストの表示最適化
- **キャッシュ戦略**: データの効率的なキャッシュ
- **メモリ管理**: メモリ使用量の最適化

## 実装パターン

### 1. 基本構造

```typescript
// BasicPopulationMunicipalityDashboard.tsx
import React from 'react';
import { SubcategoryLayout } from '@/components/layout/SubcategoryLayout';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { EstatGenderDonutChart } from '@/components/dashboard/EstatGenderDonutChart';
import { EstatLineChart } from '@/components/dashboard/EstatLineChart';
import { MunicipalityChoroplethMap } from '@/components/dashboard/MunicipalityChoroplethMap';
import { DashboardProps } from '@/types/dashboard';
import { getPrefectureCodeFromMunicipality } from '@/infrastructure/utils/area-utils';

export const BasicPopulationMunicipalityDashboard: React.FC<DashboardProps> = ({
  category,
  subcategory,
  areaCode,
  areaLevel
}) => {
  const statsDataId = "0000010101";
  const cdCat01 = {
    totalPopulation: "A1101",
    dayNightRatio: "A6108",
    malePopulation: "A110101",
    femalePopulation: "A110102",
  };
  
  const prefectureCode = getPrefectureCodeFromMunicipality(areaCode);

  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* 統計カードセクション */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalPopulation,
            }}
            areaCode={areaCode}
            title="総人口"
            color="#4f46e5"
            showComparison={true}
            showTrend={true}
            format="number"
            unit="人"
          />
          
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.dayNightRatio,
            }}
            areaCode={areaCode}
            title="昼夜間人口比率"
            color="#10b981"
            showComparison={true}
            showTrend={true}
            format="percentage"
            unit="%"
          />
          
          <EstatGenderDonutChart
            params={{
              statsDataId: statsDataId,
            }}
            areaCode={areaCode}
            maleCategoryCode={cdCat01.malePopulation}
            femaleCategoryCode={cdCat01.femalePopulation}
            title="男女人口比率"
            width={300}
            height={300}
          />
        </div>
      </section>

      {/* 都道府県内順位セクション */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">都道府県内順位</h2>
        <PrefectureRankingSection 
          areaCode={areaCode} 
          prefectureCode={prefectureCode} 
        />
      </section>

      {/* 周辺比較セクション */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">周辺市区町村との比較</h2>
        <NeighboringMunicipalityComparisonSection areaCode={areaCode} />
      </section>

      {/* 推移グラフセクション */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">人口推移</h2>
        <EstatLineChart
          params={{
            statsDataId: statsDataId,
            cdCat01: cdCat01.totalPopulation,
          }}
          areaCode={areaCode}
          title="総人口推移"
          years={["2010", "2015", "2020", "2023"]}
          color="#4f46e5"
          showDataPoints={true}
          showGrid={true}
          height={350}
        />
      </section>

      {/* 市区町村地図セクション */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">市区町村地図</h2>
        <MunicipalityChoroplethMap
          prefectureCode={prefectureCode}
          data={[]} // 実際のデータは後で実装
          title="市区町村別人口分布"
          metric="population"
          colorScheme="blue"
          height={500}
        />
      </section>
    </SubcategoryLayout>
  );
};
```

### 2. 都道府県内順位セクション

```typescript
// PrefectureRankingSection.tsx
import React, { useState, useMemo } from 'react';
import { usePrefectureRanking } from '@/hooks/usePrefectureRanking';
import { VirtualizedList } from '@/components/common/VirtualizedList';

interface PrefectureRankingSectionProps {
  areaCode: string;
  prefectureCode: string;
}

export function PrefectureRankingSection({ 
  areaCode, 
  prefectureCode 
}: PrefectureRankingSectionProps) {
  const { data, loading, error } = usePrefectureRanking(prefectureCode);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'name'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // フィルタリングとソート
  const filteredData = useMemo(() => {
    let filtered = data.filter(item => 
      item.municipalityName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    filtered.sort((a, b) => {
      const aValue = sortBy === 'value' ? a.value : a.municipalityName;
      const bValue = sortBy === 'value' ? b.value : b.municipalityName;
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  }, [data, searchTerm, sortBy, sortOrder]);
  
  // 現在の市区町村の順位を取得
  const currentRank = filteredData.findIndex(item => item.municipalityCode === areaCode) + 1;
  
  if (loading) return <RankingSkeleton />;
  if (error) return <RankingError error={error} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      {/* 検索とソートコントロール */}
      <div className="mb-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="市区町村名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
          />
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'value' | 'name')}
              className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
            >
              <option value="value">人口順</option>
              <option value="name">名前順</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-neutral-700"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        
        {/* 現在の市区町村の順位表示 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              現在の市区町村の順位
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {currentRank}位
            </span>
          </div>
        </div>
      </div>
      
      {/* ランキングリスト */}
      <VirtualizedList
        data={filteredData}
        renderItem={(item, index) => (
          <RankingItem
            key={item.municipalityCode}
            item={item}
            rank={index + 1}
            isCurrent={item.municipalityCode === areaCode}
          />
        )}
        itemHeight={60}
        maxHeight={400}
      />
    </div>
  );
}

// ランキングアイテムコンポーネント
function RankingItem({ 
  item, 
  rank, 
  isCurrent 
}: { 
  item: MunicipalityRankingItem; 
  rank: number; 
  isCurrent: boolean; 
}) {
  return (
    <div className={`
      flex items-center justify-between p-3 rounded-lg transition-colors
      ${isCurrent 
        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
        : 'hover:bg-gray-50 dark:hover:bg-neutral-700'
      }
    `}>
      <div className="flex items-center space-x-3">
        <span className={`
          text-sm font-medium w-6
          ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}
        `}>
          {rank}
        </span>
        <span className={`
          font-medium
          ${isCurrent ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}
        `}>
          {item.municipalityName}
        </span>
        {isCurrent && (
          <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
            現在
          </span>
        )}
      </div>
      <div className="text-right">
        <div className={`
          font-semibold
          ${isCurrent ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}
        `}>
          {formatNumber(item.value)}人
        </div>
        <div className="text-sm text-gray-500">
          {((item.value / filteredData[0].value) * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
```

### 3. 周辺市区町村比較セクション

```typescript
// NeighboringMunicipalityComparisonSection.tsx
import React, { useState, useMemo } from 'react';
import { useNeighboringMunicipalities } from '@/hooks/useNeighboringMunicipalities';
import { useMunicipalityData } from '@/hooks/useMunicipalityData';

interface NeighboringMunicipalityComparisonSectionProps {
  areaCode: string;
}

export function NeighboringMunicipalityComparisonSection({ 
  areaCode 
}: NeighboringMunicipalityComparisonSectionProps) {
  const { data: neighboringData, loading: neighboringLoading, error: neighboringError } = useNeighboringMunicipalities(areaCode);
  const { data: currentData, loading: currentLoading, error: currentError } = useMunicipalityData(areaCode);
  const [comparisonType, setComparisonType] = useState<'population' | 'density' | 'growth'>('population');
  
  const comparisonData = useMemo(() => {
    if (!neighboringData || !currentData) return [];
    
    return neighboringData.map(municipality => ({
      ...municipality,
      comparison: calculateComparison(currentData, municipality, comparisonType)
    }));
  }, [neighboringData, currentData, comparisonType]);
  
  if (neighboringLoading || currentLoading) return <ComparisonSkeleton />;
  if (neighboringError || currentError) return <ComparisonError error={neighboringError || currentError} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      {/* 比較タイプ選択 */}
      <div className="mb-4">
        <div className="flex space-x-2">
          {[
            { value: 'population', label: '人口' },
            { value: 'density', label: '人口密度' },
            { value: 'growth', label: '人口増加率' }
          ].map(type => (
            <button
              key={type.value}
              onClick={() => setComparisonType(type.value as any)}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${comparisonType === type.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                }
              `}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 比較データ表示 */}
      <div className="space-y-3">
        {comparisonData.map((municipality, index) => (
          <div key={municipality.code} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-500 w-6">
                {index + 1}
              </span>
              <span className="font-medium">{municipality.name}</span>
              <span className="text-xs text-gray-500">
                {municipality.distance}km
              </span>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {formatNumber(municipality.value)}
                {comparisonType === 'population' && '人'}
                {comparisonType === 'density' && '人/km²'}
                {comparisonType === 'growth' && '%'}
              </div>
              <div className={`text-sm ${municipality.comparison.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {municipality.comparison.isPositive ? '+' : ''}{municipality.comparison.difference}
                {comparisonType === 'population' && '人'}
                {comparisonType === 'density' && '人/km²'}
                {comparisonType === 'growth' && '%'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. 市区町村地図セクション

```typescript
// MunicipalityChoroplethMap.tsx
import React, { useState, useMemo } from 'react';
import { useMunicipalityMapData } from '@/hooks/useMunicipalityMapData';
import { useMunicipalityData } from '@/hooks/useMunicipalityData';

interface MunicipalityChoroplethMapProps {
  prefectureCode: string;
  data: MunicipalityMapData[];
  title: string;
  metric: string;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple';
  height?: number;
}

export function MunicipalityChoroplethMap({
  prefectureCode,
  data,
  title,
  metric,
  colorScheme = 'blue',
  height = 500
}: MunicipalityChoroplethMapProps) {
  const { data: mapData, loading: mapLoading, error: mapError } = useMunicipalityMapData(prefectureCode);
  const { data: municipalityData, loading: dataLoading, error: dataError } = useMunicipalityData(prefectureCode);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // 地図データと統計データの結合
  const combinedData = useMemo(() => {
    if (!mapData || !municipalityData) return [];
    
    return mapData.map(municipality => {
      const stats = municipalityData.find(item => item.municipalityCode === municipality.code);
      return {
        ...municipality,
        value: stats?.value || 0,
        name: stats?.name || municipality.name
      };
    });
  }, [mapData, municipalityData]);
  
  if (mapLoading || dataLoading) return <MapSkeleton height={height} />;
  if (mapError || dataError) return <MapError error={mapError || dataError} height={height} />;
  
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
          data={combinedData}
          metric={metric}
          colorScheme={colorScheme}
          height={height}
          zoomLevel={zoomLevel}
          onMunicipalityClick={setSelectedMunicipality}
          selectedMunicipality={selectedMunicipality}
        />
        
        {/* 凡例 */}
        <MapLegend
          data={combinedData}
          metric={metric}
          colorScheme={colorScheme}
          position="bottom-right"
        />
        
        {/* 選択された市区町村の情報 */}
        {selectedMunicipality && (
          <MunicipalityInfo
            municipality={combinedData.find(item => item.code === selectedMunicipality)}
            onClose={() => setSelectedMunicipality(null)}
          />
        )}
      </div>
    </div>
  );
}
```

## パフォーマンス最適化

### 1. 仮想スクロール

```typescript
// VirtualizedList.tsx
import React, { useMemo, useRef, useEffect, useState } from 'react';

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  maxHeight: number;
  overscan?: number;
}

export function VirtualizedList<T>({
  data,
  renderItem,
  itemHeight,
  maxHeight,
  overscan = 5
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((scrollTop + maxHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, maxHeight, data.length, overscan]);
  
  const visibleItems = useMemo(() => {
    return data.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [data, visibleRange]);
  
  const totalHeight = data.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: maxHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 2. 遅延読み込み

```typescript
// useMunicipalityData.ts
import { useState, useEffect, useCallback } from 'react';
import { MunicipalityDataService } from '@/infrastructure/services/MunicipalityDataService';

export function useMunicipalityData(areaCode: string) {
  const [data, setData] = useState<MunicipalityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const loadData = useCallback(async (pageNum: number, reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await MunicipalityDataService.getMunicipalityData(areaCode, {
        page: pageNum,
        limit: 50
      });
      
      if (reset) {
        setData(result.data);
      } else {
        setData(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [areaCode]);
  
  useEffect(() => {
    loadData(1, true);
  }, [loadData]);
  
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage, false);
    }
  }, [loading, hasMore, page, loadData]);
  
  return { data, loading, error, hasMore, loadMore };
}
```

### 3. メモ化

```typescript
// MunicipalityDashboard.tsx
import React, { memo, useMemo } from 'react';

export const BasicPopulationMunicipalityDashboard = memo<DashboardProps>(({
  category,
  subcategory,
  areaCode,
  areaLevel
}) => {
  const prefectureCode = useMemo(() => 
    getPrefectureCodeFromMunicipality(areaCode), 
    [areaCode]
  );
  
  const statsDataId = useMemo(() => "0000010101", []);
  
  const cdCat01 = useMemo(() => ({
    totalPopulation: "A1101",
    dayNightRatio: "A6108",
    malePopulation: "A110101",
    femalePopulation: "A110102",
  }), []);
  
  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* コンテンツ */}
    </SubcategoryLayout>
  );
});
```

## エラーハンドリング

### 1. データ取得エラー

```typescript
// MunicipalityDataService.ts
export class MunicipalityDataService {
  static async getMunicipalityData(
    areaCode: string,
    options: { page: number; limit: number }
  ): Promise<{ data: MunicipalityData[]; hasMore: boolean }> {
    try {
      // データ取得の実装
      const response = await fetch(`/api/municipality-data/${areaCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Municipality data fetch error:', error);
      throw new MunicipalityDataError(
        '市区町村データの取得に失敗しました',
        { areaCode, options, originalError: error }
      );
    }
  }
}
```

### 2. フォールバック表示

```typescript
// MunicipalityDashboard.tsx
export const BasicPopulationMunicipalityDashboard: React.FC<DashboardProps> = ({
  category,
  subcategory,
  areaCode,
  areaLevel
}) => {
  const { data, loading, error } = useMunicipalityData(areaCode);
  
  if (loading) {
    return <MunicipalityDashboardSkeleton />;
  }
  
  if (error) {
    return (
      <SubcategoryLayout
        category={category}
        subcategory={subcategory}
        viewType="dashboard"
        areaCode={areaCode}
      >
        <MunicipalityDashboardError error={error} />
      </SubcategoryLayout>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <SubcategoryLayout
        category={category}
        subcategory={subcategory}
        viewType="dashboard"
        areaCode={areaCode}
      >
        <MunicipalityDashboardEmpty />
      </SubcategoryLayout>
    );
  }
  
  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* 通常のコンテンツ */}
    </SubcategoryLayout>
  );
};
```

## テスト

### 1. コンポーネントテスト

```typescript
// BasicPopulationMunicipalityDashboard.test.tsx
import { render, screen } from '@testing-library/react';
import { BasicPopulationMunicipalityDashboard } from './BasicPopulationMunicipalityDashboard';

describe('BasicPopulationMunicipalityDashboard', () => {
  const mockProps = {
    category: { id: 'population', name: '人口' },
    subcategory: { id: 'basic-population', name: '基本人口' },
    areaCode: '13101', // 千代田区
    areaLevel: 'municipality' as const
  };
  
  it('should render statistics cards', () => {
    render(<BasicPopulationMunicipalityDashboard {...mockProps} />);
    
    expect(screen.getByText('総人口')).toBeInTheDocument();
    expect(screen.getByText('昼夜間人口比率')).toBeInTheDocument();
    expect(screen.getByText('男女人口比率')).toBeInTheDocument();
  });
  
  it('should render section headings', () => {
    render(<BasicPopulationMunicipalityDashboard {...mockProps} />);
    
    expect(screen.getByText('都道府県内順位')).toBeInTheDocument();
    expect(screen.getByText('周辺市区町村との比較')).toBeInTheDocument();
    expect(screen.getByText('市区町村地図')).toBeInTheDocument();
  });
});
```

### 2. パフォーマンステスト

```typescript
// MunicipalityDashboard.performance.test.tsx
import { render } from '@testing-library/react';
import { BasicPopulationMunicipalityDashboard } from './BasicPopulationMunicipalityDashboard';

describe('BasicPopulationMunicipalityDashboard Performance', () => {
  it('should render within acceptable time', () => {
    const start = performance.now();
    
    render(<BasicPopulationMunicipalityDashboard {...mockProps} />);
    
    const end = performance.now();
    const renderTime = end - start;
    
    expect(renderTime).toBeLessThan(1000); // 1秒以内
  });
  
  it('should handle large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      code: `13${i.toString().padStart(3, '0')}`,
      name: `市区町村${i}`,
      value: Math.floor(Math.random() * 1000000)
    }));
    
    const start = performance.now();
    
    render(<BasicPopulationMunicipalityDashboard {...mockProps} />);
    
    const end = performance.now();
    const renderTime = end - start;
    
    expect(renderTime).toBeLessThan(2000); // 2秒以内
  });
});
```

## まとめ

市区町村ダッシュボードの実装では、以下の点に注意が必要です：

1. **データ量の多さ**: 約1,700の市区町村データを効率的に処理
2. **パフォーマンス最適化**: 仮想スクロール、遅延読み込み、メモ化の活用
3. **ユーザビリティ**: 検索、ソート、フィルタリング機能の提供
4. **エラーハンドリング**: 適切なエラー処理とフォールバック表示
5. **テスト**: コンポーネントとパフォーマンスのテスト実装

これらの実装により、大量の市区町村データを効率的に表示し、ユーザーが快適に統計データを閲覧できるダッシュボードを構築できます。
