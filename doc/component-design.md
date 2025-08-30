# コンポーネント設計

## 概要

地域統計ダッシュボードは、React 19 の最新機能を活用したコンポーネントベースのアーキテクチャを採用しています。各コンポーネントは単一責任の原則に従い、再利用可能で保守しやすい設計となっています。

## スタイル管理

### アプローチ

プロジェクトでは、**カスタムフック `useStyles`** を使用したスタイル管理を採用しています。これにより、以下の利点を実現しています：

- **型安全性**: TypeScript でのスタイル管理
- **一貫性**: プロジェクト全体での統一されたデザイン
- **保守性**: スタイルの変更が一箇所で可能
- **再利用性**: 共通のスタイルパターンを簡単に適用

### 使用方法

#### 1. 基本的な使用方法

```typescript
import { useStyles } from "@/hooks/useStyles";

export default function MyComponent() {
  const styles = useStyles();

  return (
    <div className={styles.card.base}>
      <h2 className={styles.heading.lg}>タイトル</h2>
      <p className={styles.text.body}>コンテンツ</p>
      <button className={styles.button.primary}>ボタン</button>
    </div>
  );
}
```

#### 2. 利用可能なスタイル

```typescript
const styles = useStyles();

// レイアウト
styles.layout.section; // space-y-6
styles.layout.row; // space-y-4
styles.layout.grid; // grid grid-cols-1 md:grid-cols-2 gap-4
styles.layout.flex; // flex items-center gap-2

// カード
styles.card.base; // 基本カード（padding: 6）
styles.card.compact; // コンパクトカード（padding: 4）

// ボタン
styles.button.primary; // プライマリボタン（インディゴ）
styles.button.secondary; // セカンダリボタン（グレー）
styles.button.small; // 小さいボタン

// 入力フィールド
styles.input.base; // 基本入力フィールド
styles.input.disabled; // 無効状態

// メッセージ
styles.message.success; // 成功メッセージ（エメラルド）
styles.message.error; // エラーメッセージ（レッド）
styles.message.info; // 情報メッセージ（ブルー）
styles.message.warning; // 警告メッセージ（イエロー）

// ヘッダー
styles.header.primary; // プライマリヘッダー（インディゴ）
styles.header.secondary; // セカンダリヘッダー（グレー）

// ラベル
styles.label.base; // 基本ラベル
styles.label.required; // 必須ラベル（*付き）

// 見出し
styles.heading.lg; // 大見出し（text-lg）
styles.heading.md; // 中見出し（text-base）
styles.heading.sm; // 小見出し（text-sm）

// テキスト
styles.text.primary; // プライマリテキスト（インディゴ）
styles.text.secondary; // セカンダリテキスト
styles.text.body; // 本文テキスト
styles.text.muted; // 無効テキスト
```

#### 3. スタイルの拡張

新しいスタイルを追加する場合は、`src/hooks/useStyles.ts`を編集します：

```typescript
export const useStyles = () => {
  const styles = {
    // 既存のスタイル...

    // 新しいスタイル
    newComponent: {
      base: "bg-blue-100 border border-blue-300 rounded-lg p-4",
      variant: "bg-blue-200 border-blue-400",
    },
  };

  return styles;
};
```

### デザインシステム

#### カラーパレット

- **プライマリ**: インディゴ系（#4F46E5）
- **セカンダリ**: グレー系（#6B7280）
- **成功**: エメラルド系（#10B981）
- **エラー**: レッド系（#EF4444）
- **警告**: イエロー系（#F59E0B）
- **情報**: ブルー系（#3B82F6）

#### スペーシング

- **section**: `space-y-6` (24px)
- **row**: `space-y-4` (16px)
- **compact**: `space-y-2` (8px)

#### タイポグラフィ

- **heading-lg**: `text-lg font-medium` (18px)
- **heading-md**: `text-base font-medium` (16px)
- **heading-sm**: `text-sm font-medium` (14px)
- **body**: `text-sm` (14px)

### ベストプラクティス

1. **一貫性の維持**: 既存のスタイルパターンを優先して使用
2. **セマンティックな命名**: 用途に応じた適切なスタイル名
3. **レスポンシブ対応**: モバイルファーストの設計
4. **アクセシビリティ**: 十分なコントラストとフォーカス状態
5. **ダークモード対応**: ライト/ダーク両方のテーマに対応

### トラブルシューティング

#### よくある問題

1. **スタイルが適用されない**

   - `useStyles()`の呼び出しを確認
   - インポートパスが正しいか確認

2. **型エラーが発生する**

   - `useStyles.ts`の型定義を確認
   - 存在しないスタイル名を使用していないか確認

3. **スタイルの競合**
   - Tailwind CSS の優先度を確認
   - カスタムスタイルの順序を確認

## アトミックデザイン階層

```
App (Next.js App Router)
├── Layout
│   ├── Header              # ヘッダーナビゲーション
│   ├── Main Content       # メインコンテンツ
│   └── Footer             # フッター情報
├── HomePage
│   ├── Hero Section       # ヒーローセクション
│   ├── Features Section   # 特徴セクション
│   └── Categories Section # カテゴリセクション
└── Dashboard (カテゴリベース)
    ├── DashboardPage (カテゴリ一覧)
    ├── CategoryPage (カテゴリ詳細)
    │   ├── RegionSelector (atoms)
    │   ├── EstatDataFetcher (organisms)
    │   └── StatisticsDisplay (molecules)
    └── SubcategoryPage (サブカテゴリ詳細)
        ├── RegionSelector (atoms)
        ├── EstatDataFetcher (organisms)
        └── StatisticsDisplay (molecules)
            ├── PopulationChart
            ├── GdpChart
            ├── UnemploymentChart
            └── DemographicsChart
```

## アトミックデザインの 5 階層

### **1. Atoms（原子）**

最小単位の再利用可能な UI コンポーネント

- **RegionSelector**: 地域選択の基本コンポーネント
- **Button**: ボタンの基本コンポーネント
- **Input**: 入力フィールドの基本コンポーネント

### **2. Molecules（分子）**

Atoms を組み合わせた機能的なコンポーネント

- **StatisticsDisplay**: 統計データの可視化
- **SearchBar**: 検索機能（Input + Button）
- **Card**: カード表示（Title + Content + Actions）

### **3. Organisms（有機体）**

Molecules を組み合わせた複雑なコンポーネント

- **EstatDataFetcher**: データ取得の複雑な機能
- **HeaderNavigation**: ヘッダーナビゲーション全体
- **DashboardWidget**: ダッシュボードウィジェット

### **4. Templates（テンプレート）**

ページレイアウトの構造定義

- **DashboardLayout**: ダッシュボードのレイアウト
- **FormLayout**: フォームページのレイアウト
- **ListLayout**: リストページのレイアウト

### **5. Pages（ページ）**

特定のページの機能実装

- **HomePage**: ホームページの実装
- **DashboardPage**: ダッシュボードページの実装
- **CategoryPage**: カテゴリ詳細ページの実装

## 主要コンポーネント

### 1. DashboardPage (カテゴリ一覧)

#### 概要

カテゴリ一覧を表示するダッシュボードのエントリーポイント。16 の主要カテゴリをグリッド表示し、検索機能を提供します。

#### 責任

- カテゴリ一覧の表示と検索
- カテゴリ別のナビゲーション
- 統計情報の表示
- 各カテゴリへのリンク提供

#### 実装詳細

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { EstatDataFetcher } from "@/components/EstatDataFetcher";
import { StatisticsDisplay } from "@/components/StatisticsDisplay";
import { RegionSelector } from "@/components/RegionSelector";

export default function DashboardPage() {
  const [selectedRegion, setSelectedRegion] = useState("13"); // 東京都
  const [statisticsData, setStatisticsData] = useState(null);
  const [loading, setLoading] = useState(false);

  const regions = [
    { code: "13", name: "東京都" },
    { code: "27", name: "大阪府" },
    { code: "23", name: "愛知県" },
    // ... 他の地域
  ];

  const handleRegionChange = useCallback((regionCode: string) => {
    setSelectedRegion(regionCode);
  }, []);

  const handleDataUpdate = useCallback((data: any) => {
    setStatisticsData(data);
  }, []);

  const handleLoadingChange = useCallback((loadingState: boolean) => {
    setLoading(loadingState);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            地域統計ダッシュボード
          </h1>
          <p className="text-gray-600">
            e-Stat APIから取得した地域統計データを可視化します
          </p>
        </div>

        {/* 地域選択 */}
        <RegionSelector
          regions={regions}
          selectedRegion={selectedRegion}
          onRegionChange={handleRegionChange}
        />

        {/* データ取得 */}
        <EstatDataFetcher
          regionCode={selectedRegion}
          onDataUpdate={handleDataUpdate}
          onLoadingChange={handleLoadingChange}
        />

        {/* 統計データ表示 */}
        {loading && <LoadingSpinner />}
        {statisticsData && !loading && (
          <StatisticsDisplay
            data={statisticsData}
            regionName={regions.find((r) => r.code === selectedRegion)?.name}
          />
        )}
      </div>
    </div>
  );
}
```

#### パフォーマンス最適化

```typescript
// useCallbackで関数をメモ化
const handleRegionChange = useCallback((regionCode: string) => {
  setSelectedRegion(regionCode);
}, []);

// 依存配列の最適化
useEffect(() => {
  // 地域変更時の処理
}, [selectedRegion]); // 必要な依存関係のみ
```

### 2. CategoryPage (カテゴリ詳細)

#### 概要

選択されたカテゴリの詳細情報とサブカテゴリ一覧を表示し、統計データの可視化を行います。

#### 責任

- カテゴリ情報の表示
- サブカテゴリ一覧の表示
- 地域選択とデータ取得
- 統計データの表示

### 3. SubcategoryPage (サブカテゴリ詳細)

#### 概要

選択されたサブカテゴリの詳細な統計データを表示し、パンくずリストによるナビゲーションを提供します。

#### 責任

- サブカテゴリ情報の表示
- パンくずリストによるナビゲーション
- 地域選択とデータ取得
- 詳細な統計データの表示

### 4. Header

#### 概要

アプリケーション全体のヘッダーナビゲーションを提供するコンポーネント。

#### 責任

- ロゴ・ブランドの表示
- メインナビゲーションの提供
- モバイルメニューの管理
- レスポンシブ対応

#### 実装詳細

```typescript
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      {/* ロゴ・ブランド */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg">
            <span className="text-white text-xl font-bold">47</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            地域統計ダッシュボード
          </h1>
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="hidden md:flex items-center space-x-8">
        <Link href="/">ホーム</Link>
        <Link href="/dashboard">ダッシュボード</Link>
        <Link href="/about">概要</Link>
        <Link href="/contact">お問い合わせ</Link>
      </nav>

      {/* モバイルメニュー */}
      <div className="md:hidden">
        <button onClick={toggleMenu}>☰</button>
      </div>
    </header>
  );
}
```

### 5. Footer

#### 概要

アプリケーション全体のフッター情報とリンクを提供するコンポーネント。

#### 責任

- ブランド情報の表示
- クイックリンクの提供
- 統計カテゴリへの直接リンク
- 法的情報へのアクセス

#### 実装詳細

```typescript
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* ブランド・説明 */}
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-xl font-bold">地域統計ダッシュボード</h3>
          <p className="text-gray-300">
            e-Stat APIを使用して日本の地域統計データを可視化
          </p>
        </div>

        {/* クイックリンク */}
        <div>
          <h4 className="text-lg font-semibold">クイックリンク</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/">ホーム</Link>
            </li>
            <li>
              <Link href="/dashboard">ダッシュボード</Link>
            </li>
          </ul>
        </div>

        {/* 統計カテゴリ */}
        <div>
          <h4 className="text-lg font-semibold">統計カテゴリ</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard/population">人口・世帯</Link>
            </li>
            <li>
              <Link href="/dashboard/economy">企業・家計・経済</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
```

### 6. RegionSelector

#### 概要

地域（都道府県）を選択するためのドロップダウンコンポーネント。

#### 責任

- 地域リストの表示
- 地域選択の処理
- 選択された地域の表示

#### 実装詳細

```typescript
"use client";

interface Region {
  code: string;
  name: string;
}

interface RegionSelectorProps {
  regions: Region[];
  selectedRegion: string;
  onRegionChange: (regionCode: string) => void;
}

export function RegionSelector({
  regions,
  selectedRegion,
  onRegionChange,
}: RegionSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">地域選択</h2>
      <div className="flex items-center space-x-4">
        <label
          htmlFor="region-select"
          className="text-sm font-medium text-gray-700"
        >
          都道府県:
        </label>
        <select
          id="region-select"
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          {regions.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>
        <div className="text-sm text-gray-500">
          選択中: {regions.find((r) => r.code === selectedRegion)?.name}
        </div>
      </div>
    </div>
  );
}
```

#### アクセシビリティ

```typescript
// ラベルとセレクトボックスの関連付け
<label htmlFor="region-select">都道府県:</label>
<select id="region-select" ...>

// キーボードナビゲーション対応
<select
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      // Enterキーでの選択処理
    }
  }}
  ...
>
```

### 3. EstatDataFetcher

#### 概要

e-Stat API からデータを取得し、親コンポーネントに渡すコンポーネント。

#### 責任

- API 呼び出しの実行
- エラーハンドリング
- ローディング状態の管理
- サンプルデータの提供

#### 実装詳細

```typescript
"use client";

import { useEffect, useState } from "react";

interface EstatDataFetcherProps {
  regionCode: string;
  onDataUpdate: (data: any) => void;
  onLoadingChange: (loading: boolean) => void;
}

const ESTAT_API_BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json";
const ESTAT_APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID || "your-app-id-here";

export function EstatDataFetcher({
  regionCode,
  onDataUpdate,
  onLoadingChange,
}: EstatDataFetcherProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      onLoadingChange(true);
      setError(null);

      try {
        if (ESTAT_APP_ID !== "your-app-id-here") {
          // 実際のe-Stat APIを使用
          const response = await fetch(
            `${ESTAT_API_BASE_URL}/getStatsData?appId=${ESTAT_APP_ID}&statsDataId=0003109941&metaGetFlg=Y&cntGetFlg=N`
          );

          if (!response.ok) {
            throw new Error("APIリクエストに失敗しました");
          }

          const data = await response.json();
          onDataUpdate(data);
        } else {
          // サンプルデータを使用
          const adjustedData = {
            ...SAMPLE_DATA,
            regionCode,
            regionName: getRegionName(regionCode),
            lastUpdated: new Date().toISOString(),
            source: "サンプルデータ（e-Stat APIキーが必要）",
          };

          onDataUpdate(adjustedData);
        }
      } catch (err) {
        console.error("データ取得エラー:", err);
        setError("データの取得に失敗しました");

        // エラー時もサンプルデータを表示
        const fallbackData = {
          ...SAMPLE_DATA,
          regionCode,
          regionName: getRegionName(regionCode),
          lastUpdated: new Date().toISOString(),
          source: "サンプルデータ（エラー時のフォールバック）",
        };

        onDataUpdate(fallbackData);
      } finally {
        onLoadingChange(false);
      }
    };

    fetchData();
  }, [regionCode]); // 依存配列の最適化

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        データ取得状況
      </h2>

      {/* APIキー警告 */}
      {ESTAT_APP_ID === "your-app-id-here" && <ApiKeyWarning />}

      {/* エラー表示 */}
      {error && <ErrorMessage message={error} />}

      {/* データソース情報 */}
      <div className="text-sm text-gray-600">
        <p>地域コード: {regionCode}</p>
        <p>地域名: {getRegionName(regionCode)}</p>
        <p>
          データソース:{" "}
          {ESTAT_APP_ID === "your-app-id-here"
            ? "サンプルデータ"
            : "e-Stat API"}
        </p>
      </div>
    </div>
  );
}
```

#### エラーハンドリング

```typescript
// エラー境界の実装
class DataFetchErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Data fetch error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### 4. StatisticsDisplay

#### 概要

統計データをグラフやチャートで表示するコンポーネント。

#### 責任

- データの可視化
- グラフのレンダリング
- レスポンシブ対応

#### 実装詳細

```typescript
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface StatisticsDisplayProps {
  data: any;
  regionName?: string;
}

export function StatisticsDisplay({
  data,
  regionName,
}: StatisticsDisplayProps) {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="space-y-8">
      {/* 人口推移 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {regionName}の人口推移
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.population}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [value.toLocaleString(), "人口"]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* GDP指数 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {regionName}のGDP指数推移
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.gdp}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value: number) => [value, "GDP指数"]} />
            <Legend />
            <Bar dataKey="value" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 年齢構成 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {regionName}の年齢構成
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.demographics}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ age, percent }) =>
                `${age} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.demographics.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

#### レスポンシブ対応

```typescript
// 画面サイズに応じたグラフサイズ調整
const useResponsiveChart = () => {
  const [chartSize, setChartSize] = useState({ width: 0, height: 300 });

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      let height = 300;

      if (width < 640) {
        // sm
        height = 250;
      } else if (width < 1024) {
        // lg
        height = 300;
      } else {
        height = 400;
      }

      setChartSize({ width, height });
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return chartSize;
};
```

## コンポーネント設計原則

### 1. 単一責任の原則

各コンポーネントは一つの明確な責任を持ちます：

- **RegionSelector**: 地域選択のみ
- **EstatDataFetcher**: データ取得のみ
- **StatisticsDisplay**: データ表示のみ

### 2. 再利用性

共通の UI パターンを抽出し、再利用可能なコンポーネントを作成：

```typescript
// 共通のカードコンポーネント
interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

// 使用例
<Card title="人口推移">
  <LineChart data={data.population}>{/* チャート内容 */}</LineChart>
</Card>;
```

### 3. 型安全性

TypeScript を使用して、コンポーネントの型安全性を確保：

```

```
