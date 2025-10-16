# ベストプラクティス

## 概要

このガイドでは、ダッシュボードドメインの開発において重要なベストプラクティスについて説明します。パフォーマンス、アクセシビリティ、保守性、テストの観点から、高品質なダッシュボードを構築するための指針を提供します。

## パフォーマンス最適化

### 1. コンポーネントの最適化

#### メモ化の活用

```typescript
// コンポーネントのメモ化
export const StatisticsMetricCard = React.memo<StatisticsMetricCardProps>(({
  params,
  areaCode,
  title,
  color,
  ...props
}) => {
  const { data, loading, error } = useEstatData(params, areaCode);
  
  if (loading) return <CardSkeleton />;
  if (error) return <CardError error={error} />;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      {/* コンテンツ */}
    </div>
  );
});

// コールバックのメモ化
const handleDataUpdate = useCallback((newData: any) => {
  setData(newData);
}, []);

// 値のメモ化
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);
```

#### 遅延読み込み

```typescript
// コンポーネントの遅延読み込み
const LazyChart = lazy(() => import('./EstatLineChart'));

// 使用例
<Suspense fallback={<ChartSkeleton />}>
  <LazyChart {...chartProps} />
</Suspense>

// セクションの遅延読み込み
export function LazySection({ children, threshold = 0.1 }: LazySectionProps) {
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
      { threshold }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [threshold]);
  
  return (
    <div ref={ref}>
      {isVisible ? children : <SectionSkeleton />}
    </div>
  );
}
```

### 2. データ取得の最適化

#### 並列データ取得

```typescript
// 複数のデータを並列で取得
export function useMultipleEstatData(requests: DataRequest[]) {
  const [data, setData] = useState<EstatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const results = await Promise.allSettled(
          requests.map(request => 
            EstatDataService.getStatsData(
              request.statsDataId,
              request.categoryCode,
              request.areaCode
            )
          )
        );
        
        const successfulResults = results
          .filter((result): result is PromiseFulfilledResult<EstatData> => 
            result.status === 'fulfilled'
          )
          .map(result => result.value);
        
        setData(successfulResults);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [requests]);
  
  return { data, loading, error };
}
```

#### キャッシュ戦略

```typescript
// 多層キャッシュの実装
export class MultiLayerCache {
  private memoryCache = new MemoryCache();
  private r2Cache = new R2Cache();
  private d1Cache = new D1Cache();
  
  async get(key: string): Promise<any> {
    // 1. メモリキャッシュをチェック
    let data = this.memoryCache.get(key);
    if (data) return data;
    
    // 2. R2キャッシュをチェック
    data = await this.r2Cache.get(key);
    if (data) {
      this.memoryCache.set(key, data);
      return data;
    }
    
    // 3. D1データベースをチェック
    data = await this.d1Cache.get(key);
    if (data) {
      this.memoryCache.set(key, data);
      return data;
    }
    
    return null;
  }
  
  async set(key: string, data: any, ttl: number = 3600): Promise<void> {
    // メモリキャッシュに保存
    this.memoryCache.set(key, data, ttl);
    
    // R2キャッシュに保存（非同期）
    this.r2Cache.set(key, data, ttl).catch(console.error);
    
    // D1データベースに保存（非同期）
    this.d1Cache.set(key, data, ttl).catch(console.error);
  }
}
```

### 3. レンダリング最適化

#### 仮想スクロール

```typescript
// 大量データの仮想スクロール
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

## アクセシビリティ

### 1. セマンティックHTML

```typescript
// セマンティックなHTML構造
export function AccessibleDashboard({ children }: { children: React.ReactNode }) {
  return (
    <main role="main" aria-label="統計ダッシュボード">
      <section aria-labelledby="statistics-heading">
        <h2 id="statistics-heading" className="sr-only">
          統計データ
        </h2>
        {children}
      </section>
    </main>
  );
}

// フォーム要素のアクセシビリティ
export function AccessibleForm({ children, onSubmit }: FormProps) {
  return (
    <form
      onSubmit={onSubmit}
      role="form"
      aria-label="データ検索フォーム"
    >
      {children}
    </form>
  );
}
```

### 2. キーボードナビゲーション

```typescript
// キーボードで操作可能なコンポーネント
export function KeyboardNavigable({ 
  children, 
  onKeyDown 
}: KeyboardNavigableProps) {
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
      case 'Escape':
        // フォーカスを解除
        break;
    }
    
    onKeyDown?.(event);
  };
  
  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </div>
  );
}
```

### 3. スクリーンリーダー対応

```typescript
// スクリーンリーダー用のテキスト
export function ScreenReaderText({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

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

// 使用例
<button aria-label="統計データを更新">
  <RefreshIcon className="h-5 w-5" />
  <ScreenReaderText>統計データを更新</ScreenReaderText>
</button>
```

## エラーハンドリング

### 1. エラーバウンダリ

```typescript
// エラーバウンダリコンポーネント
export class DashboardErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
    
    // エラーレポートの送信
    this.reportError(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">
            申し訳ございませんが、予期しないエラーが発生しました。
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            再試行
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
  
  private reportError(error: Error, errorInfo: ErrorInfo) {
    // エラーレポートの送信ロジック
  }
}
```

### 2. フォールバック戦略

```typescript
// フォールバック戦略の実装
export class FallbackStrategy {
  static async fetchDataWithFallback(
    params: { statsDataId: string; cdCat01: string },
    areaCode: string
  ): Promise<DashboardData> {
    try {
      // 1. 通常のデータ取得を試行
      return await EstatDataService.getStatsData(
        params.statsDataId,
        params.cdCat01,
        areaCode
      );
    } catch (error) {
      console.warn('通常のデータ取得に失敗、フォールバックを試行:', error);
      
      try {
        // 2. キャッシュからの取得を試行
        return await this.fetchFromCache(params, areaCode);
      } catch (cacheError) {
        console.warn('キャッシュからの取得に失敗、サンプルデータを使用:', cacheError);
        
        // 3. サンプルデータの使用
        return await this.getSampleData(params, areaCode);
      }
    }
  }
  
  private static async fetchFromCache(
    params: { statsDataId: string; cdCat01: string },
    areaCode: string
  ): Promise<DashboardData> {
    const cacheKey = generateCacheKey(params, areaCode);
    const cachedData = await MultiLayerCache.get(cacheKey);
    
    if (!cachedData) {
      throw new Error('キャッシュデータが見つかりません');
    }
    
    return cachedData;
  }
  
  private static async getSampleData(
    params: { statsDataId: string; cdCat01: string },
    areaCode: string
  ): Promise<DashboardData> {
    // サンプルデータの生成
    return {
      values: [{
        areaCode,
        value: Math.floor(Math.random() * 1000000),
        unit: '人',
        categoryCode: params.cdCat01,
        categoryName: 'サンプルデータ',
        timeCode: '2023',
        timeName: '2023年'
      }],
      areas: [],
      categories: [],
      years: [],
      metadata: {
        areaCode,
        lastUpdated: new Date().toISOString(),
        source: 'Sample Data',
        isFallback: true
      }
    };
  }
}
```

## テスト戦略

### 1. コンポーネントテスト

```typescript
// コンポーネントテストの例
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
  
  it('should show loading state', () => {
    // ローディング状態のテスト
  });
  
  it('should show error state', () => {
    // エラー状態のテスト
  });
  
  it('should be accessible', () => {
    render(<StatisticsMetricCard {...mockProps} />);
    
    // アクセシビリティのテスト
    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByLabelText('総人口')).toBeInTheDocument();
  });
});
```

### 2. 統合テスト

```typescript
// 統合テストの例
describe('Dashboard Integration', () => {
  it('should render complete dashboard', async () => {
    render(<BasicPopulationNationalDashboard {...mockProps} />);
    
    // 統計カードの表示確認
    expect(screen.getByText('全国総人口')).toBeInTheDocument();
    expect(screen.getByText('全国昼夜間人口比率')).toBeInTheDocument();
    
    // グラフの表示確認
    expect(screen.getByText('都道府県別人口ランキング')).toBeInTheDocument();
    expect(screen.getByText('都道府県別人口分布')).toBeInTheDocument();
    
    // データの読み込み完了を待つ
    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });
  });
  
  it('should handle data loading errors', async () => {
    // エラー状態のテスト
    mockEstatApiError();
    
    render(<BasicPopulationNationalDashboard {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });
});
```

### 3. パフォーマンステスト

```typescript
// パフォーマンステストの例
describe('Dashboard Performance', () => {
  it('should render within acceptable time', () => {
    const start = performance.now();
    
    render(<BasicPopulationNationalDashboard {...mockProps} />);
    
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
    
    render(<MunicipalityRankingSection data={largeDataset} />);
    
    const end = performance.now();
    const renderTime = end - start;
    
    expect(renderTime).toBeLessThan(2000); // 2秒以内
  });
});
```

## コード品質

### 1. TypeScriptの活用

```typescript
// 厳密な型定義
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

// 型ガードの使用
function isEstatApiError(error: unknown): error is EstatApiError {
  return error instanceof EstatApiError;
}

// ユニオン型の活用
type AreaLevel = 'national' | 'prefecture' | 'municipality';
type ErrorLevel = 'critical' | 'error' | 'warning' | 'info';
```

### 2. 定数の管理

```typescript
// 定数の定義
export const DASHBOARD_CONFIG = {
  CACHE_TTL: 24 * 60 * 60 * 1000, // 24時間
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1秒
  CONCURRENT_REQUESTS: 3
} as const;

// 環境変数の型安全な取得
export function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}
```

### 3. ログ管理

```typescript
// ログレベルの定義
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// ロガークラス
export class Logger {
  private static logLevel: LogLevel = LogLevel.INFO;
  
  static setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
  
  static debug(message: string, context?: any): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, context);
    }
  }
  
  static info(message: string, context?: any): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, context);
    }
  }
  
  static warn(message: string, context?: any): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, context);
    }
  }
  
  static error(message: string, context?: any): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, context);
    }
  }
}
```

## セキュリティ

### 1. データ検証

```typescript
// 入力データの検証
export function validateAreaCode(areaCode: string): boolean {
  // 全国レベル
  if (areaCode === '00000') return true;
  
  // 都道府県レベル（XX000形式）
  if (areaCode.match(/^[0-4][0-9]000$/)) return true;
  
  // 市区町村レベル（XXXXX形式）
  if (areaCode.match(/^[0-4][0-9][0-9][0-9][0-9]$/)) return true;
  
  return false;
}

// 統計表IDの検証
export function validateStatsDataId(statsDataId: string): boolean {
  return /^\d{11}$/.test(statsDataId);
}
```

### 2. XSS対策

```typescript
// データのサニタイズ
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

ベストプラクティスガイドでは、以下の内容を説明しました：

1. **パフォーマンス最適化**: メモ化、遅延読み込み、並列データ取得、キャッシュ戦略
2. **アクセシビリティ**: セマンティックHTML、キーボードナビゲーション、スクリーンリーダー対応
3. **エラーハンドリング**: エラーバウンダリ、フォールバック戦略
4. **テスト戦略**: コンポーネントテスト、統合テスト、パフォーマンステスト
5. **コード品質**: TypeScriptの活用、定数管理、ログ管理
6. **セキュリティ**: データ検証、XSS対策

これらのベストプラクティスに従うことで、高品質で保守性の高いダッシュボードを構築することができます。
