---
title: ダッシュボード開発開始ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/dashboard
  - implementation
---

# ダッシュボード開発開始ガイド

## 概要

このガイドでは、ダッシュボードドメインの開発を開始するための前提条件、環境セットアップ、基本的な実装フローについて説明します。

## 前提条件

### 必要な環境

- **Node.js**: 18.x以上
- **npm**: 9.x以上
- **TypeScript**: 5.x以上
- **Next.js**: 15.x以上
- **React**: 19.x以上

### 必要な知識

- TypeScriptの基本的な知識
- React/Next.jsの基本的な知識
- Tailwind CSSの基本的な知識
- e-Stat APIの基本的な知識

## 環境セットアップ

### 1. プロジェクトのクローン

```bash
git clone <repository-url>
cd stats47
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
# .env.localファイルを作成
cp env.development.example .env.local
```

`.env.local`ファイルに以下の環境変数を設定：

```env
# e-Stat API設定
NEXT_PUBLIC_ESTAT_APP_ID=your_app_id_here

# データベース設定
DATABASE_URL=your_database_url_here

# その他の設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして、アプリケーションが正常に動作することを確認してください。

## プロジェクト構造の理解

### ディレクトリ構造

```
src/
├── app/                                    # Next.js App Router
│   └── [category]/[subcategory]/dashboard/[areaCode]/
│       └── page.tsx                        # ダッシュボードページ
├── components/                             # 共通コンポーネント
│   ├── dashboard/                          # ダッシュボード専用コンポーネント
│   │   ├── StatisticsMetricCard.tsx
│   │   ├── EstatLineChart.tsx
│   │   └── ...
│   └── subcategories/                      # サブカテゴリ別コンポーネント
│       ├── population/
│       │   └── basic-population/
│       │       ├── BasicPopulationNationalDashboard.tsx
│       │       ├── BasicPopulationPrefectureDashboard.tsx
│       │       └── BasicPopulationMunicipalityDashboard.tsx
│       └── ...
├── lib/                                    # ユーティリティ・サービス
│   ├── estat-api/                          # e-Stat API関連
│   ├── ranking/                            # ランキング関連
│   └── ...
└── types/                                  # 型定義
    ├── dashboard.ts
    ├── estat-api.ts
    └── ...
```

### 主要ファイルの役割

#### 1. ページコンポーネント

```typescript
// src/app/[category]/[subcategory]/dashboard/[areaCode]/page.tsx
export default async function DashboardPage({ params }: PageProps) {
  // パラメータの取得と検証
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

#### 2. ダッシュボードコンポーネント

```typescript
// src/components/subcategories/population/basic-population/BasicPopulationNationalDashboard.tsx
export const BasicPopulationNationalDashboard: React.FC<DashboardProps> = ({
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
      {/* 統計カードセクション */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatisticsMetricCard
            params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
            areaCode={areaCode}
            title="全国総人口"
            color="#4f46e5"
          />
          {/* 他の統計カード */}
        </div>
      </div>
      
      {/* その他のセクション */}
    </SubcategoryLayout>
  );
};
```

#### 3. 可視化コンポーネント

```typescript
// src/components/dashboard/StatisticsMetricCard.tsx
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
    </div>
  );
};
```

## 基本的な実装フロー

### 1. 新しいサブカテゴリの追加

#### ステップ1: サブカテゴリの定義

```typescript
// src/config/categories.json
{
  "population": {
    "id": "population",
    "name": "人口",
    "subcategories": {
      "basic-population": {
        "id": "basic-population",
        "name": "基本人口",
        "description": "総人口、男女別人口などの基本統計"
      }
    }
  }
}
```

#### ステップ2: ディレクトリの作成

```bash
mkdir -p src/components/subcategories/population/basic-population
```

#### ステップ3: ダッシュボードコンポーネントの作成

```typescript
// BasicPopulationNationalDashboard.tsx
export const BasicPopulationNationalDashboard: React.FC<DashboardProps> = ({
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
      {/* コンテンツ */}
    </SubcategoryLayout>
  );
};
```

#### ステップ4: エクスポートの設定

```typescript
// src/components/subcategories/population/basic-population/index.ts
export { BasicPopulationNationalDashboard } from './BasicPopulationNationalDashboard';
export { BasicPopulationPrefectureDashboard } from './BasicPopulationPrefectureDashboard';
export { BasicPopulationMunicipalityDashboard } from './BasicPopulationMunicipalityDashboard';
```

### 2. 新しい可視化コンポーネントの追加

#### ステップ1: コンポーネントの作成

```typescript
// src/components/dashboard/NewChart.tsx
export const NewChart: React.FC<NewChartProps> = ({
  data,
  title,
  height = 300,
  ...props
}) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {/* チャートの実装 */}
      </ResponsiveContainer>
    </div>
  );
};
```

#### ステップ2: 型定義の追加

```typescript
// src/types/dashboard.ts
export interface NewChartProps {
  data: ChartData[];
  title: string;
  height?: number;
  color?: string;
  showLegend?: boolean;
}
```

#### ステップ3: エクスポートの設定

```typescript
// src/components/dashboard/index.ts
export { NewChart } from './NewChart';
```

### 3. データ取得の実装

#### ステップ1: データ取得フックの作成

```typescript
// src/hooks/useNewData.ts
export function useNewData(params: DataParams, areaCode: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await fetchNewData(params, areaCode);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params, areaCode]);
  
  return { data, loading, error };
}
```

#### ステップ2: データ取得サービスの実装

```typescript
// src/lib/services/NewDataService.ts
export class NewDataService {
  static async fetchNewData(params: DataParams, areaCode: string): Promise<NewData> {
    // データ取得の実装
    const response = await fetch('/api/new-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params, areaCode })
    });
    
    if (!response.ok) {
      throw new Error('データの取得に失敗しました');
    }
    
    return response.json();
  }
}
```

## 3階層システムの概要

### 地域レベル

1. **全国レベル** (`areaCode: "00000"`)
   - 日本全国の統計データ
   - 都道府県ランキング表示
   - コロプレス地図表示

2. **都道府県レベル** (`areaCode: "01000"-"47000"`)
   - 特定の都道府県の統計データ
   - 全国との比較
   - 市区町村ランキング表示

3. **市区町村レベル** (`areaCode: "01101"-"47999"`)
   - 特定の市区町村の統計データ
   - 都道府県内順位
   - 周辺市区町村との比較

### コンポーネント選択

```typescript
// 地域レベルに応じたコンポーネント選択
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
      .catch(() => {
        // フォールバック: デフォルトダッシュボード
        return import(`@/components/subcategories/${category}/${subcategory}/DefaultDashboard`);
      })
  );
}
```

## 開発のベストプラクティス

### 1. コンポーネント設計

- **単一責任の原則**: 各コンポーネントは一つの責任を持つ
- **再利用性**: 共通コンポーネントは再利用可能に設計
- **型安全性**: TypeScriptの型定義を適切に使用

### 2. データ取得

- **エラーハンドリング**: 適切なエラーハンドリングを実装
- **ローディング状態**: ローディング状態を適切に表示
- **キャッシュ**: データのキャッシュを適切に使用

### 3. パフォーマンス

- **遅延読み込み**: 必要に応じて遅延読み込みを実装
- **メモ化**: 適切な場所でメモ化を使用
- **最適化**: 不要な再レンダリングを避ける

### 4. アクセシビリティ

- **セマンティックHTML**: 適切なHTMLタグを使用
- **キーボードナビゲーション**: キーボードでの操作を可能にする
- **スクリーンリーダー**: スクリーンリーダーでの読み上げに対応

## トラブルシューティング

### よくある問題

#### 1. データが表示されない

```typescript
// デバッグ用のログを追加
console.log('Data params:', params);
console.log('Area code:', areaCode);
console.log('API response:', response);
```

#### 2. コンポーネントが読み込まれない

```typescript
// 動的インポートのエラーハンドリング
const DashboardComponent = lazy(() => 
  import(`@/components/subcategories/${category}/${subcategory}/${componentName}`)
    .then(module => ({ default: module[componentName] }))
    .catch(error => {
      console.error('Component loading error:', error);
      return import(`@/components/subcategories/${category}/${subcategory}/DefaultDashboard`);
    })
);
```

#### 3. スタイルが適用されない

```typescript
// Tailwind CSSのクラスが正しく適用されているか確認
<div className="bg-white dark:bg-neutral-800 rounded-lg border p-4">
  {/* コンテンツ */}
</div>
```

## 次のステップ

1. **ダッシュボード作成ガイド**: 新しいダッシュボードの作成方法
2. **可視化実装ガイド**: 新しい可視化コンポーネントの実装方法
3. **e-Stat API統合**: e-Stat APIとの統合方法
4. **ベストプラクティス**: 開発のベストプラクティス

## まとめ

このガイドでは、ダッシュボードドメインの開発を開始するための基本的な手順を説明しました。次のステップとして、具体的な実装ガイドを参照して、より詳細な実装方法を学習してください。
