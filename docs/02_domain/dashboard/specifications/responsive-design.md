# レスポンシブデザイン

## 概要

ダッシュボードドメインのレスポンシブデザインは、モバイル・タブレット・デスクトップの各デバイスで最適化された表示を提供するため、Tailwind CSSのブレークポイントシステムとカスタムコンポーネントを組み合わせて実装されています。

## ブレークポイントシステム

### Tailwind CSS ブレークポイント

```typescript
// ブレークポイントの定義
const BREAKPOINTS = {
  mobile: '0px',      // デフォルト（モバイルファースト）
  tablet: '768px',    // md:
  desktop: '1024px',  // lg:
  wide: '1280px'      // xl:
} as const;

// デバイス判定フック
export function useResponsive() {
  const [device, setDevice] = useState<DeviceType>('mobile');
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1280) setDevice('wide');
      else if (width >= 1024) setDevice('desktop');
      else if (width >= 768) setDevice('tablet');
      else setDevice('mobile');
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return device;
}
```

### デバイス別レイアウト設定

```typescript
// デバイス別レイアウト設定
const DEVICE_LAYOUTS = {
  mobile: {
    cardsPerRow: 1,
    chartHeight: 250,
    mapHeight: 300,
    showSidebar: false,
    gridGap: 'gap-4',
    padding: 'px-4',
    fontSize: {
      heading: 'text-lg',
      body: 'text-sm',
      caption: 'text-xs'
    }
  },
  tablet: {
    cardsPerRow: 2,
    chartHeight: 300,
    mapHeight: 400,
    showSidebar: false,
    gridGap: 'gap-6',
    padding: 'px-6',
    fontSize: {
      heading: 'text-xl',
      body: 'text-base',
      caption: 'text-sm'
    }
  },
  desktop: {
    cardsPerRow: 3,
    chartHeight: 350,
    mapHeight: 500,
    showSidebar: true,
    gridGap: 'gap-8',
    padding: 'px-8',
    fontSize: {
      heading: 'text-2xl',
      body: 'text-base',
      caption: 'text-sm'
    }
  },
  wide: {
    cardsPerRow: 4,
    chartHeight: 400,
    mapHeight: 600,
    showSidebar: true,
    gridGap: 'gap-8',
    padding: 'px-8',
    fontSize: {
      heading: 'text-3xl',
      body: 'text-lg',
      caption: 'text-base'
    }
  }
} as const;
```

## グリッドシステム

### レスポンシブグリッドコンポーネント

```typescript
// レスポンシブグリッドコンポーネント
interface ResponsiveGridProps {
  children: React.ReactNode;
  type: 'cards' | 'charts' | 'maps' | 'content';
  className?: string;
}

export function ResponsiveGrid({ children, type, className = '' }: ResponsiveGridProps) {
  const device = useResponsive();
  const layout = DEVICE_LAYOUTS[device];
  
  const gridClasses = {
    cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${layout.gridGap}`,
    charts: `grid grid-cols-1 lg:grid-cols-2 ${layout.gridGap}`,
    maps: `grid grid-cols-1 ${layout.gridGap}`,
    content: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${layout.gridGap}`
  };
  
  return (
    <div className={`${gridClasses[type]} ${className}`}>
      {children}
    </div>
  );
}
```

### 統計カードグリッド

```typescript
// 統計カード用レスポンシブグリッド
export function StatisticsCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <ResponsiveGrid type="cards" className="mb-8">
      {children}
    </ResponsiveGrid>
  );
}

// 使用例
<StatisticsCardGrid>
  <StatisticsMetricCard {...cardProps} />
  <StatisticsMetricCard {...cardProps} />
  <StatisticsMetricCard {...cardProps} />
</StatisticsCardGrid>
```

### グラフグリッド

```typescript
// グラフ用レスポンシブグリッド
export function ChartGrid({ children }: { children: React.ReactNode }) {
  return (
    <ResponsiveGrid type="charts" className="mb-8">
      {children}
    </ResponsiveGrid>
  );
}

// 使用例
<ChartGrid>
  <EstatLineChart {...chartProps} />
  <EstatBarChart {...chartProps} />
</ChartGrid>
```

## コンポーネント別レスポンシブ対応

### 統計カードコンポーネント

```typescript
// レスポンシブ統計カード
export function ResponsiveStatisticsCard({
  params,
  areaCode,
  title,
  color,
  ...props
}: StatisticsCardProps) {
  const device = useResponsive();
  const layout = DEVICE_LAYOUTS[device];
  
  return (
    <div className={`
      bg-white dark:bg-neutral-800 
      rounded-lg border border-gray-200 dark:border-neutral-700 
      p-4 transition-all duration-200
      hover:shadow-md hover:scale-105
      ${device === 'mobile' ? 'p-3' : 'p-4'}
    `}>
      <h3 className={`
        font-medium text-gray-500 dark:text-neutral-400 mb-2
        ${layout.fontSize.caption}
      `}>
        {title}
      </h3>
      <div className="flex items-baseline justify-between">
        <div 
          className={`font-bold ${layout.fontSize.heading}`}
          style={{ color }}
        >
          {formatNumber(data.value)}
          {unit && (
            <span className={`text-gray-500 ml-1 ${layout.fontSize.caption}`}>
              {unit}
            </span>
          )}
        </div>
        {showTrend && data.previousValue && (
          <TrendIndicator
            current={data.value}
            previous={data.previousValue}
            size={device === 'mobile' ? 'sm' : 'md'}
          />
        )}
      </div>
    </div>
  );
}
```

### グラフコンポーネント

```typescript
// レスポンシブグラフコンポーネント
export function ResponsiveChart({
  children,
  title,
  height,
  ...props
}: ChartProps) {
  const device = useResponsive();
  const layout = DEVICE_LAYOUTS[device];
  
  const chartHeight = height || layout.chartHeight;
  
  return (
    <div className={`
      bg-white dark:bg-neutral-800 
      rounded-lg border border-gray-200 dark:border-neutral-700 
      p-4 transition-all duration-200
      ${device === 'mobile' ? 'p-3' : 'p-4'}
    `}>
      <h3 className={`
        font-semibold text-gray-900 dark:text-white mb-4
        ${layout.fontSize.heading}
      `}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
```

### 地図コンポーネント

```typescript
// レスポンシブ地図コンポーネント
export function ResponsiveMap({
  data,
  title,
  height,
  ...props
}: MapProps) {
  const device = useResponsive();
  const layout = DEVICE_LAYOUTS[device];
  
  const mapHeight = height || layout.mapHeight;
  
  return (
    <div className={`
      bg-white dark:bg-neutral-800 
      rounded-lg border border-gray-200 dark:border-neutral-700 
      p-4 transition-all duration-200
      ${device === 'mobile' ? 'p-3' : 'p-4'}
    `}>
      <h3 className={`
        font-semibold text-gray-900 dark:text-white mb-4
        ${layout.fontSize.heading}
      `}>
        {title}
      </h3>
      <div className="relative overflow-hidden">
        <ChoroplethMap
          data={data}
          height={mapHeight}
          {...props}
        />
        <MapLegend
          data={data}
          position={device === 'mobile' ? 'bottom' : 'right'}
        />
      </div>
    </div>
  );
}
```

## ナビゲーション

### レスポンシブナビゲーション

```typescript
// レスポンシブナビゲーション
export function ResponsiveNavigation({
  category,
  subcategory,
  areaCode,
  ...props
}: NavigationProps) {
  const device = useResponsive();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  if (device === 'mobile') {
    return (
      <MobileNavigation
        category={category}
        subcategory={subcategory}
        areaCode={areaCode}
        isOpen={isMenuOpen}
        onToggle={() => setIsMenuOpen(!isMenuOpen)}
      />
    );
  }
  
  return (
    <DesktopNavigation
      category={category}
      subcategory={subcategory}
      areaCode={areaCode}
    />
  );
}

// モバイルナビゲーション
function MobileNavigation({ isOpen, onToggle, ...props }: MobileNavProps) {
  return (
    <div className="lg:hidden">
      <button
        onClick={onToggle}
        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        aria-label="メニューを開く"
      >
        <MenuIcon className="h-6 w-6" />
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-neutral-800">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">メニュー</h2>
              <button
                onClick={onToggle}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900"
                aria-label="メニューを閉じる"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="p-4">
              <NavigationMenu {...props} />
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
```

### ブレッドクラム

```typescript
// レスポンシブブレッドクラム
export function ResponsiveBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const device = useResponsive();
  
  if (device === 'mobile') {
    return (
      <div className="flex items-center space-x-1 text-sm text-gray-500">
        <ChevronLeftIcon className="h-4 w-4" />
        <span className="truncate">{items[items.length - 1]?.name}</span>
      </div>
    );
  }
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500">
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && <ChevronRightIcon className="h-4 w-4 mx-2" />}
          <Link
            href={item.href}
            className="hover:text-gray-900 dark:hover:text-white"
          >
            {item.name}
          </Link>
        </div>
      ))}
    </nav>
  );
}
```

## フォーム要素

### レスポンシブフォーム

```typescript
// レスポンシブフォーム
export function ResponsiveForm({ children, ...props }: FormProps) {
  const device = useResponsive();
  
  return (
    <form className={`
      space-y-4
      ${device === 'mobile' ? 'space-y-3' : 'space-y-4'}
    `} {...props}>
      {children}
    </form>
  );
}

// レスポンシブ入力フィールド
export function ResponsiveInput({
  label,
  ...props
}: InputProps) {
  const device = useResponsive();
  const layout = DEVICE_LAYOUTS[device];
  
  return (
    <div className="space-y-2">
      <label className={`
        block font-medium text-gray-700 dark:text-neutral-300
        ${layout.fontSize.caption}
      `}>
        {label}
      </label>
      <input
        className={`
          w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 
          rounded-md bg-white dark:bg-neutral-800 
          text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${device === 'mobile' ? 'text-base' : 'text-sm'}
        `}
        {...props}
      />
    </div>
  );
}
```

## ダークモード対応

### テーマ切り替え

```typescript
// テーマコンテキスト
export const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}>({
  theme: 'light',
  toggleTheme: () => {}
});

// テーマプロバイダー
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    // システム設定を確認
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    setTheme(savedTheme || systemTheme);
  }, []);
  
  useEffect(() => {
    // テーマを適用
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### ダークモード対応コンポーネント

```typescript
// ダークモード対応カード
export function ThemedCard({ children, className = '' }: CardProps) {
  return (
    <div className={`
      bg-white dark:bg-neutral-800 
      border border-gray-200 dark:border-neutral-700 
      rounded-lg p-4
      ${className}
    `}>
      {children}
    </div>
  );
}

// ダークモード対応ボタン
export function ThemedButton({ 
  variant = 'primary', 
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = `
    px-4 py-2 rounded-md font-medium transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `;
  
  const variantClasses = {
    primary: `
      bg-blue-600 hover:bg-blue-700 text-white
      focus:ring-blue-500
    `,
    secondary: `
      bg-gray-200 hover:bg-gray-300 text-gray-900
      dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-white
      focus:ring-gray-500
    `,
    outline: `
      border border-gray-300 dark:border-neutral-600
      text-gray-700 dark:text-neutral-300
      hover:bg-gray-50 dark:hover:bg-neutral-700
      focus:ring-gray-500
    `
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

## パフォーマンス最適化

### 遅延読み込み

```typescript
// 遅延読み込みコンポーネント
export function LazyComponent({ 
  children, 
  fallback,
  threshold = 0.1 
}: LazyComponentProps) {
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
      {isVisible ? children : fallback}
    </div>
  );
}

// 使用例
<LazyComponent fallback={<ChartSkeleton />}>
  <EstatLineChart {...chartProps} />
</LazyComponent>
```

### メモ化

```typescript
// メモ化されたレスポンシブコンポーネント
export const MemoizedResponsiveCard = React.memo<CardProps>(({
  children,
  className
}) => {
  const device = useResponsive();
  const layout = DEVICE_LAYOUTS[device];
  
  return (
    <div className={`
      bg-white dark:bg-neutral-800 
      rounded-lg border border-gray-200 dark:border-neutral-700 
      p-4 transition-all duration-200
      ${device === 'mobile' ? 'p-3' : 'p-4'}
      ${className}
    `}>
      {children}
    </div>
  );
});
```

## アクセシビリティ

### キーボードナビゲーション

```typescript
// キーボードナビゲーション対応
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

### スクリーンリーダー対応

```typescript
// スクリーンリーダー対応
export function ScreenReaderText({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// 使用例
<button aria-label="統計データを更新">
  <RefreshIcon className="h-5 w-5" />
  <ScreenReaderText>統計データを更新</ScreenReaderText>
</button>
```

## テスト

### レスポンシブテスト

```typescript
// レスポンシブテストのヘルパー
export function testResponsiveComponent(
  Component: React.ComponentType<any>,
  props: any,
  breakpoints: string[] = ['mobile', 'tablet', 'desktop', 'wide']
) {
  breakpoints.forEach(breakpoint => {
    it(`should render correctly on ${breakpoint}`, () => {
      // ブレークポイントに応じたテストの実装
      const { container } = render(<Component {...props} />);
      expect(container).toMatchSnapshot(`${breakpoint}`);
    });
  });
}
```

## まとめ

レスポンシブデザインは、ダッシュボードドメインの重要な要素です。主な特徴は以下の通りです：

1. **デバイス別最適化**: モバイル・タブレット・デスクトップで最適な表示
2. **柔軟なグリッドシステム**: コンテンツタイプに応じたレスポンシブグリッド
3. **ダークモード対応**: システム設定に応じた自動切り替え
4. **アクセシビリティ**: キーボードナビゲーションとスクリーンリーダー対応
5. **パフォーマンス**: 遅延読み込みとメモ化による最適化
6. **テスト**: レスポンシブテストによる品質保証

このレスポンシブデザインにより、ユーザーはどのデバイスからでも快適に統計データを閲覧することができます。
