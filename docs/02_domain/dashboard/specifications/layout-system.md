# レイアウトシステム

## 概要

ダッシュボードドメインのレイアウトシステムは、全国・都道府県・市区町村の3階層で最適化された表示を提供するため、レスポンシブデザインと固定順序レイアウトを採用しています。

## レイアウト階層

### 1. ページレベル（Page Level）

```typescript
// src/app/[category]/[subcategory]/dashboard/[areaCode]/page.tsx
export default async function DashboardPage({ params }: PageProps) {
  const { category, subcategory, areaCode } = await params;
  
  // 地域レベル判定
  const areaLevel = determineAreaLevel(areaCode);
  
  // ダッシュボードコンポーネント選択
  const DashboardComponent = getDashboardComponentByArea(
    subcategory,
    areaCode,
    category,
    areaLevel
  );
  
  return (
    <DashboardComponent
      category={category}
      subcategory={subcategory}
      areaCode={areaCode}
      areaLevel={areaLevel}
    />
  );
}
```

### 2. レイアウトレベル（Layout Level）

```typescript
// SubcategoryLayout による統一レイアウト
export function SubcategoryLayout({
  category,
  subcategory,
  viewType,
  areaCode,
  children
}: SubcategoryLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* ヘッダー */}
      <SubcategoryHeader
        category={category}
        subcategory={subcategory}
        areaCode={areaCode}
      />
      
      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      
      {/* フッター */}
      <SubcategoryFooter />
    </div>
  );
}
```

### 3. ダッシュボードレベル（Dashboard Level）

各階層のダッシュボードコンポーネントは、固定順序のセクション構造を持ちます。

## 階層別レイアウトパターン

### 全国ダッシュボードレイアウト

```typescript
export const NationalDashboardLayout: React.FC<DashboardProps> = ({
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
      {/* 1. 統計カードセクション */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatisticsMetricCard
            params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
            areaCode={areaCode}
            title="全国総人口"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{ statsDataId: "0000010101", cdCat01: "A6108" }}
            areaCode={areaCode}
            title="昼夜間人口比率"
            color="#10b981"
          />
          <EstatGenderDonutChart
            params={{ statsDataId: "0000010101" }}
            areaCode={areaCode}
            maleCategoryCode="A110101"
            femaleCategoryCode="A110102"
            title="男女人口比率"
          />
        </div>
      </section>

      {/* 2. 都道府県ランキングセクション */}
      <section className="mb-8">
        <PrefectureRankingSection areaCode={areaCode} />
      </section>

      {/* 3. 地域分布地図セクション */}
      <section className="mb-8">
        <ChoroplethMapSection areaCode={areaCode} />
      </section>

      {/* 4. 推移グラフセクション */}
      <section className="mb-8">
        <TimeSeriesChartSection areaCode={areaCode} />
      </section>

      {/* 5. 詳細分析セクション */}
      <section className="mb-8">
        <DetailedAnalysisSection areaCode={areaCode} />
      </section>
    </SubcategoryLayout>
  );
};
```

### 都道府県ダッシュボードレイアウト

```typescript
export const PrefectureDashboardLayout: React.FC<DashboardProps> = ({
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
      {/* 1. 統計カードセクション */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatisticsMetricCard
            params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
            areaCode={areaCode}
            title="総人口"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{ statsDataId: "0000010101", cdCat01: "A6108" }}
            areaCode={areaCode}
            title="昼夜間人口比率"
            color="#10b981"
          />
          <EstatGenderDonutChart
            params={{ statsDataId: "0000010101" }}
            areaCode={areaCode}
            maleCategoryCode="A110101"
            femaleCategoryCode="A110102"
            title="男女人口比率"
          />
        </div>
      </section>

      {/* 2. 全国比較セクション */}
      <section className="mb-8">
        <NationalComparisonSection areaCode={areaCode} />
      </section>

      {/* 3. 市区町村ランキングセクション */}
      <section className="mb-8">
        <MunicipalityRankingSection areaCode={areaCode} />
      </section>

      {/* 4. 推移グラフセクション */}
      <section className="mb-8">
        <TimeSeriesChartSection areaCode={areaCode} />
      </section>

      {/* 5. 周辺都道府県比較セクション */}
      <section className="mb-8">
        <NeighboringPrefectureComparisonSection areaCode={areaCode} />
      </section>
    </SubcategoryLayout>
  );
};
```

### 市区町村ダッシュボードレイアウト

```typescript
export const MunicipalityDashboardLayout: React.FC<DashboardProps> = ({
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
      {/* 1. 統計カードセクション */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatisticsMetricCard
            params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
            areaCode={areaCode}
            title="総人口"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{ statsDataId: "0000010101", cdCat01: "A6108" }}
            areaCode={areaCode}
            title="昼夜間人口比率"
            color="#10b981"
          />
          <EstatGenderDonutChart
            params={{ statsDataId: "0000010101" }}
            areaCode={areaCode}
            maleCategoryCode="A110101"
            femaleCategoryCode="A110102"
            title="男女人口比率"
          />
        </div>
      </section>

      {/* 2. 都道府県内順位セクション */}
      <section className="mb-8">
        <PrefectureRankingSection 
          areaCode={areaCode} 
          prefectureCode={prefectureCode} 
        />
      </section>

      {/* 3. 周辺比較セクション */}
      <section className="mb-8">
        <NeighboringMunicipalityComparisonSection areaCode={areaCode} />
      </section>

      {/* 4. 推移グラフセクション */}
      <section className="mb-8">
        <TimeSeriesChartSection areaCode={areaCode} />
      </section>

      {/* 5. 市区町村地図セクション */}
      <section className="mb-8">
        <MunicipalityMapSection 
          areaCode={areaCode} 
          prefectureCode={prefectureCode} 
        />
      </section>
    </SubcategoryLayout>
  );
};
```

## グリッドシステム

### レスポンシブグリッド

```typescript
// グリッドクラスの定義
const GRID_CLASSES = {
  // 統計カード用グリッド
  cards: {
    mobile: 'grid-cols-1',
    tablet: 'md:grid-cols-2',
    desktop: 'lg:grid-cols-3'
  },
  
  // グラフ用グリッド
  charts: {
    mobile: 'grid-cols-1',
    tablet: 'md:grid-cols-1',
    desktop: 'lg:grid-cols-2'
  },
  
  // 地図用グリッド
  maps: {
    mobile: 'grid-cols-1',
    tablet: 'md:grid-cols-1',
    desktop: 'lg:grid-cols-1'
  }
};

// グリッドコンポーネント
export function ResponsiveGrid({ 
  type, 
  children, 
  className = '' 
}: {
  type: keyof typeof GRID_CLASSES;
  children: React.ReactNode;
  className?: string;
}) {
  const gridClasses = Object.values(GRID_CLASSES[type]).join(' ');
  
  return (
    <div className={`grid gap-4 ${gridClasses} ${className}`}>
      {children}
    </div>
  );
}
```

### セクション間隔

```typescript
// セクション間隔の定義
const SECTION_SPACING = {
  small: 'mb-4',
  medium: 'mb-6',
  large: 'mb-8',
  xlarge: 'mb-12'
};

// セクションコンポーネント
export function DashboardSection({ 
  children, 
  spacing = 'large',
  className = ''
}: {
  children: React.ReactNode;
  spacing?: keyof typeof SECTION_SPACING;
  className?: string;
}) {
  return (
    <section className={`${SECTION_SPACING[spacing]} ${className}`}>
      {children}
    </section>
  );
}
```

## レスポンシブブレークポイント

### Tailwind CSS ブレークポイント

```typescript
// ブレークポイントの定義
const BREAKPOINTS = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px'
};

// レスポンシブユーティリティ
export function useResponsive() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop' | 'wide'>('mobile');
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1280) setScreenSize('wide');
      else if (width >= 1024) setScreenSize('desktop');
      else if (width >= 768) setScreenSize('tablet');
      else setScreenSize('mobile');
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return screenSize;
}
```

### デバイス別レイアウト

```typescript
// デバイス別レイアウト設定
const DEVICE_LAYOUTS = {
  mobile: {
    cardsPerRow: 1,
    chartHeight: 250,
    mapHeight: 300,
    showSidebar: false
  },
  tablet: {
    cardsPerRow: 2,
    chartHeight: 300,
    mapHeight: 400,
    showSidebar: false
  },
  desktop: {
    cardsPerRow: 3,
    chartHeight: 350,
    mapHeight: 500,
    showSidebar: true
  },
  wide: {
    cardsPerRow: 4,
    chartHeight: 400,
    mapHeight: 600,
    showSidebar: true
  }
};

// レスポンシブレイアウトコンポーネント
export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const screenSize = useResponsive();
  const layout = DEVICE_LAYOUTS[screenSize];
  
  return (
    <div className={`dashboard-layout ${screenSize}`}>
      {children}
    </div>
  );
}
```

## 固定順序レイアウト

### セクション順序の定義

```typescript
// 階層別セクション順序
const SECTION_ORDER = {
  national: [
    'statistics-cards',
    'prefecture-ranking',
    'choropleth-map',
    'time-series-charts',
    'detailed-analysis'
  ],
  prefecture: [
    'statistics-cards',
    'national-comparison',
    'municipality-ranking',
    'time-series-charts',
    'neighboring-comparison'
  ],
  municipality: [
    'statistics-cards',
    'prefecture-ranking',
    'neighboring-comparison',
    'time-series-charts',
    'municipality-map'
  ]
};

// セクション順序の適用
export function OrderedDashboard({ 
  areaLevel, 
  children 
}: { 
  areaLevel: AreaLevel;
  children: React.ReactNode;
}) {
  const orderedSections = SECTION_ORDER[areaLevel];
  
  return (
    <div className="dashboard-sections">
      {orderedSections.map(sectionKey => (
        <DashboardSection key={sectionKey} spacing="large">
          {children[sectionKey]}
        </DashboardSection>
      ))}
    </div>
  );
}
```

### セクション表示制御

```typescript
// セクション表示条件
const SECTION_VISIBILITY = {
  'statistics-cards': () => true,
  'prefecture-ranking': (areaLevel: AreaLevel) => areaLevel === 'national' || areaLevel === 'prefecture',
  'municipality-ranking': (areaLevel: AreaLevel) => areaLevel === 'prefecture',
  'choropleth-map': (areaLevel: AreaLevel) => areaLevel === 'national',
  'municipality-map': (areaLevel: AreaLevel) => areaLevel === 'municipality',
  'national-comparison': (areaLevel: AreaLevel) => areaLevel === 'prefecture',
  'neighboring-comparison': (areaLevel: AreaLevel) => areaLevel === 'prefecture' || areaLevel === 'municipality'
};

// 条件付きセクション表示
export function ConditionalSection({ 
  sectionKey, 
  areaLevel, 
  children 
}: {
  sectionKey: string;
  areaLevel: AreaLevel;
  children: React.ReactNode;
}) {
  const shouldShow = SECTION_VISIBILITY[sectionKey]?.(areaLevel) ?? true;
  
  if (!shouldShow) return null;
  
  return <>{children}</>;
}
```

## コンテナとスペーシング

### コンテナシステム

```typescript
// コンテナサイズの定義
const CONTAINER_SIZES = {
  mobile: 'max-w-full px-4',
  tablet: 'max-w-4xl mx-auto px-6',
  desktop: 'max-w-6xl mx-auto px-8',
  wide: 'max-w-7xl mx-auto px-8'
};

// レスポンシブコンテナ
export function ResponsiveContainer({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const screenSize = useResponsive();
  const containerClass = CONTAINER_SIZES[screenSize];
  
  return (
    <div className={`${containerClass} ${className}`}>
      {children}
    </div>
  );
}
```

### パディングとマージン

```typescript
// スペーシングシステム
const SPACING = {
  xs: 'p-1 m-1',
  sm: 'p-2 m-2',
  md: 'p-4 m-4',
  lg: 'p-6 m-6',
  xl: 'p-8 m-8',
  '2xl': 'p-12 m-12'
};

// セクション内パディング
export function SectionPadding({ 
  children, 
  size = 'md' 
}: {
  children: React.ReactNode;
  size?: keyof typeof SPACING;
}) {
  return (
    <div className={`${SPACING[size]}`}>
      {children}
    </div>
  );
}
```

## ダークモード対応

### テーマ切り替え

```typescript
// ダークモード対応のクラス
const THEME_CLASSES = {
  background: 'bg-white dark:bg-neutral-800',
  text: 'text-gray-900 dark:text-white',
  border: 'border-gray-200 dark:border-neutral-700',
  card: 'bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700',
  input: 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-600'
};

// テーマ対応コンポーネント
export function ThemedCard({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${THEME_CLASSES.card} rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
}
```

### カラーパレット

```typescript
// テーマ別カラーパレット
const COLOR_PALETTES = {
  light: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827'
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#9ca3af',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb'
  }
};
```

## パフォーマンス最適化

### 遅延読み込み

```typescript
// セクションの遅延読み込み
export function LazySection({ 
  children, 
  threshold = 0.1 
}: {
  children: React.ReactNode;
  threshold?: number;
}) {
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

### メモ化

```typescript
// レイアウトコンポーネントのメモ化
export const MemoizedDashboardSection = React.memo<DashboardSectionProps>(({
  children,
  spacing,
  className
}) => {
  return (
    <DashboardSection spacing={spacing} className={className}>
      {children}
    </DashboardSection>
  );
});
```

## アクセシビリティ

### セマンティックHTML

```typescript
// セマンティックなレイアウト構造
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
```

### フォーカス管理

```typescript
// フォーカス管理
export function FocusableSection({ 
  children, 
  title 
}: {
  children: React.ReactNode;
  title: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab' && sectionRef.current) {
      // フォーカストラップの実装
    }
  };
  
  return (
    <section
      ref={sectionRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={title}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </section>
  );
}
```

## まとめ

レイアウトシステムは、3階層のダッシュボードで最適化された表示を提供するための包括的なシステムです。主な特徴は以下の通りです：

1. **階層別レイアウト**: 全国・都道府県・市区町村で最適化されたセクション構成
2. **レスポンシブデザイン**: モバイル・タブレット・デスクトップで最適な表示
3. **固定順序**: ユーザーエクスペリエンス最適化のため順序固定
4. **アクセシビリティ**: セマンティックHTMLとキーボードナビゲーション対応
5. **パフォーマンス**: 遅延読み込みとメモ化による最適化
6. **テーマ対応**: ダークモードとライトモードの切り替え

このシステムにより、ユーザーはどのデバイスからでも、どの地域レベルでも、一貫した使いやすいインターフェースで統計データを閲覧することができます。
