# Recharts実装ガイドライン

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: Rechartsを使用した可視化実装

---

## 基本方針

### 1. 宣言的なAPI活用
- コンポーネントベースの宣言的記述
- Props による動的な設定変更
- データ駆動型のレンダリング

### 2. React統合の最適化
- Hooks との適切な連携
- 状態管理との統合
- コンポーネントの再利用性向上

### 3. レスポンシブ対応
- ResponsiveContainer の活用
- 画面サイズに応じた最適化
- モバイルファーストデザイン

### 4. テーマとスタイリング統一
- 共通のカラーパレット
- 一貫したデザインシステム
- CSS-in-JS との統合

## 推奨パターン

### 1. 基本的な棒グラフ

```typescript
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface ChartData {
  name: string;
  value: number;
  rank?: number;
}

interface SimpleBarChartProps {
  data: ChartData[];
  title?: string;
  onDataPointClick?: (data: ChartData) => void;
}

export function SimpleBarChart({ 
  data, 
  title = "ランキングデータ",
  onDataPointClick 
}: SimpleBarChartProps) {
  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis 
            label={{ value: '値', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
          />
          <Legend />
          <Bar 
            dataKey="value" 
            fill="#8884d8"
            onClick={onDataPointClick}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// カスタムツールチップ
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">
          値: {data.value.toLocaleString()}
        </p>
        {data.rank && (
          <p className="tooltip-rank">順位: {data.rank}位</p>
        )}
      </div>
    );
  }
  return null;
};
```

### 2. レスポンシブ対応

```typescript
import { ResponsiveContainer } from "recharts";

interface ResponsiveChartProps {
  data: ChartData[];
  children: React.ReactNode;
  aspect?: number;
}

export function ResponsiveChart({ 
  data, 
  children, 
  aspect = 2 
}: ResponsiveChartProps) {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0
  });

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.querySelector('.chart-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientWidth / aspect
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [aspect]);

  return (
    <div className="chart-container">
      <ResponsiveContainer 
        width="100%" 
        height={dimensions.height || 400}
      >
        {children}
      </ResponsiveContainer>
    </div>
  );
}
```

### 3. 複数系列のチャート

```typescript
import { LineChart, Line, Area, AreaChart } from "recharts";

interface MultiSeriesData {
  name: string;
  value1: number;
  value2: number;
  value3: number;
}

export function MultiSeriesChart({ data }: { data: MultiSeriesData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="value1" 
          stroke="#8884d8" 
          strokeWidth={2}
          name="系列1"
        />
        <Line 
          type="monotone" 
          dataKey="value2" 
          stroke="#82ca9d" 
          strokeWidth={2}
          name="系列2"
        />
        <Line 
          type="monotone" 
          dataKey="value3" 
          stroke="#ffc658" 
          strokeWidth={2}
          name="系列3"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 4. インタラクティブなチャート

```typescript
import { useState } from "react";
import { BarChart, Bar, Cell } from "recharts";

interface InteractiveBarChartProps {
  data: ChartData[];
}

export function InteractiveBarChart({ data }: InteractiveBarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [filteredData, setFilteredData] = useState(data);

  const handleBarClick = (data: any, index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleSort = (sortBy: 'value' | 'name') => {
    const sorted = [...filteredData].sort((a, b) => {
      if (sortBy === 'value') {
        return b.value - a.value;
      }
      return a.name.localeCompare(b.name);
    });
    setFilteredData(sorted);
  };

  return (
    <div className="interactive-chart">
      <div className="chart-controls">
        <button onClick={() => handleSort('value')}>
          値でソート
        </button>
        <button onClick={() => handleSort('name')}>
          名前でソート
        </button>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={filteredData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" onClick={handleBarClick}>
            {filteredData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={index === activeIndex ? "#ff6b6b" : "#8884d8"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## 共通コンポーネント

### 1. チャートコンテナ

```typescript
// src/components/charts/recharts/common/ChartContainer.tsx

interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
}

export function ChartContainer({ 
  title, 
  subtitle, 
  children, 
  className = "",
  loading = false,
  error
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
        {children}
      </div>
    </div>
  );
}
```

### 2. カスタムツールチップ

```typescript
// src/components/charts/recharts/common/CustomTooltip.tsx

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

## テーマシステム

### 1. カラーパレット

```typescript
// src/lib/visualization/recharts/theme.ts

export const ChartTheme = {
  colors: {
    primary: '#8884d8',
    secondary: '#82ca9d',
    accent: '#ffc658',
    danger: '#ff6b6b',
    warning: '#ffa726',
    info: '#42a5f5',
    success: '#66bb6a',
    neutral: '#9e9e9e'
  },
  
  gradients: {
    primary: ['#8884d8', '#5a67d8'],
    secondary: ['#82ca9d', '#4caf50'],
    accent: ['#ffc658', '#ff9800']
  },
  
  scales: {
    category10: [
      '#8884d8', '#82ca9d', '#ffc658', '#ff6b6b', 
      '#42a5f5', '#66bb6a', '#ffa726', '#9c27b0'
    ],
    category20: [
      '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78',
      '#2ca02c', '#98df8a', '#d62728', '#ff9896',
      '#9467bd', '#c5b0d5', '#8c564b', '#c49c94',
      '#e377c2', '#f7b6d3', '#7f7f7f', '#c7c7c7',
      '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'
    ]
  }
} as const;
```

### 2. スタイル設定

```typescript
// src/lib/visualization/recharts/styles.ts

export const ChartStyles = {
  container: {
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333333',
    marginBottom: '8px'
  },
  
  subtitle: {
    fontSize: '14px',
    color: '#666666',
    marginBottom: '16px'
  },
  
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#ffffff',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    border: 'none'
  },
  
  legend: {
    fontSize: '12px',
    color: '#666666'
  }
} as const;
```

## パフォーマンス最適化

### 1. メモ化

```typescript
import { memo, useMemo } from "react";

export const OptimizedBarChart = memo(function BarChart({ 
  data, 
  width, 
  height 
}: BarChartProps) {
  // データ変換をメモ化
  const processedData = useMemo(() => {
    return data
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 50); // 表示件数制限
  }, [data]);

  // カラーマップをメモ化
  const colorMap = useMemo(() => {
    return processedData.reduce((acc, item, index) => {
      acc[item.name] = ChartTheme.scales.category10[index % 10];
      return acc;
    }, {} as Record<string, string>);
  }, [processedData]);

  return (
    <ResponsiveContainer width={width} height={height}>
      <BarChart data={processedData}>
        {/* チャート設定 */}
      </BarChart>
    </ResponsiveContainer>
  );
});
```

### 2. 仮想化対応

```typescript
import { FixedSizeList as List } from "react-window";

export function VirtualizedBarChart({ data }: { data: ChartData[] }) {
  const itemHeight = 40;
  const maxHeight = 400;
  const visibleItems = Math.floor(maxHeight / itemHeight);

  const Row = ({ index, style }: { index: number; style: any }) => {
    const item = data[index];
    return (
      <div style={style} className="virtual-row">
        <span className="row-label">{item.name}</span>
        <div 
          className="row-bar"
          style={{ 
            width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` 
          }}
        />
        <span className="row-value">{item.value.toLocaleString()}</span>
      </div>
    );
  };

  return (
    <List
      height={Math.min(data.length * itemHeight, maxHeight)}
      itemCount={data.length}
      itemSize={itemHeight}
    >
      {Row}
    </List>
  );
}
```

## テスト戦略

### 1. 単体テスト

```typescript
// src/components/charts/recharts/__tests__/BarChart.test.tsx

import { render, screen, fireEvent } from "@testing-library/react";
import { SimpleBarChart } from "../SimpleBarChart";

describe("SimpleBarChart", () => {
  const mockData = [
    { name: "Item 1", value: 100 },
    { name: "Item 2", value: 200 }
  ];

  it("renders chart with data", () => {
    render(<SimpleBarChart data={mockData} />);
    
    expect(screen.getByText("ランキングデータ")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const onDataPointClick = jest.fn();
    render(
      <SimpleBarChart 
        data={mockData} 
        onDataPointClick={onDataPointClick} 
      />
    );
    
    // クリックイベントのテスト
    const bars = screen.getAllByRole("button");
    fireEvent.click(bars[0]);
    
    expect(onDataPointClick).toHaveBeenCalledWith(mockData[0]);
  });
});
```

### 2. スナップショットテスト

```typescript
import { render } from "@testing-library/react";
import { SimpleBarChart } from "../SimpleBarChart";

describe("BarChart Snapshot", () => {
  it("matches snapshot", () => {
    const { container } = render(
      <SimpleBarChart data={mockData} />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

---

## 関連ドキュメント

- [ライブラリ選択ガイド](./library-selection-guide.md)
- [棒グラフ仕様](./chart-types/bar-chart.md)
- [折れ線グラフ仕様](./chart-types/line-chart.md)

---

**更新履歴**:
- 2025-10-16: 初版作成
