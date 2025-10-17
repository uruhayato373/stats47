---
title: ダッシュボード作成ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/dashboard
  - implementation
---

# ダッシュボード作成ガイド

## 概要

このガイドでは、新しいダッシュボードを作成するための詳細な手順を説明します。全国・都道府県・市区町村の 3 階層すべてに対応したダッシュボードの作成方法を学習できます。

## ダッシュボード作成の流れ

### 1. サブカテゴリの定義

#### ステップ 1: カテゴリ設定ファイルの更新

```typescript
// src/config/categories.json
{
  "population": {
    "id": "population",
    "name": "人口",
    "description": "人口に関する統計データ",
    "subcategories": {
      "basic-population": {
        "id": "basic-population",
        "name": "基本人口",
        "description": "総人口、男女別人口などの基本統計",
        "statsDataId": "0000010101",
        "categories": {
          "totalPopulation": "A1101",
          "malePopulation": "A110101",
          "femalePopulation": "A110102",
          "dayNightRatio": "A6108"
        }
      }
    }
  }
}
```

#### ステップ 2: 型定義の追加

```typescript
// src/types/dashboard.ts
export interface SubcategoryConfig {
  id: string;
  name: string;
  description: string;
  statsDataId: string;
  categories: Record<string, string>;
}

export interface CategoryConfig {
  id: string;
  name: string;
  description: string;
  subcategories: Record<string, SubcategoryConfig>;
}
```

### 2. ディレクトリ構造の作成

#### ステップ 1: ディレクトリの作成

```bash
# サブカテゴリ用ディレクトリの作成
mkdir -p src/components/subcategories/population/basic-population

# ダッシュボードコンポーネントファイルの作成
touch src/components/subcategories/population/basic-population/BasicPopulationNationalDashboard.tsx
touch src/components/subcategories/population/basic-population/BasicPopulationPrefectureDashboard.tsx
touch src/components/subcategories/population/basic-population/BasicPopulationMunicipalityDashboard.tsx
touch src/components/subcategories/population/basic-population/index.ts
```

#### ステップ 2: ディレクトリ構造の確認

```
src/components/subcategories/population/basic-population/
├── BasicPopulationNationalDashboard.tsx      # 全国ダッシュボード
├── BasicPopulationPrefectureDashboard.tsx    # 都道府県ダッシュボード
├── BasicPopulationMunicipalityDashboard.tsx  # 市区町村ダッシュボード
└── index.ts                                  # エクスポート設定
```

### 3. 全国ダッシュボードの実装

#### ステップ 1: 基本構造の作成

```typescript
// BasicPopulationNationalDashboard.tsx
import React from "react";
import { SubcategoryLayout } from "@/components/layout/SubcategoryLayout";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { EstatGenderDonutChart } from "@/components/dashboard/EstatGenderDonutChart";
import { EstatLineChart } from "@/components/dashboard/EstatLineChart";
import { PrefectureChoroplethMap } from "@/components/dashboard/PrefectureChoroplethMap";
import { DashboardProps } from "@/types/dashboard";

export const BasicPopulationNationalDashboard: React.FC<DashboardProps> = ({
  category,
  subcategory,
  areaCode,
  areaLevel,
}) => {
  // 統計表IDとカテゴリコードの設定
  const statsDataId = "0000010101";
  const cdCat01 = {
    totalPopulation: "A1101",
    dayNightRatio: "A6108",
    malePopulation: "A110101",
    femalePopulation: "A110102",
  };

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
            title="全国総人口"
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
            title="全国昼夜間人口比率"
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

      {/* 都道府県ランキングセクション */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">都道府県別人口ランキング</h2>
        <PrefectureRankingSection areaCode={areaCode} />
      </section>

      {/* 地域分布地図セクション */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">都道府県別人口分布</h2>
        <PrefectureChoroplethMap
          data={[]} // 実際のデータは後で実装
          title="都道府県別人口分布"
          metric="population"
          colorScheme="blue"
          height={500}
        />
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
          title="全国総人口推移"
          years={["2010", "2015", "2020", "2023"]}
          color="#4f46e5"
          showDataPoints={true}
          showGrid={true}
          height={350}
        />
      </section>
    </SubcategoryLayout>
  );
};
```

#### ステップ 2: 都道府県ランキングセクションの実装

```typescript
// PrefectureRankingSection.tsx
import React from "react";
import { usePrefectureRanking } from "@/hooks/usePrefectureRanking";

interface PrefectureRankingSectionProps {
  areaCode: string;
}

export function PrefectureRankingSection({
  areaCode,
}: PrefectureRankingSectionProps) {
  const { data, loading, error } = usePrefectureRanking(areaCode);

  if (loading) return <RankingSkeleton />;
  if (error) return <RankingError error={error} />;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <div className="space-y-2">
        {data.slice(0, 10).map((item, index) => (
          <div
            key={item.prefectureCode}
            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded"
          >
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-500 w-6">
                {index + 1}
              </span>
              <span className="font-medium">{item.prefectureName}</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatNumber(item.value)}人</div>
              <div className="text-sm text-gray-500">
                {((item.value / data[0].value) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. 都道府県ダッシュボードの実装

#### ステップ 1: 都道府県ダッシュボードの作成

```typescript
// BasicPopulationPrefectureDashboard.tsx
import React from "react";
import { SubcategoryLayout } from "@/components/layout/SubcategoryLayout";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { EstatGenderDonutChart } from "@/components/dashboard/EstatGenderDonutChart";
import { EstatLineChart } from "@/components/dashboard/EstatLineChart";
import { DashboardProps } from "@/types/dashboard";

export const BasicPopulationPrefectureDashboard: React.FC<DashboardProps> = ({
  category,
  subcategory,
  areaCode,
  areaLevel,
}) => {
  const statsDataId = "0000010101";
  const cdCat01 = {
    totalPopulation: "A1101",
    dayNightRatio: "A6108",
    malePopulation: "A110101",
    femalePopulation: "A110102",
  };

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

      {/* 全国比較セクション */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">全国との比較</h2>
        <NationalComparisonSection areaCode={areaCode} />
      </section>

      {/* 市区町村ランキングセクション */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">市区町村別人口ランキング</h2>
        <MunicipalityRankingSection areaCode={areaCode} />
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

      {/* 周辺都道府県比較セクション */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">周辺都道府県との比較</h2>
        <NeighboringPrefectureComparisonSection areaCode={areaCode} />
      </section>
    </SubcategoryLayout>
  );
};
```

#### ステップ 2: 全国比較セクションの実装

```typescript
// NationalComparisonSection.tsx
import React from "react";
import { useNationalComparison } from "@/hooks/useNationalComparison";

interface NationalComparisonSectionProps {
  areaCode: string;
}

export function NationalComparisonSection({
  areaCode,
}: NationalComparisonSectionProps) {
  const { data, loading, error } = useNationalComparison(areaCode);

  if (loading) return <ComparisonSkeleton />;
  if (error) return <ComparisonError error={error} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">全国平均との比較</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">現在の都道府県</span>
            <span className="font-semibold">
              {formatNumber(data.prefecture.value)}人
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">全国平均</span>
            <span className="text-gray-500">
              {formatNumber(data.national.value)}人
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">差</span>
            <span
              className={`font-semibold ${
                data.difference >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {data.difference >= 0 ? "+" : ""}
              {formatNumber(data.difference)}人
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">全国順位</h3>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{data.rank}位</div>
          <div className="text-sm text-gray-500 mt-2">47都道府県中</div>
        </div>
      </div>
    </div>
  );
}
```

### 5. 市区町村ダッシュボードの実装

#### ステップ 1: 市区町村ダッシュボードの作成

```typescript
// BasicPopulationMunicipalityDashboard.tsx
import React from "react";
import { SubcategoryLayout } from "@/components/layout/SubcategoryLayout";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { EstatGenderDonutChart } from "@/components/dashboard/EstatGenderDonutChart";
import { EstatLineChart } from "@/components/dashboard/EstatLineChart";
import { MunicipalityChoroplethMap } from "@/components/dashboard/MunicipalityChoroplethMap";
import { DashboardProps } from "@/types/dashboard";
import { getPrefectureCodeFromMunicipality } from "@/lib/utils/area-utils";

export const BasicPopulationMunicipalityDashboard: React.FC<DashboardProps> = ({
  category,
  subcategory,
  areaCode,
  areaLevel,
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

#### ステップ 2: 周辺市区町村比較セクションの実装

```typescript
// NeighboringMunicipalityComparisonSection.tsx
import React from "react";
import { useNeighboringMunicipalities } from "@/hooks/useNeighboringMunicipalities";

interface NeighboringMunicipalityComparisonSectionProps {
  areaCode: string;
}

export function NeighboringMunicipalityComparisonSection({
  areaCode,
}: NeighboringMunicipalityComparisonSectionProps) {
  const { data, loading, error } = useNeighboringMunicipalities(areaCode);

  if (loading) return <ComparisonSkeleton />;
  if (error) return <ComparisonError error={error} />;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <div className="space-y-3">
        {data.map((municipality, index) => (
          <div
            key={municipality.code}
            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded"
          >
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-500 w-6">
                {index + 1}
              </span>
              <span className="font-medium">{municipality.name}</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {formatNumber(municipality.value)}人
              </div>
              <div className="text-sm text-gray-500">
                {municipality.distance}km
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6. エクスポート設定

#### ステップ 1: インデックスファイルの作成

```typescript
// src/components/subcategories/population/basic-population/index.ts
export { BasicPopulationNationalDashboard } from "./BasicPopulationNationalDashboard";
export { BasicPopulationPrefectureDashboard } from "./BasicPopulationPrefectureDashboard";
export { BasicPopulationMunicipalityDashboard } from "./BasicPopulationMunicipalityDashboard";
```

#### ステップ 2: 親カテゴリのインデックスファイルの更新

```typescript
// src/components/subcategories/population/index.ts
export * from "./basic-population";
// 他のサブカテゴリのエクスポート
```

### 7. データ取得フックの実装

#### ステップ 1: 都道府県ランキングフック

```typescript
// src/hooks/usePrefectureRanking.ts
import { useState, useEffect } from "react";
import { RankingDataService } from "@/lib/services/RankingDataService";

export function usePrefectureRanking(areaCode: string) {
  const [data, setData] = useState<PrefectureRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await RankingDataService.getPrefectureRanking(
          "0000010101", // 人口統計のID
          "2023" // 最新年度
        );

        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [areaCode]);

  return { data, loading, error };
}
```

#### ステップ 2: 全国比較フック

```typescript
// src/hooks/useNationalComparison.ts
import { useState, useEffect } from "react";
import { EstatStatsDataService } from "@/lib/services/EstatStatsDataService";

export function useNationalComparison(areaCode: string) {
  const [data, setData] = useState<NationalComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 都道府県データの取得
        const prefectureData =
          await EstatStatsDataService.getAndFormatStatsData("0000010101", {
            areaFilter: areaCode,
            categoryFilter: "A1101",
          });

        // 全国データの取得
        const nationalData = await EstatStatsDataService.getAndFormatStatsData(
          "0000010101",
          { areaFilter: "00000", categoryFilter: "A1101" }
        );

        // 都道府県ランキングの取得
        const ranking = await RankingDataService.getPrefectureRanking(
          "0000010101",
          "2023"
        );

        const rank =
          ranking.findIndex((item) => item.areaCode === areaCode) + 1;

        setData({
          prefecture: prefectureData.values[0],
          national: nationalData.values[0],
          difference:
            prefectureData.values[0].value - nationalData.values[0].value,
          rank,
        });
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [areaCode]);

  return { data, loading, error };
}
```

## テストの実装

### 1. コンポーネントテスト

```typescript
// BasicPopulationNationalDashboard.test.tsx
import { render, screen } from "@testing-library/react";
import { BasicPopulationNationalDashboard } from "./BasicPopulationNationalDashboard";

describe("BasicPopulationNationalDashboard", () => {
  const mockProps = {
    category: { id: "population", name: "人口" },
    subcategory: { id: "basic-population", name: "基本人口" },
    areaCode: "00000",
    areaLevel: "national" as const,
  };

  it("should render statistics cards", () => {
    render(<BasicPopulationNationalDashboard {...mockProps} />);

    expect(screen.getByText("全国総人口")).toBeInTheDocument();
    expect(screen.getByText("全国昼夜間人口比率")).toBeInTheDocument();
    expect(screen.getByText("男女人口比率")).toBeInTheDocument();
  });

  it("should render section headings", () => {
    render(<BasicPopulationNationalDashboard {...mockProps} />);

    expect(screen.getByText("都道府県別人口ランキング")).toBeInTheDocument();
    expect(screen.getByText("都道府県別人口分布")).toBeInTheDocument();
    expect(screen.getByText("人口推移")).toBeInTheDocument();
  });
});
```

### 2. フックテスト

```typescript
// usePrefectureRanking.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { usePrefectureRanking } from "./usePrefectureRanking";

describe("usePrefectureRanking", () => {
  it("should fetch prefecture ranking data", async () => {
    const { result } = renderHook(() => usePrefectureRanking("00000"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});
```

## デプロイメント

### 1. ビルドの確認

```bash
npm run build
```

### 2. 型チェック

```bash
npm run type-check
```

### 3. テストの実行

```bash
npm run test
```

### 4. デプロイ

```bash
npm run deploy
```

## コンポーネント解決システム

### 概要

`getDashboardComponentByArea`関数が自動的に適切なコンポーネントを選択します：

- `areaCode === "00000"` → NationalDashboard
- `areaCode !== "00000"` → PrefectureDashboard

### 実装例

```typescript
// src/lib/dashboard/get-dashboard-component.ts
import { ComponentType } from "react";
import { DashboardProps } from "@/types/dashboard";

// コンポーネントマッピング
const DASHBOARD_COMPONENTS = {
  "basic-population": {
    NationalDashboard: BasicPopulationNationalDashboard,
    PrefectureDashboard: BasicPopulationPrefectureDashboard,
    MunicipalityDashboard: BasicPopulationMunicipalityDashboard,
  },
  // 他のサブカテゴリも同様に追加
};

export function getDashboardComponentByArea(
  subcategoryId: string,
  areaCode: string
): ComponentType<DashboardProps> | null {
  const components = DASHBOARD_COMPONENTS[subcategoryId];
  if (!components) return null;

  if (areaCode === "00000") {
    return components.NationalDashboard;
  } else if (areaCode.length === 5) {
    return components.PrefectureDashboard;
  } else if (areaCode.length === 9) {
    return components.MunicipalityDashboard;
  }

  return null;
}
```

## 実装チェックリスト

### コンポーネント作成

- [ ] NationalDashboard 作成
- [ ] PrefectureDashboard 作成
- [ ] MunicipalityDashboard 作成（必要に応じて）

### ファイル設定

- [ ] index.tsx 更新（3 箇所）
  - サブカテゴリレベル
  - カテゴリレベル
  - 全体レベル
- [ ] categories.json 更新
- [ ] コンポーネント解決システムに追加

### テスト

- [ ] 全国表示テスト（/dashboard/00000）
- [ ] 都道府県表示テスト（/dashboard/13000）
- [ ] 市区町村表示テスト（/dashboard/13101）
- [ ] リンターエラーなし
- [ ] TypeScript 型チェック通過

### 品質確認

- [ ] レスポンシブデザイン確認
- [ ] ダークモード対応確認
- [ ] アクセシビリティ確認
- [ ] パフォーマンス確認

## 命名規則

### ファイル命名

- **NationalDashboard**: `[Name]NationalDashboard.tsx`
- **PrefectureDashboard**: `[Name]PrefectureDashboard.tsx`
- **MunicipalityDashboard**: `[Name]MunicipalityDashboard.tsx`

### コンポーネント命名

- **コンポーネント名**: `[Name]NationalDashboard`, `[Name]PrefectureDashboard`, `[Name]MunicipalityDashboard`
- **エクスポート名**: ファイル名と同じ

### ディレクトリ構造

```
src/components/subcategories/[category]/[subcategory]/
├── [Name]NationalDashboard.tsx
├── [Name]PrefectureDashboard.tsx
├── [Name]MunicipalityDashboard.tsx
└── index.ts
```

## ベストプラクティス

### コンポーネント設計

- 単一責任の原則に従う
- 全国用・都道府県用・市区町村用で明確に分離
- 共通部分は`SubcategoryLayout`に委譲
- プロップスは最小限に保つ

### データ処理

- 統計データ ID とカテゴリコードを適切に設定
- エラーハンドリングを実装
- ローディング状態を考慮
- キャッシュ戦略を活用

### スタイリング

- Tailwind CSS クラスを使用
- レスポンシブデザインを考慮
- ダークモード対応
- 一貫したデザインシステム

### パフォーマンス

- React.memo を適切に使用
- useCallback と useMemo を活用
- 遅延読み込みを実装
- バンドルサイズを最適化

## まとめ

このガイドでは、新しいダッシュボードを作成するための詳細な手順を説明しました。主なポイントは以下の通りです：

1. **3 階層対応**: 全国・都道府県・市区町村の 3 階層すべてに対応
2. **コンポーネント設計**: 再利用可能で保守しやすいコンポーネント設計
3. **データ取得**: 適切なデータ取得フックの実装
4. **テスト**: コンポーネントとフックのテスト実装
5. **デプロイメント**: ビルドからデプロイまでの手順
6. **コンポーネント解決**: 自動的なコンポーネント選択システム
7. **品質管理**: 包括的なチェックリストとベストプラクティス

次のステップとして、可視化実装ガイドを参照して、より詳細な可視化コンポーネントの実装方法を学習してください。
