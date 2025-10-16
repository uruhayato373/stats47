# ダッシュボードアーキテクチャ設計

## 概要

ダッシュボードドメインのアーキテクチャは、3階層（全国・都道府県・市区町村）の統計データ可視化を効率的に実現するため、コンポーネント階層、データフロー、状態管理を体系的に設計しています。

## システム全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │  National       │ │  Prefecture     │ │  Municipality   │ │
│  │  Dashboard      │ │  Dashboard      │ │  Dashboard      │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Layout Layer                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              SubcategoryLayout                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │  │  Header     │ │  Content    │ │  Footer     │      │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                  Component Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │  Statistics │ │  Charts     │ │  Maps       │ │  Other  │ │
│  │  Cards      │ │  (Recharts) │ │  (D3.js)    │ │  Widgets│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │  EstatStatsData │ │  EstatMetaInfo  │ │  RankingData    │ │
│  │  Service        │ │  Service        │ │  Service        │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │  e-Stat API     │ │  Cloudflare D1  │ │  Cloudflare R2  │ │
│  │  (External)     │ │  (Metadata)     │ │  (Ranking Data) │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## コンポーネント階層

### 1. ページレベル（Page Level）

```typescript
// src/app/[category]/[subcategory]/dashboard/[areaCode]/page.tsx
export default async function DashboardPage({ params }: PageProps) {
  const { category, subcategory, areaCode } = await params;
  
  // カテゴリ・サブカテゴリの検証
  const subcategoryData = getSubcategoryById(subcategory);
  if (!subcategoryData || subcategoryData.category.id !== category) {
    notFound();
  }
  
  // 地域レベル判定
  const areaLevel = determineAreaLevel(areaCode);
  
  // 適切なダッシュボードコンポーネントを選択
  const DashboardComponent = getDashboardComponentByArea(
    subcategory,
    areaCode,
    category,
    areaLevel
  );
  
  return (
    <DashboardComponent
      category={subcategoryData.category}
      subcategory={subcategoryData.subcategory}
      areaCode={areaCode}
      areaLevel={areaLevel}
    />
  );
}
```

### 2. ダッシュボードレベル（Dashboard Level）

#### 全国ダッシュボード
```typescript
export const NationalDashboard: React.FC<DashboardProps> = ({
  category,
  subcategory,
  areaCode,
  areaLevel
}) => {
  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* 統計カード */}
      <StatisticsCardSection areaCode={areaCode} />
      
      {/* 都道府県ランキング */}
      <PrefectureRankingSection areaCode={areaCode} />
      
      {/* 地域分布地図 */}
      <ChoroplethMapSection areaCode={areaCode} />
      
      {/* 推移グラフ */}
      <TimeSeriesChartSection areaCode={areaCode} />
    </SubcategoryLayout>
  );
};
```

#### 都道府県ダッシュボード
```typescript
export const PrefectureDashboard: React.FC<DashboardProps> = ({
  category,
  subcategory,
  areaCode,
  areaLevel
}) => {
  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* 統計カード */}
      <StatisticsCardSection areaCode={areaCode} />
      
      {/* 全国比較 */}
      <NationalComparisonSection areaCode={areaCode} />
      
      {/* 市区町村ランキング */}
      <MunicipalityRankingSection areaCode={areaCode} />
      
      {/* 推移グラフ */}
      <TimeSeriesChartSection areaCode={areaCode} />
    </SubcategoryLayout>
  );
};
```

#### 市区町村ダッシュボード
```typescript
export const MunicipalityDashboard: React.FC<DashboardProps> = ({
  category,
  subcategory,
  areaCode,
  areaLevel
}) => {
  const prefectureCode = getPrefectureCodeFromMunicipality(areaCode);
  
  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* 統計カード */}
      <StatisticsCardSection areaCode={areaCode} />
      
      {/* 都道府県内順位 */}
      <PrefectureRankingSection 
        areaCode={areaCode} 
        prefectureCode={prefectureCode} 
      />
      
      {/* 周辺比較 */}
      <NeighboringComparisonSection areaCode={areaCode} />
      
      {/* 推移グラフ */}
      <TimeSeriesChartSection areaCode={areaCode} />
    </SubcategoryLayout>
  );
};
```

### 3. ウィジェットレベル（Widget Level）

#### 統計カード
```typescript
interface StatisticsCardProps {
  params: {
    statsDataId: string;
    cdCat01: string;
  };
  areaCode: string;
  title: string;
  color: string;
  showComparison?: boolean;
}

export const StatisticsMetricCard: React.FC<StatisticsCardProps> = ({
  params,
  areaCode,
  title,
  color,
  showComparison = true
}) => {
  const { data, loading, error } = useEstatData(params, areaCode);
  
  if (loading) return <CardSkeleton />;
  if (error) return <CardError error={error} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-neutral-400">
        {title}
      </h3>
      <div className="mt-2">
        <div className="text-2xl font-bold" style={{ color }}>
          {formatNumber(data.value)}
        </div>
        {showComparison && data.previousValue && (
          <div className="text-sm text-gray-500">
            {formatComparison(data.value, data.previousValue)}
          </div>
        )}
      </div>
    </div>
  );
};
```

#### 時系列グラフ
```typescript
interface TimeSeriesChartProps {
  params: {
    statsDataId: string;
    cdCat01: string;
  };
  areaCode: string;
  title: string;
  years: string[];
  chartType: 'line' | 'bar' | 'area';
}

export const EstatTimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  params,
  areaCode,
  title,
  years,
  chartType
}) => {
  const { data, loading, error } = useEstatTimeSeriesData(params, areaCode, years);
  
  if (loading) return <ChartSkeleton />;
  if (error) return <ChartError error={error} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'line' ? (
          <LineChart data={data}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        ) : chartType === 'bar' ? (
          <BarChart data={data}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        ) : (
          <AreaChart data={data}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
```

## データフロー設計

### 1. データ取得の流れ

```typescript
// データ取得のライフサイクル
class DashboardDataFlow {
  async fetchDashboardData(
    category: string,
    subcategory: string,
    areaCode: string,
    areaLevel: AreaLevel
  ) {
    // 1. メタデータの取得（キャッシュ優先）
    const metadata = await this.getMetadata(category, subcategory);
    
    // 2. 統計表IDとカテゴリコードの決定
    const statsConfig = this.determineStatsConfig(metadata, areaLevel);
    
    // 3. データの取得（階層別戦略）
    const data = await this.fetchDataByLevel(statsConfig, areaCode, areaLevel);
    
    // 4. データの整形と変換
    const formattedData = this.formatData(data, areaLevel);
    
    return formattedData;
  }
  
  private async fetchDataByLevel(
    config: StatsConfig,
    areaCode: string,
    areaLevel: AreaLevel
  ) {
    switch (areaLevel) {
      case 'national':
        return await this.fetchNationalData(config, areaCode);
      case 'prefecture':
        return await this.fetchPrefectureData(config, areaCode);
      case 'municipality':
        return await this.fetchMunicipalityData(config, areaCode);
    }
  }
}
```

### 2. キャッシュ戦略

```typescript
class DashboardCacheStrategy {
  private memoryCache = new Map<string, CachedData>();
  private r2Cache: R2Service;
  private d1Cache: D1Database;
  
  async getData(key: string): Promise<any> {
    // 1. メモリキャッシュをチェック
    const memoryData = this.memoryCache.get(key);
    if (memoryData && !this.isExpired(memoryData)) {
      return memoryData.data;
    }
    
    // 2. R2キャッシュをチェック
    const r2Data = await this.r2Cache.get(key);
    if (r2Data) {
      this.memoryCache.set(key, r2Data);
      return r2Data.data;
    }
    
    // 3. D1データベースをチェック
    const d1Data = await this.d1Cache.get(key);
    if (d1Data) {
      this.memoryCache.set(key, d1Data);
      return d1Data.data;
    }
    
    return null;
  }
  
  async setData(key: string, data: any, ttl: number = 3600) {
    const cachedData = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    // メモリキャッシュに保存
    this.memoryCache.set(key, cachedData);
    
    // R2キャッシュに保存（非同期）
    this.r2Cache.set(key, cachedData, ttl).catch(console.error);
  }
}
```

## 状態管理

### 1. ローカル状態管理

```typescript
// カスタムフックによる状態管理
export function useDashboardData(
  category: string,
  subcategory: string,
  areaCode: string
) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await DashboardDataFlow.fetchDashboardData(
          category,
          subcategory,
          areaCode
        );
        
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [category, subcategory, areaCode]);
  
  return { data, loading, error };
}
```

### 2. グローバル状態管理

```typescript
// Context APIを使用したグローバル状態
interface DashboardContextType {
  selectedArea: string;
  selectedCategory: string;
  selectedSubcategory: string;
  areaLevel: AreaLevel;
  setSelectedArea: (area: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedSubcategory: (subcategory: string) => void;
}

export const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedArea, setSelectedArea] = useState('00000');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  
  const areaLevel = determineAreaLevel(selectedArea);
  
  const value = {
    selectedArea,
    selectedCategory,
    selectedSubcategory,
    areaLevel,
    setSelectedArea,
    setSelectedCategory,
    setSelectedSubcategory
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
```

## 動的ルーティングとコンポーネント解決

### 1. コンポーネント解決システム

```typescript
// 動的コンポーネント解決
export function getDashboardComponentByArea(
  subcategory: string,
  areaCode: string,
  category: string,
  areaLevel: AreaLevel
): React.ComponentType<DashboardProps> {
  const componentMap = {
    national: `${subcategory}NationalDashboard`,
    prefecture: `${subcategory}PrefectureDashboard`,
    municipality: `${subcategory}MunicipalityDashboard`
  };
  
  const componentName = componentMap[areaLevel];
  
  // 動的インポート
  return lazy(() => 
    import(`@/components/subcategories/${category}/${subcategory}/${componentName}`)
      .then(module => ({ default: module[componentName] }))
  );
}
```

### 2. 地域レベル判定

```typescript
export function determineAreaLevel(areaCode: string): AreaLevel {
  if (areaCode === '00000') {
    return 'national';
  }
  
  if (areaCode.match(/^\d{2}000$/)) {
    return 'prefecture';
  }
  
  if (areaCode.match(/^\d{5}$/)) {
    return 'municipality';
  }
  
  throw new Error(`Invalid area code: ${areaCode}`);
}
```

## パフォーマンス最適化

### 1. コード分割

```typescript
// 動的インポートによるコード分割
const NationalDashboard = lazy(() => 
  import('./NationalDashboard').then(module => ({ default: module.NationalDashboard }))
);

const PrefectureDashboard = lazy(() => 
  import('./PrefectureDashboard').then(module => ({ default: module.PrefectureDashboard }))
);

const MunicipalityDashboard = lazy(() => 
  import('./MunicipalityDashboard').then(module => ({ default: module.MunicipalityDashboard }))
);
```

### 2. 遅延ロード

```typescript
// 重いコンポーネントの遅延ロード
export function LazyChoroplethMap({ areaCode, data }: ChoroplethMapProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref}>
      {isVisible ? (
        <ChoroplethMap areaCode={areaCode} data={data} />
      ) : (
        <MapSkeleton />
      )}
    </div>
  );
}
```

### 3. メモ化

```typescript
// React.memoによる再レンダリング最適化
export const StatisticsMetricCard = React.memo<StatisticsCardProps>(({
  params,
  areaCode,
  title,
  color
}) => {
  // コンポーネント実装
});

// useMemoによる計算結果のキャッシュ
export function useFormattedData(rawData: any[]) {
  return useMemo(() => {
    return rawData.map(item => ({
      ...item,
      formattedValue: formatNumber(item.value),
      trend: calculateTrend(item.value, item.previousValue)
    }));
  }, [rawData]);
}
```

## エラーハンドリング

### 1. エラー境界

```typescript
export class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            ダッシュボードの読み込みに失敗しました
          </h2>
          <p className="text-gray-600 mb-4">
            データの取得中にエラーが発生しました。しばらく時間をおいてから再度お試しください。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 2. フォールバック表示

```typescript
// データ取得失敗時のフォールバック
export function DashboardWithFallback({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const { error } = useDashboardData();
  
  if (error) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
```

## セキュリティ考慮事項

### 1. 入力検証

```typescript
// 地域コードの検証
export function validateAreaCode(areaCode: string): boolean {
  // 全国
  if (areaCode === '00000') return true;
  
  // 都道府県（XX000形式）
  if (areaCode.match(/^[0-4][0-9]000$/)) return true;
  
  // 市区町村（XXXXX形式）
  if (areaCode.match(/^[0-4][0-9][0-9][0-9][0-9]$/)) return true;
  
  return false;
}
```

### 2. XSS対策

```typescript
// データのサニタイゼーション
export function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    return data.replace(/[<>]/g, '');
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  
  return data;
}
```

## まとめ

ダッシュボードアーキテクチャは、3階層の統計データ可視化を効率的に実現するため、以下の設計原則に基づいて構築されています：

1. **階層化**: 明確な責任分離による保守性の向上
2. **再利用性**: コンポーネントの再利用による開発効率の向上
3. **パフォーマンス**: キャッシュ戦略と遅延ロードによる高速化
4. **拡張性**: 新しい可視化タイプの容易な追加
5. **堅牢性**: エラーハンドリングとフォールバック機能

このアーキテクチャにより、全国・都道府県・市区町村の各レベルで最適化されたダッシュボードを提供し、ユーザーが直感的に統計情報を理解できるシステムを実現しています。
