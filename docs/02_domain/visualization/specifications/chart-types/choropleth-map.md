---
title: コロプレスマップ仕様
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - specifications
---

# コロプレスマップ仕様

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: コロプレスマップ可視化機能

---

## 概要

地域ごとのデータを色の濃淡で表現する地図可視化。都道府県・市区町村レベルの統計データを地理的な分布として視覚的に表示します。

## 実装ライブラリ

**D3.js** (推奨)

**理由**:

- GeoJSON データの処理に最適
- 地図投影の柔軟な制御
- 複雑なインタラクション実装が容易
- SVG ベースで高品質な描画

## 主要機能

### 1. 地域レベル表示

- **都道府県レベル**: 47 都道府県の表示
- **市区町村レベル**: 約 1,700 市区町村の表示
- **レベル切り替え**: 動的な表示レベルの変更

### 2. インタラクション

- **ズーム・パン**: マウスホイール・ドラッグ操作
- **ホバー効果**: マウスオーバー時の詳細表示
- **クリック操作**: 地域選択・詳細ページ遷移
- **タッチ操作**: モバイルデバイス対応

### 3. データ表示

- **色分け表示**: データ値に応じた色の濃淡
- **凡例表示**: 色と値の対応関係
- **ツールチップ**: 詳細情報のポップアップ表示
- **ラベル表示**: 地域名・値の表示

### 4. カスタマイズ

- **カラースキーム**: 複数の色パレット選択
- **分岐点設定**: 色の分岐点（ゼロ、平均、中央値）
- **表示オプション**: 境界線、ラベル、凡例の表示制御

## データ構造

### 入力データ

```typescript
interface ChoroplethData {
  areaCode: string; // 地域コード（都道府県: 2桁、市区町村: 5桁）
  areaName: string; // 地域名
  value: number; // データ値
  rank?: number; // ランキング順位
  percentile?: number; // パーセンタイル
  parentAreaCode?: string; // 親地域コード（市区町村の場合）
  parentAreaName?: string; // 親地域名
}

interface ChoroplethConfig {
  level: "prefecture" | "municipality";
  colorScheme: string; // カラースキーム名
  divergingMidpoint: "zero" | "mean" | "median" | number;
  showLabels: boolean; // ラベル表示フラグ
  showLegend: boolean; // 凡例表示フラグ
  showBoundaries: boolean; // 境界線表示フラグ
}
```

### GeoJSON データ

```typescript
interface GeoJSONFeature {
  type: "Feature";
  properties: {
    code: string; // 地域コード
    name: string; // 地域名
    [key: string]: any; // その他の属性
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][];
  };
}

interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}
```

## コンポーネント設計

### 1. メインコンポーネント

```typescript
// src/components/charts/d3js/ChoroplethMap.tsx

interface ChoroplethMapProps {
  data: ChoroplethData[];
  config: ChoroplethConfig;
  width?: number;
  height?: number;
  onAreaClick?: (area: ChoroplethData) => void;
  onAreaHover?: (area: ChoroplethData | null) => void;
  className?: string;
}

export function ChoroplethMap({
  data,
  config,
  width = 800,
  height = 600,
  onAreaClick,
  onAreaHover,
  className,
}: ChoroplethMapProps) {
  // 実装
}
```

### 2. サブコンポーネント

```typescript
// 凡例コンポーネント
export function ChoroplethLegend({ scale, title, className }: LegendProps) {
  // 実装
}

// ツールチップコンポーネント
export function ChoroplethTooltip({ data, position, visible }: TooltipProps) {
  // 実装
}

// ズームコントロール
export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  // 実装
}
```

## 実装詳細

### 1. 地図投影設定

```typescript
// src/lib/visualization/d3js/choropleth/projection.ts

export function createProjection(
  width: number,
  height: number,
  level: "prefecture" | "municipality"
): d3.GeoProjection {
  const projection = d3
    .geoMercator()
    .center([138, 38]) // 日本の中心
    .scale(level === "prefecture" ? 1000 : 2000)
    .translate([width / 2, height / 2]);

  return projection;
}
```

### 2. カラースケール

```typescript
// src/lib/visualization/d3js/choropleth/color-scale.ts

export function createColorScale(
  data: ChoroplethData[],
  colorScheme: string,
  divergingMidpoint: "zero" | "mean" | "median" | number
): d3.ScaleSequential<string> {
  const values = data.map((d) => d.value);
  const min = d3.min(values) || 0;
  const max = d3.max(values) || 0;

  let domain: [number, number];
  if (divergingMidpoint === "zero") {
    domain = [0, max];
  } else if (divergingMidpoint === "mean") {
    const mean = d3.mean(values) || 0;
    domain = [min, mean, max];
  } else if (divergingMidpoint === "median") {
    const median = d3.median(values) || 0;
    domain = [min, median, max];
  } else {
    domain = [min, divergingMidpoint, max];
  }

  const interpolator = getColorInterpolator(colorScheme);

  return d3.scaleSequential().domain(domain).interpolator(interpolator);
}
```

### 3. インタラクション処理

```typescript
// src/lib/visualization/d3js/choropleth/interactions.ts

export function setupInteractions(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: ChoroplethData[],
  onAreaClick?: (area: ChoroplethData) => void,
  onAreaHover?: (area: ChoroplethData | null) => void
) {
  // ズーム・パン設定
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 5])
    .on("zoom", (event) => {
      svg.selectAll("path").attr("transform", event.transform);
    });

  svg.call(zoom);

  // 地域クリック・ホバー処理
  svg
    .selectAll("path")
    .on("click", (event, d) => {
      const areaData = data.find((item) => item.areaCode === d.properties.code);
      if (areaData) {
        onAreaClick?.(areaData);
      }
    })
    .on("mouseover", (event, d) => {
      const areaData = data.find((item) => item.areaCode === d.properties.code);
      if (areaData) {
        onAreaHover?.(areaData);
      }
    })
    .on("mouseout", () => {
      onAreaHover?.(null);
    });
}
```

## パフォーマンス最適化

### 1. データ最適化

```typescript
// 大量データの処理
export function optimizeChoroplethData(
  data: ChoroplethData[],
  level: "prefecture" | "municipality"
): ChoroplethData[] {
  // 表示レベルに応じたフィルタリング
  const filteredData = data.filter((item) => {
    if (level === "prefecture") {
      return item.areaCode.length === 2;
    } else {
      return item.areaCode.length === 5;
    }
  });

  // 値の正規化
  return filteredData.map((item) => ({
    ...item,
    normalizedValue: normalizeValue(item.value, filteredData),
  }));
}
```

### 2. レンダリング最適化

```typescript
// 仮想化対応
export function useVirtualizedChoropleth(
  data: ChoroplethData[],
  containerSize: { width: number; height: number }
) {
  const [visibleData, setVisibleData] = useState<ChoroplethData[]>([]);

  useEffect(() => {
    // 表示範囲内のデータのみを計算
    const bounds = calculateVisibleBounds(containerSize);
    const filtered = data.filter((item) => isInBounds(item, bounds));
    setVisibleData(filtered);
  }, [data, containerSize]);

  return visibleData;
}
```

## アクセシビリティ対応

### 1. キーボードナビゲーション

```typescript
export function setupKeyboardNavigation(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: ChoroplethData[]
) {
  let selectedIndex = 0;

  svg.on("keydown", (event) => {
    switch (event.key) {
      case "ArrowRight":
        selectedIndex = Math.min(selectedIndex + 1, data.length - 1);
        break;
      case "ArrowLeft":
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case "Enter":
        const selectedArea = data[selectedIndex];
        onAreaClick?.(selectedArea);
        break;
    }

    updateSelection(selectedIndex);
  });
}
```

### 2. スクリーンリーダー対応

```typescript
export function setupScreenReaderSupport(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: ChoroplethData[]
) {
  // ARIA属性の設定
  svg.attr("role", "img").attr("aria-label", "都道府県別データマップ");

  // 各地域にARIA属性を追加
  svg
    .selectAll("path")
    .attr("role", "button")
    .attr("tabindex", 0)
    .attr("aria-label", (d) => {
      const areaData = data.find((item) => item.areaCode === d.properties.code);
      return areaData
        ? `${areaData.areaName}: ${areaData.value}`
        : d.properties.name;
    });
}
```

## テスト戦略

### 1. 単体テスト

```typescript
// src/components/charts/d3js/__tests__/ChoroplethMap.test.tsx

describe("ChoroplethMap", () => {
  const mockData: ChoroplethData[] = [
    { areaCode: "01", areaName: "北海道", value: 100 },
    { areaCode: "13", areaName: "東京都", value: 200 },
  ];

  it("renders map with data", () => {
    render(<ChoroplethMap data={mockData} config={defaultConfig} />);

    const svg = screen.getByRole("img");
    expect(svg).toBeInTheDocument();
  });

  it("handles area click events", () => {
    const onAreaClick = jest.fn();
    render(
      <ChoroplethMap
        data={mockData}
        config={defaultConfig}
        onAreaClick={onAreaClick}
      />
    );

    // クリックイベントのテスト
    const paths = screen.getAllByRole("button");
    fireEvent.click(paths[0]);

    expect(onAreaClick).toHaveBeenCalledWith(mockData[0]);
  });
});
```

### 2. ビジュアルリグレッションテスト

```typescript
describe("ChoroplethMap Visual Regression", () => {
  it("matches snapshot", () => {
    const { container } = render(
      <ChoroplethMap data={mockData} config={defaultConfig} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## 関連コンポーネント

- `src/components/charts/d3js/ChoroplethMap.tsx`
- `src/lib/visualization/d3js/choropleth/`
- `src/data/geojson/` (GeoJSON データ)

## 関連ドキュメント

- [D3.js 実装ガイド](d3js-implementation-guide.md)
- [アクセシビリティガイド](accessibility.md)
- [既存の D3.js コロプレスガイド](../../implementation/d3js/d3js_choropleth_guide.md)

---

**更新履歴**:

- 2025-10-16: 初版作成
