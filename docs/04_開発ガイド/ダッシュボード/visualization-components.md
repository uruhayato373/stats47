---
title: 可視化コンポーネント仕様
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/dashboard
  - specifications
---

# 可視化コンポーネント仕様

## 概要

ダッシュボードドメインでは、統計データを効果的に可視化するため、様々な種類のコンポーネントを提供しています。これらのコンポーネントは、全国・都道府県・市区町村の3階層すべてで使用でき、それぞれの階層に最適化された表示を行います。

## コンポーネント分類

### 1. 統計カード系
- **StatisticsMetricCard**: 単一指標の数値表示
- **ComparisonCard**: 比較データ付きカード
- **TrendCard**: トレンド表示付きカード

### 2. 時系列グラフ系
- **EstatLineChart**: 単一系列折れ線グラフ
- **EstatMultiLineChart**: 複数系列折れ線グラフ
- **EstatAreaChart**: エリアチャート
- **EstatBarChart**: 棒グラフ

### 3. 構成比グラフ系
- **EstatGenderDonutChart**: 男女比率円グラフ
- **EstatPopulationPyramid**: 人口ピラミッド
- **EstatPieChart**: 一般的な円グラフ
- **EstatDonutChart**: ドーナツチャート

### 4. 比較・ランキング系
- **StackedBarChart**: 積み上げ棒グラフ
- **RankingChart**: ランキング表示
- **ComparisonChart**: 比較グラフ

### 5. 地図系
- **PrefectureChoroplethMap**: 都道府県別コロプレス地図
- **MunicipalityChoroplethMap**: 市区町村別コロプレス地図
- **InteractiveMap**: インタラクティブ地図

## 統計カードコンポーネント

### StatisticsMetricCard

単一指標の数値を表示する基本的なカードコンポーネントです。

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
}

export const StatisticsMetricCard: React.FC<StatisticsMetricCardProps> = ({
  params,
  areaCode,
  title,
  color,
  showComparison = true,
  showTrend = true,
  format = 'number',
  unit
}) => {
  const { data, loading, error } = useEstatData(params, areaCode);
  
  if (loading) return <CardSkeleton />;
  if (error) return <CardError error={error} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-neutral-400 mb-2">
        {title}
      </h3>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold" style={{ color }}>
          {formatValue(data.value, format)}
          {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
        </div>
        {showTrend && data.previousValue && (
          <TrendIndicator
            current={data.value}
            previous={data.previousValue}
            format={format}
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

### ComparisonCard

比較データを表示するカードコンポーネントです。

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
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  params,
  areaCode,
  compareAreaCode,
  title,
  color
}) => {
  const { data: currentData } = useEstatData(params, areaCode);
  const { data: compareData } = useEstatData(params, compareAreaCode);
  
  const comparison = calculateComparison(currentData.value, compareData.value);
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">現在の地域</span>
          <span className="font-semibold" style={{ color }}>
            {formatNumber(currentData.value)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">比較対象</span>
          <span className="text-gray-600">
            {formatNumber(compareData.value)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">差</span>
          <div className="flex items-center">
            <span className={`font-semibold ${comparison.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {comparison.isPositive ? '+' : ''}{comparison.difference}
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

## 時系列グラフコンポーネント

### EstatLineChart

時系列データを折れ線グラフで表示するコンポーネントです。

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
}

export const EstatLineChart: React.FC<EstatLineChartProps> = ({
  params,
  areaCode,
  title,
  years,
  color = '#8884d8',
  showDataPoints = true,
  showGrid = true,
  height = 300
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
          <Tooltip 
            formatter={(value: any) => [formatNumber(value), title]}
            labelFormatter={(label) => `${label}年`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
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

### EstatMultiLineChart

複数の系列を同時に表示する折れ線グラフです。

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
}

export const EstatMultiLineChart: React.FC<EstatMultiLineChartProps> = ({
  params,
  areaCode,
  title,
  years,
  series,
  height = 300
}) => {
  const { data, loading, error } = useEstatMultiTimeSeriesData(params, areaCode, years);
  
  if (loading) return <ChartSkeleton height={height} />;
  if (error) return <ChartError error={error} height={height} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={formatNumber} />
          <Tooltip 
            formatter={(value: any, name: string) => [
              formatNumber(value), 
              series.find(s => s.key === name)?.name || name
            ]}
            labelFormatter={(label) => `${label}年`}
          />
          <Legend />
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

## 構成比グラフコンポーネント

### EstatGenderDonutChart

男女比率をドーナツチャートで表示するコンポーネントです。

```typescript
interface EstatGenderDonutChartProps {
  params: {
    statsDataId: string;
  };
  areaCode: string;
  maleCategoryCode: string;
  femaleCategoryCode: string;
  title: string;
  width?: number;
  height?: number;
}

export const EstatGenderDonutChart: React.FC<EstatGenderDonutChartProps> = ({
  params,
  areaCode,
  maleCategoryCode,
  femaleCategoryCode,
  title,
  width = 300,
  height = 300
}) => {
  const { data, loading, error } = useEstatGenderData(
    params, 
    areaCode, 
    maleCategoryCode, 
    femaleCategoryCode
  );
  
  if (loading) return <ChartSkeleton width={width} height={height} />;
  if (error) return <ChartError error={error} width={width} height={height} />;
  
  const chartData = [
    { name: '男性', value: data.male, color: '#3b82f6' },
    { name: '女性', value: data.female, color: '#ec4899' }
  ];
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      <div className="flex justify-center">
        <ResponsiveContainer width={width} height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [
                `${formatNumber(value)}人 (${((value / data.total) * 100).toFixed(1)}%)`,
                '人数'
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
```

### EstatPopulationPyramid

年齢別人口構成を人口ピラミッドで表示するコンポーネントです。

```typescript
interface EstatPopulationPyramidProps {
  params: {
    statsDataId: string;
  };
  areaCode: string;
  title: string;
  width?: number;
  height?: number;
}

export const EstatPopulationPyramid: React.FC<EstatPopulationPyramidProps> = ({
  params,
  areaCode,
  title,
  width = 600,
  height = 400
}) => {
  const { data, loading, error } = useEstatPopulationPyramidData(params, areaCode);
  
  if (loading) return <ChartSkeleton width={width} height={height} />;
  if (error) return <ChartError error={error} width={width} height={height} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      <div className="flex justify-center">
        <PopulationPyramidChart
          data={data}
          width={width}
          height={height}
        />
      </div>
    </div>
  );
};
```

## 比較・ランキングコンポーネント

### StackedBarChart

積み上げ棒グラフで内訳を表示するコンポーネントです。

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
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data,
  title,
  series,
  height = 300,
  horizontal = false
}) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {horizontal ? (
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={formatNumber} />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip formatter={(value: any) => [formatNumber(value), '']} />
            <Legend />
            {series.map(serie => (
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
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatNumber} />
            <Tooltip formatter={(value: any) => [formatNumber(value), '']} />
            <Legend />
            {series.map(serie => (
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

## 地図コンポーネント

### PrefectureChoroplethMap

都道府県別のコロプレス地図を表示するコンポーネントです。

```typescript
interface PrefectureChoroplethMapProps {
  data: Array<{
    prefectureCode: string;
    value: number;
    name: string;
  }>;
  title: string;
  metric: string;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple';
  height?: number;
}

export const PrefectureChoroplethMap: React.FC<PrefectureChoroplethMapProps> = ({
  data,
  title,
  metric,
  colorScheme = 'blue',
  height = 400
}) => {
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="relative">
        <ChoroplethMap
          data={data}
          metric={metric}
          colorScheme={colorScheme}
          height={height}
          onPrefectureClick={setSelectedPrefecture}
          selectedPrefecture={selectedPrefecture}
        />
        <MapLegend
          data={data}
          metric={metric}
          colorScheme={colorScheme}
        />
      </div>
    </div>
  );
};
```

### MunicipalityChoroplethMap

市区町村別のコロプレス地図を表示するコンポーネントです。

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
  colorScheme?: 'blue' | 'green' | 'red' | 'purple';
  height?: number;
}

export const MunicipalityChoroplethMap: React.FC<MunicipalityChoroplethMapProps> = ({
  prefectureCode,
  data,
  title,
  metric,
  colorScheme = 'blue',
  height = 400
}) => {
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
            className="px-2 py-1 text-sm border rounded"
          >
            -
          </button>
          <span className="px-2 py-1 text-sm">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
            className="px-2 py-1 text-sm border rounded"
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
          colorScheme={colorScheme}
          height={height}
          zoomLevel={zoomLevel}
          onMunicipalityClick={setSelectedMunicipality}
          selectedMunicipality={selectedMunicipality}
        />
        <MapLegend
          data={data}
          metric={metric}
          colorScheme={colorScheme}
        />
      </div>
    </div>
  );
};
```

## 共通機能

### データ取得フック

```typescript
// 統計データ取得フック
export function useEstatData(
  params: { statsDataId: string; cdCat01: string },
  areaCode: string
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await EstatStatsDataService.getAndFormatStatsData(
          params.statsDataId,
          {
            categoryFilter: params.cdCat01,
            areaFilter: areaCode
          }
        );
        
        setData(result.values[0] || { value: null });
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.statsDataId, params.cdCat01, areaCode]);
  
  return { data, loading, error };
}
```

### ユーティリティ関数

```typescript
// 数値フォーマット
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

// 比較計算
export function calculateComparison(current: number, previous: number) {
  const difference = current - previous;
  const percentage = previous !== 0 ? (difference / previous) * 100 : 0;
  
  return {
    difference,
    percentage: Math.abs(percentage).toFixed(1),
    isPositive: difference >= 0
  };
}

// トレンドインジケーター
export function TrendIndicator({ current, previous, format }: {
  current: number;
  previous: number;
  format: string;
}) {
  const comparison = calculateComparison(current, previous);
  
  return (
    <div className={`flex items-center text-sm ${
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

## アクセシビリティ対応

### キーボードナビゲーション

```typescript
// キーボードで操作可能なグラフコンポーネント
export function AccessibleChart({ children, ...props }: ChartProps) {
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
        // 次の要素にフォーカス
        break;
      case 'ArrowLeft':
        // 前の要素にフォーカス
        break;
      case 'Enter':
      case ' ':
        // 要素を選択
        break;
    }
  };
  
  return (
    <div
      role="img"
      aria-label="統計グラフ"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </div>
  );
}
```

### スクリーンリーダー対応

```typescript
// グラフの代替テキスト生成
export function generateChartAltText(
  chartType: string,
  data: any[],
  title: string
): string {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  
  return `${title}の${chartType}。最大値は${formatNumber(maxValue)}、最小値は${formatNumber(minValue)}。データポイント数は${data.length}個。`;
}
```

## まとめ

可視化コンポーネント仕様は、統計データを効果的に可視化するための包括的なシステムです。主な特徴は以下の通りです：

1. **多様な可視化タイプ**: 統計カード、時系列グラフ、構成比グラフ、地図など
2. **階層対応**: 全国・都道府県・市区町村の3階層すべてで使用可能
3. **インタラクティブ機能**: ホバー、クリック、ズームなどの操作
4. **アクセシビリティ**: キーボードナビゲーション、スクリーンリーダー対応
5. **カスタマイズ性**: 色、サイズ、フォーマットなどの柔軟な設定
6. **パフォーマンス**: 遅延読み込み、メモ化による最適化

これらのコンポーネントにより、ユーザーは直感的に統計データを理解し、地域間の比較や時系列の変化を把握することができます。
