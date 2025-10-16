# 棒グラフ仕様

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: 棒グラフ可視化機能

---

## 概要

数値データを棒の長さで比較表示するチャート。ランキングデータの表示に最適で、都道府県・市区町村の統計値を視覚的に比較できます。

## 実装ライブラリ

### Recharts版（推奨）
**用途**: 標準的な表示・ダッシュボード

**特徴**:
- 迅速な実装
- レスポンシブ対応
- 標準的なインタラクション
- 保守しやすい

### D3.js版
**用途**: 高度なインタラクション・詳細ページ

**特徴**:
- 完全なカスタマイズ
- 複雑なアニメーション
- 独自のインタラクション
- 大量データ対応

## 主要機能

### 1. 基本表示
- **縦棒グラフ**: 標準的なランキング表示
- **横棒グラフ**: 長いラベル名に対応
- **複数系列**: 複数のデータ系列を同時表示
- **スタック表示**: 積み上げ棒グラフ

### 2. インタラクション
- **ホバー効果**: マウスオーバー時の詳細表示
- **クリック操作**: データポイント選択・詳細表示
- **ソート機能**: 値・名前による並び替え
- **フィルタリング**: データの絞り込み

### 3. カスタマイズ
- **カラーパレット**: 複数の色スキーム
- **アニメーション**: 表示・更新時のアニメーション
- **ラベル表示**: 値・パーセンテージ表示
- **凡例**: 系列の説明表示

## データ構造

### 入力データ

```typescript
interface BarChartData {
  name: string;           // 表示名
  value: number;          // データ値
  rank?: number;          // ランキング順位
  category?: string;      // カテゴリ（複数系列用）
  color?: string;         // 個別色指定
  metadata?: {            // メタデータ
    areaCode?: string;
    areaName?: string;
    unit?: string;
    [key: string]: any;
  };
}

interface BarChartConfig {
  orientation: 'vertical' | 'horizontal';
  showValues: boolean;        // 値の表示
  showRanks: boolean;         // ランキング表示
  showPercentages: boolean;   // パーセンテージ表示
  sortBy: 'value' | 'name' | 'rank' | 'none';
  sortOrder: 'asc' | 'desc';
  maxItems?: number;          // 表示件数制限
  colorScheme: string;        // カラースキーム
  animation: boolean;         // アニメーション有効
}
```

## コンポーネント設計

### 1. Recharts版

```typescript
// src/components/charts/recharts/BarChart.tsx

interface RechartsBarChartProps {
  data: BarChartData[];
  config: BarChartConfig;
  width?: number;
  height?: number;
  onDataPointClick?: (data: BarChartData) => void;
  onDataPointHover?: (data: BarChartData | null) => void;
  className?: string;
}

export function RechartsBarChart({
  data,
  config,
  width = 600,
  height = 400,
  onDataPointClick,
  onDataPointHover,
  className
}: RechartsBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={config.orientation === 'horizontal' ? 'horizontal' : 'vertical'}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={config.orientation === 'vertical' ? -45 : 0}
          textAnchor={config.orientation === 'vertical' ? 'end' : 'middle'}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="value" 
          fill="#8884d8"
          onClick={onDataPointClick}
          onMouseOver={onDataPointHover}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### 2. D3.js版

```typescript
// src/components/charts/d3js/BarChart.tsx

interface D3BarChartProps {
  data: BarChartData[];
  config: BarChartConfig;
  width?: number;
  height?: number;
  onDataPointClick?: (data: BarChartData) => void;
  onDataPointHover?: (data: BarChartData | null) => void;
  className?: string;
}

export function D3BarChart({
  data,
  config,
  width = 600,
  height = 400,
  onDataPointClick,
  onDataPointHover,
  className
}: D3BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // スケール設定
    const xScale = config.orientation === 'vertical'
      ? d3.scaleBand().domain(data.map(d => d.name)).range([0, width]).padding(0.1)
      : d3.scaleLinear().domain([0, d3.max(data, d => d.value) || 0]).range([0, width]);
    
    const yScale = config.orientation === 'vertical'
      ? d3.scaleLinear().domain([0, d3.max(data, d => d.value) || 0]).range([height, 0])
      : d3.scaleBand().domain(data.map(d => d.name)).range([0, height]).padding(0.1);

    // バー描画
    const bars = svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => config.orientation === 'vertical' ? xScale(d.name) || 0 : 0)
      .attr('y', d => config.orientation === 'vertical' ? yScale(d.value) : yScale(d.name) || 0)
      .attr('width', d => config.orientation === 'vertical' ? xScale.bandwidth() : xScale(d.value))
      .attr('height', d => config.orientation === 'vertical' ? height - yScale(d.value) : yScale.bandwidth())
      .attr('fill', d => d.color || '#8884d8')
      .on('click', (event, d) => onDataPointClick?.(d))
      .on('mouseover', (event, d) => onDataPointHover?.(d))
      .on('mouseout', () => onDataPointHover?.(null));

    // アニメーション
    if (config.animation) {
      bars.attr('opacity', 0)
        .transition()
        .duration(1000)
        .attr('opacity', 1);
    }

    return () => {
      svg.selectAll('*').remove();
    };
  }, [data, config, width, height, onDataPointClick, onDataPointHover]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

## 使い分けガイド

### Recharts版を選択すべきケース

#### 1. ダッシュボードでの標準表示
```typescript
// シンプルなランキング表示
<RechartsBarChart 
  data={rankingData}
  config={{
    orientation: 'vertical',
    showValues: true,
    showRanks: true,
    sortBy: 'value',
    sortOrder: 'desc'
  }}
/>
```

**特徴**:
- 迅速な実装
- 標準的な表示
- レスポンシブ対応
- 保守しやすい

#### 2. 複数系列の比較
```typescript
// 複数年度の比較
<RechartsBarChart 
  data={multiYearData}
  config={{
    orientation: 'vertical',
    showValues: true,
    colorScheme: 'category10'
  }}
/>
```

#### 3. モバイル表示
```typescript
// モバイル向け横棒グラフ
<RechartsBarChart 
  data={mobileData}
  config={{
    orientation: 'horizontal',
    showValues: true,
    maxItems: 10
  }}
/>
```

### D3.js版を選択すべきケース

#### 1. 詳細ページでのインタラクティブ表示
```typescript
// 高度なインタラクション付き
<D3BarChart 
  data={detailedData}
  config={{
    orientation: 'vertical',
    showValues: true,
    animation: true,
    sortBy: 'value'
  }}
  onDataPointClick={handleDetailView}
  onDataPointHover={showTooltip}
/>
```

**特徴**:
- カスタムアニメーション
- 複雑なツールチップ
- ドラッグ&ドロップ
- 完全なカスタマイズ

#### 2. 大量データの表示
```typescript
// 仮想スクロール対応
<D3BarChart 
  data={largeDataset}
  config={{
    orientation: 'vertical',
    maxItems: 100,
    animation: true
  }}
/>
```

#### 3. カスタムレイアウト
```typescript
// 特殊なレイアウト
<D3BarChart 
  data={customData}
  config={{
    orientation: 'vertical',
    customLayout: true,
    animation: true
  }}
/>
```

## パフォーマンス最適化

### 1. データ最適化

```typescript
// 表示件数制限
export function optimizeBarChartData(
  data: BarChartData[],
  config: BarChartConfig
): BarChartData[] {
  let optimizedData = [...data];

  // ソート
  if (config.sortBy !== 'none') {
    optimizedData.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (config.sortBy) {
        case 'value':
          aValue = a.value;
          bValue = b.value;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'rank':
          aValue = a.rank || 0;
          bValue = b.rank || 0;
          break;
      }

      return config.sortOrder === 'asc' 
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });
  }

  // 表示件数制限
  if (config.maxItems) {
    optimizedData = optimizedData.slice(0, config.maxItems);
  }

  return optimizedData;
}
```

### 2. レンダリング最適化

```typescript
// メモ化による最適化
export const OptimizedBarChart = memo(function BarChart({ 
  data, 
  config 
}: BarChartProps) {
  const processedData = useMemo(() => 
    optimizeBarChartData(data, config), 
    [data, config]
  );

  const colorScale = useMemo(() => 
    createColorScale(processedData, config.colorScheme), 
    [processedData, config.colorScheme]
  );

  return (
    <BarChart 
      data={processedData}
      colorScale={colorScale}
      config={config}
    />
  );
});
```

## アクセシビリティ対応

### 1. キーボードナビゲーション

```typescript
export function setupKeyboardNavigation(
  chartElement: HTMLElement,
  data: BarChartData[]
) {
  let selectedIndex = 0;

  chartElement.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        selectedIndex = Math.min(selectedIndex + 1, data.length - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'Enter':
      case ' ':
        onDataPointClick?.(data[selectedIndex]);
        break;
    }
    
    updateSelection(selectedIndex);
  });
}
```

### 2. スクリーンリーダー対応

```typescript
export function setupScreenReaderSupport(
  chartElement: HTMLElement,
  data: BarChartData[]
) {
  // ARIA属性の設定
  chartElement.setAttribute('role', 'img');
  chartElement.setAttribute('aria-label', 'ランキングデータチャート');

  // 各バーにARIA属性を追加
  data.forEach((item, index) => {
    const barElement = chartElement.querySelector(`[data-index="${index}"]`);
    if (barElement) {
      barElement.setAttribute('role', 'button');
      barElement.setAttribute('tabindex', '0');
      barElement.setAttribute('aria-label', 
        `${item.name}: ${item.value}${item.rank ? ` (${item.rank}位)` : ''}`
      );
    }
  });
}
```

## テスト戦略

### 1. 単体テスト

```typescript
// src/components/charts/__tests__/BarChart.test.tsx

describe("BarChart", () => {
  const mockData: BarChartData[] = [
    { name: "Item 1", value: 100, rank: 1 },
    { name: "Item 2", value: 200, rank: 2 }
  ];

  it("renders chart with data", () => {
    render(<BarChart data={mockData} config={defaultConfig} />);
    
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const onDataPointClick = jest.fn();
    render(
      <BarChart 
        data={mockData} 
        config={defaultConfig}
        onDataPointClick={onDataPointClick}
      />
    );
    
    const bars = screen.getAllByRole("button");
    fireEvent.click(bars[0]);
    
    expect(onDataPointClick).toHaveBeenCalledWith(mockData[0]);
  });
});
```

### 2. パフォーマンステスト

```typescript
describe("BarChart Performance", () => {
  it("handles large datasets efficiently", () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      name: `Item ${i}`,
      value: Math.random() * 1000
    }));

    const startTime = performance.now();
    render(<BarChart data={largeData} config={defaultConfig} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
  });
});
```

## 関連コンポーネント

- `src/components/charts/recharts/BarChart.tsx`
- `src/components/charts/d3js/BarChart.tsx`
- `src/lib/visualization/common/bar-chart/`

## 関連ドキュメント

- [ライブラリ選択ガイド](library-selection-guide.md)
- [Recharts実装ガイド](recharts-implementation-guide.md)
- [D3.js実装ガイド](d3js-implementation-guide.md)

---

**更新履歴**:
- 2025-10-16: 初版作成
