---
title: コンポーネント統合仕様
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/blog
  - specifications
---

# コンポーネント統合仕様

## 概要

ブログドメインにおけるMDXコンポーネントの統合方法を定義します。既存のvisualizationドメインのコンポーネントを活用し、MDX内で利用可能なコンポーネント体系を構築します。

## コンポーネント分類

### 1. 基本HTMLコンポーネント
- **目的**: 標準的なHTMLタグのスタイリング
- **実装**: MDXComponents内で定義
- **例**: h1, h2, p, code, img

### 2. カスタムMDXコンポーネント
- **目的**: ブログ専用のUIコンポーネント
- **実装**: `src/components/blog/mdx/`配下
- **例**: Alert, Callout, LinkCard, CodeBlock

### 3. 可視化コンポーネント
- **目的**: 統計データの可視化
- **実装**: visualizationドメインから統合
- **例**: ChoroplethMap, BarChart, LineChart

### 4. ランキング専用コンポーネント
- **目的**: ランキングデータの表示
- **実装**: 既存コンポーネントのラッパー
- **例**: PrefectureRankingMap, PrefectureRankingTable

## コンポーネントマッピング

### 基本HTMLタグ

```typescript
// src/components/blog/MDXComponents.tsx

export const mdxComponents: MDXComponents = {
  // 見出し
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-3xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-2xl font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xl font-semibold mt-3 mb-2 text-gray-900 dark:text-gray-100">
      {children}
    </h4>
  ),

  // テキスト
  p: ({ children }) => (
    <p className="my-4 leading-relaxed text-gray-700 dark:text-gray-300">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-700 dark:text-gray-300">
      {children}
    </em>
  ),

  // コード
  code: ({ children, className }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      );
    }
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
  pre: ({ children }) => (
    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4">
      {children}
    </pre>
  ),

  // リスト
  ul: ({ children }) => (
    <ul className="my-4 space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 space-y-2 list-decimal list-inside text-gray-700 dark:text-gray-300">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),

  // リンク・画像
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:underline"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt}
      className="max-w-full h-auto rounded-lg my-4"
      loading="lazy"
      {...props}
    />
  ),

  // テーブル
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700 font-semibold text-left">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
      {children}
    </td>
  ),

  // 引用
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600 dark:text-gray-400">
      {children}
    </blockquote>
  ),

  // 区切り線
  hr: () => (
    <hr className="my-8 border-gray-300 dark:border-gray-600" />
  ),
};
```

### カスタムMDXコンポーネント

#### Alertコンポーネント

```typescript
// src/components/blog/mdx/Alert.tsx

interface AlertProps {
  type: 'info' | 'warning' | 'error' | 'success';
  children: React.ReactNode;
}

export const Alert = ({ type, children }: AlertProps) => {
  const alertStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  };

  return (
    <div className={`p-4 border-l-4 rounded-r-lg my-4 ${alertStyles[type]}`}>
      <div className="flex items-start">
        <span className="mr-2 text-lg">{icons[type]}</span>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};
```

#### Calloutコンポーネント

```typescript
// src/components/blog/mdx/Callout.tsx

interface CalloutProps {
  type: 'note' | 'tip' | 'important' | 'summary';
  children: React.ReactNode;
}

export const Callout = ({ type, children }: CalloutProps) => {
  const calloutStyles = {
    note: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-200',
    tip: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    important: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200',
    summary: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
  };

  const titles = {
    note: '📝 ノート',
    tip: '💡 ヒント',
    important: '⚠️ 重要',
    summary: '📋 まとめ',
  };

  return (
    <div className={`p-4 border rounded-lg my-4 ${calloutStyles[type]}`}>
      <div className="font-semibold mb-2">{titles[type]}</div>
      <div>{children}</div>
    </div>
  );
};
```

#### LinkCardコンポーネント

```typescript
// src/components/blog/mdx/LinkCard.tsx

interface LinkCardProps {
  title: string;
  url: string;
  description?: string;
  image?: string;
}

export const LinkCard = ({ title, url, description, image }: LinkCardProps) => {
  return (
    <a
      href={url}
      className="block p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow my-4"
      target={url.startsWith('http') ? '_blank' : undefined}
      rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      <div className="flex items-start space-x-4">
        {image && (
          <img
            src={image}
            alt={title}
            className="w-16 h-16 object-cover rounded"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
};
```

#### CodeBlockコンポーネント

```typescript
// src/components/blog/mdx/CodeBlock.tsx

interface CodeBlockProps {
  children: string;
  className?: string;
}

export const CodeBlock = ({ children, className }: CodeBlockProps) => {
  const language = className?.replace('language-', '') || 'text';
  
  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-lg">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {language}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(children)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          コピー
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
        <code className={`language-${language}`}>{children}</code>
      </pre>
    </div>
  );
};
```

### 可視化コンポーネント統合

#### D3.jsコンポーネント

```typescript
// src/components/blog/mdx/ChoroplethMap.tsx

interface ChoroplethMapProps {
  dataKey: string;
  year: string;
  colorScheme?: 'blue' | 'red' | 'green' | 'purple';
  unit?: string;
  height?: number;
}

export const ChoroplethMap = ({
  dataKey,
  year,
  colorScheme = 'blue',
  unit = '',
  height = 400
}: ChoroplethMapProps) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // データ取得
    fetch(`/api/charts/data?key=${dataKey}&year=${year}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('データ取得エラー:', err);
        setLoading(false);
      });
  }, [dataKey, year]);

  if (loading) {
    return <ChartSkeleton height={height} />;
  }

  return (
    <div className="my-6">
      <ChoroplethMapComponent
        data={data}
        colorScheme={colorScheme}
        unit={unit}
        height={height}
      />
    </div>
  );
};
```

#### Rechartsコンポーネント

```typescript
// src/components/blog/mdx/LineChart.tsx

interface LineChartProps {
  dataKey: string;
  years: string[];
  prefectures?: string[];
  height?: number;
}

export const LineChart = ({
  dataKey,
  years,
  prefectures = [],
  height = 300
}: LineChartProps) => {
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    fetch(`/api/charts/line?key=${dataKey}&years=${years.join(',')}&prefectures=${prefectures.join(',')}`)
      .then(res => res.json())
      .then(setData);
  }, [dataKey, years, prefectures]);

  return (
    <div className="my-6">
      <LineChartComponent
        data={data}
        height={height}
      />
    </div>
  );
};
```

### ランキング専用コンポーネント

```typescript
// ランキング専用コンポーネントのマッピング
export const rankingComponents = {
  PrefectureRankingMap: ChoroplethMap,
  PrefectureRankingTable: ({ dataKey, year, limit = 10 }: RankingTableProps) => {
    const [data, setData] = useState<RankingData[]>([]);

    useEffect(() => {
      fetch(`/api/ranking/table?key=${dataKey}&year=${year}&limit=${limit}`)
        .then(res => res.json())
        .then(setData);
    }, [dataKey, year, limit]);

    return (
      <div className="my-6">
        <RankingTableComponent data={data} />
      </div>
    );
  },
  PrefectureRankingHighlights: ({ dataKey, year }: RankingHighlightsProps) => {
    const [data, setData] = useState<HighlightsData | null>(null);

    useEffect(() => {
      fetch(`/api/ranking/highlights?key=${dataKey}&year=${year}`)
        .then(res => res.json())
        .then(setData);
    }, [dataKey, year]);

    if (!data) return <ChartSkeleton />;

    return (
      <div className="my-6">
        <HighlightsComponent data={data} />
      </div>
    );
  },
};
```

## コンポーネント登録

### メインコンポーネントマッピング

```typescript
// src/components/blog/MDXComponents.tsx

import { MDXComponents } from 'mdx/types';
import { Alert } from './mdx/Alert';
import { Callout } from './mdx/Callout';
import { LinkCard } from './mdx/LinkCard';
import { CodeBlock } from './mdx/CodeBlock';
import { ChoroplethMap } from './mdx/ChoroplethMap';
import { LineChart } from './mdx/LineChart';
import { BarChart } from './mdx/BarChart';
import { rankingComponents } from './mdx/ranking';

export const mdxComponents: MDXComponents = {
  // 基本HTMLタグ（上記の定義）
  ...basicHTMLComponents,

  // カスタムMDXコンポーネント
  Alert,
  Callout,
  LinkCard,
  CodeBlock,

  // 可視化コンポーネント
  ChoroplethMap,
  LineChart,
  BarChart,

  // ランキング専用コンポーネント
  ...rankingComponents,
};
```

## エラーハンドリング

### コンポーネントエラー境界

```typescript
// src/components/blog/ErrorBoundary.tsx

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class MDXErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MDXコンポーネントエラー:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg my-4">
          <h3 className="font-semibold text-red-800">コンポーネントエラー</h3>
          <p className="text-red-600">
            このコンポーネントの表示中にエラーが発生しました。
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### データ取得エラー

```typescript
// データ取得エラーのハンドリング
const DataWrapper = ({ children, fallback }: DataWrapperProps) => {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(new Error(event.message));
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return fallback || <div>データの読み込みに失敗しました</div>;
  }

  return <>{children}</>;
};
```

## パフォーマンス最適化

### 遅延読み込み

```typescript
// 重いコンポーネントの遅延読み込み
const LazyChoroplethMap = dynamic(() => import('./ChoroplethMap'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

const LazyBarChart = dynamic(() => import('./BarChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

### メモ化

```typescript
// コンポーネントのメモ化
export const MemoizedChoroplethMap = memo(ChoroplethMap);
export const MemoizedLineChart = memo(LineChart);
```

## テスト戦略

### 単体テスト

```typescript
// src/components/blog/mdx/__tests__/Alert.test.tsx

describe('Alert Component', () => {
  test('renders info alert correctly', () => {
    render(<Alert type="info">Test message</Alert>);
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  test('applies correct styling for different types', () => {
    const { rerender } = render(<Alert type="warning">Warning</Alert>);
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-50');

    rerender(<Alert type="error">Error</Alert>);
    expect(screen.getByText('Error')).toHaveClass('bg-red-50');
  });
});
```

### 統合テスト

```typescript
// src/components/blog/__tests__/MDXComponents.test.tsx

describe('MDX Components Integration', () => {
  test('renders MDX with custom components', async () => {
    const mdxContent = `
      # Test Article
      
      <Alert type="info">This is an alert</Alert>
      
      <ChoroplethMap dataKey="population" year="2024" />
    `;

    const mdxSource = await serialize(mdxContent);
    render(<MDXRemote source={mdxSource} components={mdxComponents} />);

    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.getByText('This is an alert')).toBeInTheDocument();
  });
});
```

## 今後の拡張

### 新規コンポーネント追加

1. **数式コンポーネント**: KaTeX統合
2. **図表コンポーネント**: Mermaid統合
3. **インタラクティブフォーム**: カスタムフォーム要素
4. **埋め込みコンポーネント**: 外部サービス統合

### コンポーネントライブラリ化

```typescript
// コンポーネントライブラリのエクスポート
export {
  Alert,
  Callout,
  LinkCard,
  CodeBlock,
  ChoroplethMap,
  LineChart,
  BarChart,
} from './mdx';

export { mdxComponents } from './MDXComponents';
```
