---
title: コロプレス地図コンポーネント
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/dashboard
  - components
---

> **注意**: このコンポーネントは現在未実装です。
> 実装時にはこのドキュメントを参考に、`src/features/visualization/components/` 配下に作成してください。

# コロプレス地図コンポーネント

## 概要

コロプレス地図コンポーネントは、ダッシュボードで地域別の統計データを地図上に可視化するためのコンポーネントです。都道府県レベルと市区町村レベルの 2 つの階層で使用でき、データの分布を直感的に理解できます。

## コンポーネント一覧

### 1. PrefectureChoroplethMap

都道府県別の統計データをコロプレス地図で表示するコンポーネントです。

#### Props API

```typescript
interface PrefectureChoroplethMapProps {
  data: Array<{
    prefectureCode: string;
    value: number;
    name: string;
  }>;
  title: string;
  metric: string;
  colorScheme?: "blue" | "green" | "red" | "purple" | "orange";
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  interactive?: boolean;
  onPrefectureClick?: (prefectureCode: string) => void;
  selectedPrefecture?: string | null;
}
```

#### 使用例

```typescript
// 基本使用
<PrefectureChoroplethMap
  data={prefectureData}
  title="都道府県別人口分布"
  metric="population"
  colorScheme="blue"
  height={500}
/>

// インタラクティブ機能付き
<PrefectureChoroplethMap
  data={prefectureData}
  title="都道府県別GDP分布"
  metric="gdp"
  colorScheme="green"
  height={500}
  interactive={true}
  onPrefectureClick={(prefectureCode) => {
    router.push(`/economy/gdp/dashboard/${prefectureCode}`);
  }}
  selectedPrefecture={selectedPrefecture}
/>
```

#### 実装例

```typescript
// src/components/dashboard/PrefectureChoroplethMap.tsx
import React, { useState, useMemo } from "react";
import { ChoroplethMap } from "@/components/maps/ChoroplethMap";
import { MapLegend } from "@/components/maps/MapLegend";
import { formatNumber } from "@/infrastructure/utils/format";

export const PrefectureChoroplethMap: React.FC<
  PrefectureChoroplethMapProps
> = ({
  data,
  title,
  metric,
  colorScheme = "blue",
  height = 400,
  showLegend = true,
  showTooltip = true,
  interactive = true,
  onPrefectureClick,
  selectedPrefecture,
}) => {
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(
    null
  );

  // カラースケールの計算
  const colorScale = useMemo(() => {
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      min,
      max,
      getColor: (value: number) => {
        const ratio = (value - min) / (max - min);
        return getColorByScheme(ratio, colorScheme);
      },
    };
  }, [data, colorScheme]);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="relative">
        <ChoroplethMap
          data={data}
          metric={metric}
          colorScale={colorScale}
          height={height}
          interactive={interactive}
          onPrefectureClick={onPrefectureClick}
          onPrefectureHover={setHoveredPrefecture}
          selectedPrefecture={selectedPrefecture}
          hoveredPrefecture={hoveredPrefecture}
        />

        {showLegend && (
          <MapLegend
            data={data}
            metric={metric}
            colorScale={colorScale}
            position="bottom-right"
          />
        )}

        {showTooltip && hoveredPrefecture && (
          <div className="absolute top-4 left-4 bg-white dark:bg-neutral-800 border rounded-lg p-3 shadow-lg">
            <h4 className="font-semibold">
              {
                data.find((item) => item.prefectureCode === hoveredPrefecture)
                  ?.name
              }
            </h4>
            <p className="text-sm text-gray-600">
              {metric}:{" "}
              {formatNumber(
                data.find((item) => item.prefectureCode === hoveredPrefecture)
                  ?.value || 0
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// カラースキームの定義
function getColorByScheme(ratio: number, scheme: string): string {
  const schemes = {
    blue: `rgb(${Math.round(59 + (136 - 59) * ratio)}, ${Math.round(
      130 + (197 - 130) * ratio
    )}, ${Math.round(246 + (255 - 246) * ratio)})`,
    green: `rgb(${Math.round(34 + (110 - 34) * ratio)}, ${Math.round(
      197 + (201 - 197) * ratio
    )}, ${Math.round(94 + (94 - 94) * ratio)})`,
    red: `rgb(${Math.round(239 + (185 - 239) * ratio)}, ${Math.round(
      68 + (28 - 68) * ratio
    )}, ${Math.round(68 + (28 - 68) * ratio)})`,
    purple: `rgb(${Math.round(147 + (79 - 147) * ratio)}, ${Math.round(
      51 + (70 - 51) * ratio
    )}, ${Math.round(234 + (234 - 234) * ratio)})`,
    orange: `rgb(${Math.round(251 + (249 - 251) * ratio)}, ${Math.round(
      146 + (115 - 146) * ratio
    )}, ${Math.round(60 + (60 - 60) * ratio)})`,
  };

  return schemes[scheme] || schemes.blue;
}
```

### 2. MunicipalityChoroplethMap

市区町村別の統計データをコロプレス地図で表示するコンポーネントです。

#### Props API

```typescript
interface MunicipalityChoroplethMapProps {
  prefectureCode: string;
  data: Array<{
    municipalityCode: string;
    value: number;
    name: string;
  }>;
  title: string;
  metric: string;
  colorScheme?: "blue" | "green" | "red" | "purple" | "orange";
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  interactive?: boolean;
  zoomLevel?: number;
  onMunicipalityClick?: (municipalityCode: string) => void;
  selectedMunicipality?: string | null;
}
```

#### 使用例

```typescript
// 基本使用
<MunicipalityChoroplethMap
  prefectureCode="13"
  data={municipalityData}
  title="東京都内市区町村別人口分布"
  metric="population"
  colorScheme="blue"
  height={500}
/>

// ズーム機能付き
<MunicipalityChoroplethMap
  prefectureCode="27"
  data={municipalityData}
  title="大阪府内市区町村別GDP分布"
  metric="gdp"
  colorScheme="green"
  height={500}
  zoomLevel={1.2}
  interactive={true}
  onMunicipalityClick={(municipalityCode) => {
    router.push(`/economy/gdp/dashboard/${municipalityCode}`);
  }}
/>
```

#### 実装例

```typescript
// src/components/dashboard/MunicipalityChoroplethMap.tsx
import React, { useState, useMemo } from "react";
import { MunicipalityMap } from "@/components/maps/MunicipalityMap";
import { MapLegend } from "@/components/maps/MapLegend";
import { formatNumber } from "@/infrastructure/utils/format";

export const MunicipalityChoroplethMap: React.FC<
  MunicipalityChoroplethMapProps
> = ({
  prefectureCode,
  data,
  title,
  metric,
  colorScheme = "blue",
  height = 400,
  showLegend = true,
  showTooltip = true,
  interactive = true,
  zoomLevel = 1,
  onMunicipalityClick,
  selectedMunicipality,
}) => {
  const [hoveredMunicipality, setHoveredMunicipality] = useState<string | null>(
    null
  );
  const [currentZoomLevel, setCurrentZoomLevel] = useState(zoomLevel);

  // カラースケールの計算
  const colorScale = useMemo(() => {
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      min,
      max,
      getColor: (value: number) => {
        const ratio = (value - min) / (max - min);
        return getColorByScheme(ratio, colorScheme);
      },
    };
  }, [data, colorScheme]);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() =>
              setCurrentZoomLevel(Math.max(0.5, currentZoomLevel - 0.1))
            }
            className="px-2 py-1 text-sm border rounded hover:bg-gray-50 dark:hover:bg-neutral-700"
            aria-label="ズームアウト"
          >
            -
          </button>
          <span className="px-2 py-1 text-sm">
            {Math.round(currentZoomLevel * 100)}%
          </span>
          <button
            onClick={() =>
              setCurrentZoomLevel(Math.min(2, currentZoomLevel + 0.1))
            }
            className="px-2 py-1 text-sm border rounded hover:bg-gray-50 dark:hover:bg-neutral-700"
            aria-label="ズームイン"
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
          colorScale={colorScale}
          height={height}
          zoomLevel={currentZoomLevel}
          interactive={interactive}
          onMunicipalityClick={onMunicipalityClick}
          onMunicipalityHover={setHoveredMunicipality}
          selectedMunicipality={selectedMunicipality}
          hoveredMunicipality={hoveredMunicipality}
        />

        {showLegend && (
          <MapLegend
            data={data}
            metric={metric}
            colorScale={colorScale}
            position="bottom-right"
          />
        )}

        {showTooltip && hoveredMunicipality && (
          <div className="absolute top-4 left-4 bg-white dark:bg-neutral-800 border rounded-lg p-3 shadow-lg">
            <h4 className="font-semibold">
              {
                data.find(
                  (item) => item.municipalityCode === hoveredMunicipality
                )?.name
              }
            </h4>
            <p className="text-sm text-gray-600">
              {metric}:{" "}
              {formatNumber(
                data.find(
                  (item) => item.municipalityCode === hoveredMunicipality
                )?.value || 0
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 3. InteractiveMap

インタラクティブ機能を強化した地図コンポーネントです。

#### Props API

```typescript
interface InteractiveMapProps {
  data: Array<{
    areaCode: string;
    value: number;
    name: string;
  }>;
  title: string;
  metric: string;
  mapType: "prefecture" | "municipality";
  prefectureCode?: string;
  colorScheme?: "blue" | "green" | "red" | "purple" | "orange";
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  showZoomControls?: boolean;
  showPanControls?: boolean;
  onAreaClick?: (areaCode: string) => void;
  selectedArea?: string | null;
}
```

#### 使用例

```typescript
// インタラクティブな都道府県地図
<InteractiveMap
  data={prefectureData}
  title="都道府県別統計データ"
  metric="population"
  mapType="prefecture"
  colorScheme="blue"
  height={500}
  showZoomControls={true}
  showPanControls={true}
  onAreaClick={(areaCode) => {
    router.push(`/population/basic-population/dashboard/${areaCode}`);
  }}
/>

// インタラクティブな市区町村地図
<InteractiveMap
  data={municipalityData}
  title="市区町村別統計データ"
  metric="population"
  mapType="municipality"
  prefectureCode="13"
  colorScheme="green"
  height={500}
  showZoomControls={true}
  onAreaClick={(areaCode) => {
    router.push(`/population/basic-population/dashboard/${areaCode}`);
  }}
/>
```

#### 実装例

```typescript
// src/components/dashboard/InteractiveMap.tsx
import React, { useState, useMemo } from "react";
import { PrefectureChoroplethMap } from "./PrefectureChoroplethMap";
import { MunicipalityChoroplethMap } from "./MunicipalityChoroplethMap";

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  data,
  title,
  metric,
  mapType,
  prefectureCode,
  colorScheme = "blue",
  height = 400,
  showLegend = true,
  showTooltip = true,
  showZoomControls = false,
  showPanControls = false,
  onAreaClick,
  selectedArea,
}) => {
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  if (mapType === "prefecture") {
    return (
      <PrefectureChoroplethMap
        data={data}
        title={title}
        metric={metric}
        colorScheme={colorScheme}
        height={height}
        showLegend={showLegend}
        showTooltip={showTooltip}
        interactive={true}
        onPrefectureClick={onAreaClick}
        selectedPrefecture={selectedArea}
      />
    );
  }

  if (mapType === "municipality" && prefectureCode) {
    return (
      <MunicipalityChoroplethMap
        prefectureCode={prefectureCode}
        data={data}
        title={title}
        metric={metric}
        colorScheme={colorScheme}
        height={height}
        showLegend={showLegend}
        showTooltip={showTooltip}
        interactive={true}
        onMunicipalityClick={onAreaClick}
        selectedMunicipality={selectedArea}
      />
    );
  }

  return null;
};
```

## 共通機能

### 1. 地図データの取得

```typescript
// src/hooks/useMapData.ts
import { useState, useEffect } from "react";
import { MapDataService } from "@/infrastructure/services/MapDataService";

export function useMapData(
  mapType: "prefecture" | "municipality",
  prefectureCode?: string
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let result;
        if (mapType === "prefecture") {
          result = await MapDataService.getPrefectureMapData();
        } else if (mapType === "municipality" && prefectureCode) {
          result = await MapDataService.getMunicipalityMapData(prefectureCode);
        }

        setData(result);
      } catch (err) {
        setError(err as Error);
        console.error("Map data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mapType, prefectureCode]);

  return { data, loading, error };
}
```

### 2. カラースケールの生成

```typescript
// src/infrastructure/utils/color-scale.ts
export function generateColorScale(
  data: Array<{ value: number }>,
  colorScheme: string
) {
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    min,
    max,
    getColor: (value: number) => {
      const ratio = (value - min) / (max - min);
      return getColorByScheme(ratio, colorScheme);
    },
  };
}

function getColorByScheme(ratio: number, scheme: string): string {
  const schemes = {
    blue: `rgb(${Math.round(59 + (136 - 59) * ratio)}, ${Math.round(
      130 + (197 - 130) * ratio
    )}, ${Math.round(246 + (255 - 246) * ratio)})`,
    green: `rgb(${Math.round(34 + (110 - 34) * ratio)}, ${Math.round(
      197 + (201 - 197) * ratio
    )}, ${Math.round(94 + (94 - 94) * ratio)})`,
    red: `rgb(${Math.round(239 + (185 - 239) * ratio)}, ${Math.round(
      68 + (28 - 68) * ratio
    )}, ${Math.round(68 + (28 - 68) * ratio)})`,
    purple: `rgb(${Math.round(147 + (79 - 147) * ratio)}, ${Math.round(
      51 + (70 - 51) * ratio
    )}, ${Math.round(234 + (234 - 234) * ratio)})`,
    orange: `rgb(${Math.round(251 + (249 - 251) * ratio)}, ${Math.round(
      146 + (115 - 146) * ratio
    )}, ${Math.round(60 + (60 - 60) * ratio)})`,
  };

  return schemes[scheme] || schemes.blue;
}
```

### 3. 地図凡例

```typescript
// src/components/maps/MapLegend.tsx
import React from "react";

interface MapLegendProps {
  data: Array<{ value: number }>;
  metric: string;
  colorScale: {
    min: number;
    max: number;
    getColor: (value: number) => string;
  };
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export function MapLegend({
  data,
  metric,
  colorScale,
  position = "bottom-right",
}: MapLegendProps) {
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} bg-white dark:bg-neutral-800 border rounded-lg p-3 shadow-lg`}
    >
      <h4 className="text-sm font-semibold mb-2">{metric}</h4>
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: colorScale.getColor(colorScale.min) }}
          />
          <span className="text-xs">{formatNumber(colorScale.min)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: colorScale.getColor(colorScale.max) }}
          />
          <span className="text-xs">{formatNumber(colorScale.max)}</span>
        </div>
      </div>
    </div>
  );
}
```

## アクセシビリティ

### 1. セマンティック HTML

```typescript
// アクセシブルな地図コンポーネント
export function AccessibleChoroplethMap(props: PrefectureChoroplethMapProps) {
  return (
    <div
      role="img"
      aria-label={`${props.title}の地図`}
      className="bg-white dark:bg-neutral-800 rounded-lg border p-4"
    >
      <h3 className="text-lg font-semibold mb-4">{props.title}</h3>
      <ChoroplethMap
        data={props.data}
        metric={props.metric}
        colorScale={colorScale}
        height={props.height}
        interactive={props.interactive}
        onPrefectureClick={props.onPrefectureClick}
        selectedPrefecture={props.selectedPrefecture}
      />
    </div>
  );
}
```

### 2. キーボードナビゲーション

```typescript
// キーボードで操作可能な地図
export function KeyboardNavigableMap(props: PrefectureChoroplethMapProps) {
  const [focusedArea, setFocusedArea] = useState<string | null>(null);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowRight":
        // 次の地域にフォーカス
        break;
      case "ArrowLeft":
        // 前の地域にフォーカス
        break;
      case "Enter":
      case " ":
        // 地域を選択
        if (focusedArea && props.onPrefectureClick) {
          props.onPrefectureClick(focusedArea);
        }
        break;
    }
  };

  return (
    <div
      role="img"
      aria-label={`${props.title}の地図`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <ChoroplethMap
        data={props.data}
        metric={props.metric}
        colorScale={colorScale}
        height={props.height}
        interactive={props.interactive}
        onPrefectureClick={props.onPrefectureClick}
        selectedPrefecture={props.selectedPrefecture}
        focusedArea={focusedArea}
        onAreaFocus={setFocusedArea}
      />
    </div>
  );
}
```

## テスト

### 1. コンポーネントテスト

```typescript
// PrefectureChoroplethMap.test.tsx
import { render, screen } from "@testing-library/react";
import { PrefectureChoroplethMap } from "./PrefectureChoroplethMap";

describe("PrefectureChoroplethMap", () => {
  const mockData = [
    { prefectureCode: "13000", value: 1000000, name: "東京都" },
    { prefectureCode: "27000", value: 800000, name: "大阪府" },
  ];

  it("should render title and map", () => {
    render(
      <PrefectureChoroplethMap
        data={mockData}
        title="都道府県別人口分布"
        metric="population"
      />
    );

    expect(screen.getByText("都道府県別人口分布")).toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("should show legend when enabled", () => {
    render(
      <PrefectureChoroplethMap
        data={mockData}
        title="都道府県別人口分布"
        metric="population"
        showLegend={true}
      />
    );

    expect(screen.getByText("population")).toBeInTheDocument();
  });

  it("should be accessible", () => {
    render(
      <PrefectureChoroplethMap
        data={mockData}
        title="都道府県別人口分布"
        metric="population"
      />
    );

    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(
      screen.getByLabelText("都道府県別人口分布の地図")
    ).toBeInTheDocument();
  });
});
```

### 2. フックテスト

```typescript
// useMapData.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useMapData } from "./useMapData";

describe("useMapData", () => {
  it("should fetch prefecture map data successfully", async () => {
    const { result } = renderHook(() => useMapData("prefecture"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it("should fetch municipality map data successfully", async () => {
    const { result } = renderHook(() => useMapData("municipality", "13"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBeNull();
  });
});
```

## まとめ

コロプレス地図コンポーネントは、ダッシュボードで地域別の統計データを可視化するための重要なコンポーネントです。主な特徴は以下の通りです：

1. **2 階層対応**: 都道府県レベルと市区町村レベルの 2 つの階層で使用可能
2. **インタラクティブ機能**: ホバー、クリック、ズームなどの操作
3. **カスタマイズ性**: 色、サイズ、表示オプションの柔軟な設定
4. **アクセシビリティ**: セマンティック HTML とキーボードナビゲーション対応
5. **パフォーマンス**: 大量データの効率的な表示
6. **エラーハンドリング**: ローディング・エラー状態の適切な表示

これらのコンポーネントにより、ユーザーは地域別の統計データの分布を直感的に理解し、地域間の比較や詳細な分析を行うことができます。
