# コンポーネント設計ガイド

## 1. 概要

このドキュメントでは、stats47プロジェクトのコンポーネント設計の全体像を説明します。本プロジェクトは、e-Stat APIから取得した統計データを視覚化し、ユーザーに直感的なデータ探索体験を提供することを目的としています。

### プロジェクト技術スタック

- **フレームワーク**: Next.js 15 App Router
- **UI**: React 19, TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: Jotai（アトミック状態管理）
- **データベース**: Cloudflare D1
- **可視化**: D3.js + TopoJSON
- **開発環境**: Storybook 9.1.3

### 設計原則

- **単一責任の原則**: 各コンポーネントは一つの明確な責任を持つ
- **再利用性**: 共通のUIパターンは共通コンポーネントとして実装
- **型安全性**: TypeScriptの型定義を活用
- **アクセシビリティ**: WCAG準拠の実装
- **パフォーマンス**: サーバーコンポーネントとクライアントコンポーネントの適切な分離

## 2. ページコンポーネント

### 2.1 カテゴリーページ

#### 概要

カテゴリーページ（`/[category]`）は、各統計カテゴリーのランディングページとして機能し、所属するサブカテゴリーへの導線を提供します。

#### 設計目標

- **明確なナビゲーション**: サブカテゴリーへの分かりやすい導線
- **視覚的な整理**: カテゴリーアイコンと色による識別
- **柔軟な対応**: サブカテゴリーの有無に応じた表示
- **一貫性**: 全カテゴリーで統一されたレイアウト

#### コンポーネント構造

**CategoryPageClient**

カテゴリーページのメインクライアントコンポーネント。

```typescript
interface CategoryPageClientProps {
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    subcategories?: SubcategoryItem[];
  };
}

interface SubcategoryItem {
  id: string;
  name: string;
  href: string;
}
```

#### ページレイアウト

```
┌─────────────────────────────────────────┐
│              Header                     │
├─────────────────────────────────────────┤
│  Sidebar  │   Page Header              │
│           ├─────────────────────────────┤
│           │                             │
│           │   Subcategory Grid          │
│           │   ┌──────┐ ┌──────┐        │
│           │   │ Sub1 │ │ Sub2 │        │
│           │   └──────┘ └──────┘        │
│           │   ┌──────┐ ┌──────┐        │
│           │   │ Sub3 │ │ Sub4 │        │
│           │   └──────┘ └──────┘        │
│           │                             │
└───────────┴─────────────────────────────┘
```

#### UI要素

**ページヘッダー**
- カテゴリーアイコン: カテゴリーを視覚的に識別
- パンくずナビゲーション: 統計データ / カテゴリー名
- タイトル: カテゴリー名を大きく表示

**サブカテゴリーグリッド**
- グリッドレイアウト:
  - デスクトップ: 3カラム
  - タブレット: 2カラム
  - モバイル: 1カラム
- カードデザイン:
  - カテゴリーアイコン（カラー付き）
  - サブカテゴリー名
  - ホバー効果

**空状態表示**
- カテゴリーアイコン（大）
- 「このカテゴリーにはサブカテゴリーがありません」メッセージ

#### カラーシステム

各カテゴリーは固有の色を持ち、一貫した視覚的識別を提供：

```typescript
const colorClassMap: Record<string, ColorClasses> = {
  teal: { bg: 'bg-teal-100', text: 'text-teal-600', ... },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', ... },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', ... },
  green: { bg: 'bg-green-100', text: 'text-green-600', ... },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600', ... },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', ... },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', ... },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', ... },
  red: { bg: 'bg-red-100', text: 'text-red-600', ... },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600', ... },
};
```

#### 実装

**サーバーコンポーネント**

```typescript
// src/app/[category]/page.tsx
import { CategoryPageClient } from '@/components/choropleth/CategoryPageClient';
import categoriesData from '@/config/categories.json';

export default async function CategoryPage({ params }: PageProps) {
  const { category: categoryId } = params;

  // カテゴリの存在確認
  const category = categoriesData.find((cat) => cat.id === categoryId);

  if (!category) {
    notFound();
  }

  return <CategoryPageClient category={category} />;
}
```

**クライアントコンポーネント**

```typescript
// src/components/choropleth/CategoryPageClient.tsx
'use client';

export const CategoryPageClient: React.FC<CategoryPageClientProps> = ({ category }) => {
  const colorClasses = colorClassMap[category.color] || colorClassMap.gray;

  return (
    <>
      <Header />
      <Sidebar />

      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        <div className="...">
          {/* ページヘッダー */}
          <div className="...">
            <CategoryIcon iconName={category.icon} />
            <nav>{/* パンくずナビ */}</nav>
            <h1>{category.name}</h1>
          </div>

          {/* サブカテゴリー一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.subcategories?.map((subcategory) => (
              <Link
                key={subcategory.id}
                href={`/${category.id}${subcategory.href}`}
                className="..."
              >
                {/* サブカテゴリーカード */}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};
```

#### データソース

カテゴリー情報は `src/config/categories.json` から取得：

```json
{
  "id": "landweather",
  "name": "国土・気象",
  "icon": "FaMapMarkedAlt",
  "color": "teal",
  "subcategories": [
    {
      "id": "land-area",
      "name": "土地面積",
      "href": "/land-area"
    }
  ]
}
```

#### ルーティング

- カテゴリーページ: `/[category]`（例: `/landweather`, `/population`）
- サブカテゴリーへのリンク: `/[category]/[subcategory]`（例: `/landweather/land-area`）

### 2.2 サブカテゴリーページ

#### 概要

サブカテゴリーページ（`/[category]/[subcategory]`）は、カテゴリーごとに整理されたコンポーネント構造を採用し、各サブカテゴリーに最適化されたレイアウトとデータ可視化を提供します。

#### 設計目標

- **柔軟性**: サブカテゴリーごとに異なるレイアウトとデータ表示
- **保守性**: カテゴリー別のディレクトリ構造による整理
- **再利用性**: 共通レイアウトとコンポーネントの活用
- **拡張性**: 新しいサブカテゴリーの追加が容易

#### ディレクトリ構造

```
src/components/subcategories/
├── README.md                          # 使い方ドキュメント
├── SubcategoryLayout.tsx              # 共通レイアウトコンポーネント
├── index.tsx                          # コンポーネントマッピング
├── landweather/                       # 国土・気象カテゴリー
│   ├── index.tsx
│   ├── LandAreaPage.tsx
│   └── [その他のサブカテゴリー].tsx
├── population/                        # 人口・世帯カテゴリー
│   ├── index.tsx
│   ├── BasicPopulationPage.tsx
│   └── [その他のサブカテゴリー].tsx
├── laborwage/                         # 労働・賃金カテゴリー
│   ├── index.tsx
│   ├── WagesWorkingConditionsPage.tsx
│   └── [その他のサブカテゴリー].tsx
├── agriculture/                       # 農林水産業カテゴリー
├── miningindustry/                    # 鉱工業カテゴリー
├── commercial/                        # 商業・サービス業カテゴリー
├── economy/                           # 企業・家計・経済カテゴリー
├── construction/                      # 住宅・土地・建設カテゴリー
├── energy/                            # エネルギー・水カテゴリー
├── tourism/                           # 運輸・観光カテゴリー
├── educationsports/                   # 教育・文化・スポーツカテゴリー
├── administrativefinancial/           # 行財政カテゴリー
├── safetyenvironment/                 # 司法・安全・環境カテゴリー
├── socialsecurity/                    # 社会保障・衛生カテゴリー
├── international/                     # 国際カテゴリー
└── infrastructure/                    # 社会基盤施設カテゴリー
```

#### コンポーネント構成

**SubcategoryLayout（共通レイアウト）**

すべてのサブカテゴリーページで共有される基本レイアウト。

```typescript
interface SubcategoryLayoutProps {
  category: {
    id: string;
    name: string;
    icon: string;
  };
  subcategory: {
    id: string;
    name: string;
  };
  children: React.ReactNode;
}
```

提供機能:
- ヘッダー
- サイドバー
- パンくずナビゲーション
- ページタイトル

**サブカテゴリー専用コンポーネント**

各サブカテゴリーに特化したページコンポーネント。

```typescript
interface SubcategoryPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  choroplethData: ChoroplethDisplayData | null;
  formattedValues: any[] | null;
  currentYear: string;
  isSample: boolean;
  error: string | null;
}
```

#### 実装済みレイアウトパターン

**パターン1: 2カラムレイアウト（LandAreaPage）**

```
┌─────────────────────────────────────────┐
│              Page Header                │
├─────────────────────────────────────────┤
│ Year Selector  │ Data Info              │
├─────────────────────────────────────────┤
│                            │            │
│     Choropleth Map         │  Data      │
│                            │  Table     │
│                            │            │
└─────────────────────────────────────────┘
```

特徴:
- 左側: コロプレス地図（全幅）
- 右側: データテーブル（固定幅）
- シンプルで直感的な表示

**パターン2: サマリーカード + 2カラム（BasicPopulationPage）**

```
┌─────────────────────────────────────────┐
│              Page Header                │
├─────────────────────────────────────────┤
│ Summary Cards (合計・平均・最大・最小)  │
├─────────────────────────────────────────┤
│                            │            │
│     Choropleth Map         │  Data      │
│                            │  Table     │
│                            │            │
└─────────────────────────────────────────┘
```

特徴:
- 上部: 統計サマリーカード（4つのメトリクス）
- 下部: 2カラムレイアウト
- データの概要を一目で把握可能

**パターン3: 1カラムレイアウト（WagesWorkingConditionsPage）**

```
┌─────────────────────────────────────────┐
│              Page Header                │
├─────────────────────────────────────────┤
│                                         │
│         Choropleth Map (full width)     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│         Data Table (full width)         │
│                                         │
└─────────────────────────────────────────┘
```

特徴:
- 地図とテーブルを全幅で縦に配置
- 詳細なデータ表示に最適
- スクロールで全体を閲覧

#### コンポーネントマッピングシステム

**動的コンポーネント選択**

```typescript
// src/components/subcategories/index.tsx
export const subcategoryComponentMap: Record<string, React.ComponentType<any>> = {
  // 国土・気象
  'land-area': LandAreaPage,

  // 人口・世帯
  'basic-population': BasicPopulationPage,

  // 労働・賃金
  'wages-working-conditions': WagesWorkingConditionsPage,

  // マッピングにないものはデフォルトコンポーネント
};

export const getSubcategoryComponent = (subcategoryId: string): React.ComponentType<any> => {
  return subcategoryComponentMap[subcategoryId] || SubcategoryPageClient;
};
```

**ページでの使用**

```typescript
// src/app/[category]/[subcategory]/page.tsx
export default async function SubcategoryPage({ params, searchParams }: PageProps) {
  const { category: categoryId, subcategory: subcategoryId } = params;

  // データ取得処理...

  // サブカテゴリーIDに対応するコンポーネントを取得
  const SubcategoryComponent = getSubcategoryComponent(subcategoryId);

  return (
    <SubcategoryComponent
      category={category}
      subcategory={subcategory}
      choroplethData={choroplethData}
      formattedValues={formattedValues}
      currentYear={year}
      isSample={isSample}
      error={error}
    />
  );
}
```

#### 新しいサブカテゴリーの追加方法

**1. コンポーネントの作成**

適切なカテゴリーディレクトリ内に新しいコンポーネントを作成：

```tsx
// src/components/subcategories/population/PopulationCompositionPage.tsx
'use client';

import React from 'react';
import { SubcategoryLayout } from '../SubcategoryLayout';
import { CategoryData, SubcategoryData, ChoroplethDisplayData } from '@/types/choropleth';

interface PopulationCompositionPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  choroplethData: ChoroplethDisplayData | null;
  formattedValues: any[] | null;
  currentYear: string;
  isSample: boolean;
  error: string | null;
}

export const PopulationCompositionPage: React.FC<PopulationCompositionPageProps> = ({
  category,
  subcategory,
  // ...props
}) => {
  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* カスタムレイアウトの実装 */}
    </SubcategoryLayout>
  );
};
```

**2. カテゴリーのindex.tsxに追加**

```tsx
// src/components/subcategories/population/index.tsx
export { BasicPopulationPage } from './BasicPopulationPage';
export { PopulationCompositionPage } from './PopulationCompositionPage'; // 追加
```

**3. コンポーネントマッピングに追加**

```tsx
// src/components/subcategories/index.tsx
import { PopulationCompositionPage } from './population';

export const subcategoryComponentMap: Record<string, React.ComponentType<any>> = {
  // 既存のマッピング...
  'population-composition': PopulationCompositionPage, // 追加
};
```

## 3. 共通コンポーネント

### e-Statコンポーネント構造

e-Stat関連のコンポーネントは、機能別に以下の3つのディレクトリに整理されています：

```
src/components/estat/
├── metadata/                    # メタデータ関連コンポーネント
│   ├── EstatMetadataPageHeader.tsx
│   ├── EstatMetadataTabNavigation.tsx
│   ├── EstatMetadataTabContent.tsx
│   ├── EstatMetadataDisplay.tsx
│   ├── SavedMetadataDisplay.tsx
│   ├── MetadataSaver.tsx
│   ├── MetadataActions.tsx
│   ├── MetaInfoCard.tsx
│   ├── MetaInfoFetcher.tsx
│   └── index.ts
├── data/                       # データ表示関連コンポーネント
│   ├── EstatDataDisplay/
│   ├── EstatDataFetcher/
│   ├── EstatDataTable.tsx
│   └── index.ts
├── visualization/              # 可視化関連コンポーネント
│   ├── ChoroplethMap.tsx
│   ├── YearSelector.tsx
│   └── index.ts
└── index.ts                    # 全体のエクスポート管理
```

### EstatMetadataPageコンポーネント群

e-Statメタ情報管理ページのコンポーネント群。元の単一ファイル（183行）を以下の4つのコンポーネントに分割して、保守性と再利用性を向上させました。

#### 1. EstatMetadataPageHeader

ページヘッダー部分を担当するコンポーネント。

**責任**:
- ページタイトルの表示
- アクションボタン（更新、e-STAT APIリンク）の表示
- ローディング状態の管理

**Props**:

```typescript
interface EstatMetadataPageHeaderProps {
  loading: boolean;
  currentStatsId: string;
  onRefresh: () => void;
}
```

#### 2. EstatMetadataTabNavigation

タブナビゲーション部分を担当するコンポーネント。

**責任**:
- タブの定義と表示
- アクティブタブの管理
- タブ切り替えの処理

**Props**:

```typescript
interface EstatMetadataTabNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}
```

**タブ定義**:
- `fetch`: メタ情報取得
- `save`: メタ情報保存
- `saved`: 保存済データ確認

#### 3. EstatMetadataTabContent

タブコンテンツのレンダリング部分を担当するコンポーネント。

**責任**:
- 各タブのコンテンツレンダリング
- タブ別のロジック管理

**Props**:

```typescript
interface EstatMetadataTabContentProps {
  activeTab: TabId;
  metaInfo: EstatMetaInfoResponse | null;
  loading: boolean;
  error: string | null;
  onFetchMetaInfo: (statsDataId: string) => void;
}
```

#### 4. EstatMetadataPage（リファクタリング後）

メインページコンポーネント。分割されたコンポーネントを統合。

**責任**:
- 状態管理（metaInfo, loading, error, currentStatsId, activeTab）
- イベントハンドリング（handleFetchMetaInfo, handleRefresh, handleTabChange）
- 分割されたコンポーネントの統合

**メリット**:
- **単一責任の原則**: 各コンポーネントが明確な責任を持つ
- **再利用性**: 各コンポーネントを他のページでも使用可能
- **保守性**: 変更時の影響範囲が限定的
- **テスタビリティ**: 各コンポーネントを個別にテスト可能
- **可読性**: コードの意図が明確

### SavedMetadataDisplay

保存されたe-STATメタデータを表示するコンポーネント。

#### 設計方針

- **サーバーコンポーネント**: 基本表示部分はサーバーサイドでレンダリング
- **クライアントコンポーネント分離**: インタラクティブ部分（更新ボタン、エラー時の再試行）は別コンポーネントとして分離
- **ハイブリッド構成**: サーバーコンポーネント内にクライアントコンポーネントを配置

#### コンポーネント構成

1. **SavedMetadataDisplay** (サーバーコンポーネント)
   - データの取得と表示
   - エラーハンドリング
   - 基本的なレイアウト

2. **MetadataActions** (クライアントコンポーネント)
   - 更新ボタン
   - エラー時の再試行ボタン
   - インタラクティブな機能

#### メリット

- **パフォーマンス向上**: サーバーサイドレンダリングによる初期表示速度の向上
- **SEO改善**: サーバーサイドでHTMLが生成される
- **バンドルサイズ削減**: クライアントサイドのコードが減少
- **保守性向上**: 関心の分離によるコードの可読性向上

#### 使用方法

```tsx
// サーバーコンポーネントとして使用
<SavedMetadataDisplay />

// 初期データを渡す場合
<SavedMetadataDisplay
  initialMetadata={metadata}
  initialError={error}
/>
```

### EstatDataDisplayコンポーネント群

#### 概要

e-Stat APIのレスポンスデータを表示するためのコンポーネント群です。各コンポーネントは個別のディレクトリに分離され、Storybook とテストファイルが含まれています。

#### コンポーネント構成

```
src/components/estat/data/EstatDataDisplay/
├── EstatDataDisplay.tsx        # メインコンポーネント
├── EstatDataDisplay.stories.tsx
├── EstatDataDisplay.test.tsx
├── index.ts                    # エクスポート管理
└── components/                 # サブコンポーネント群
    ├── EstatOverview/          # 概要表示
    │   ├── EstatOverview.tsx
    │   ├── EstatOverview.stories.tsx
    │   ├── EstatOverview.test.tsx
    │   └── index.ts
    ├── EstatCategoriesTable/   # カテゴリテーブル
    │   ├── EstatCategoriesTable.tsx
    │   ├── EstatCategoriesTable.stories.tsx
    │   ├── EstatCategoriesTable.test.tsx
    │   └── index.ts
    ├── EstatAreasTable/        # 地域テーブル
    │   ├── EstatAreasTable.tsx
    │   ├── EstatAreasTable.stories.tsx
    │   ├── EstatAreasTable.test.tsx
    │   └── index.ts
    ├── EstatYearsTable/        # 年度テーブル
    │   ├── EstatYearsTable.tsx
    │   ├── EstatYearsTable.stories.tsx
    │   ├── EstatYearsTable.test.tsx
    │   └── index.ts
    ├── EstatValuesTable/       # 値テーブル
    │   ├── EstatValuesTable.tsx
    │   ├── EstatValuesTable.stories.tsx
    │   ├── EstatValuesTable.test.tsx
    │   └── index.ts
    └── EstatRawData/           # Raw JSON表示
        ├── EstatRawData.tsx
        ├── EstatRawData.stories.tsx
        ├── EstatRawData.test.tsx
        └── index.ts
```

#### 各コンポーネントの役割

1. **EstatDataDisplay**: メインコンポーネント
   - タブ形式で各データ表示コンポーネントを統合
   - ローディング、エラー、データなし状態の処理
   - JSONダウンロード機能

2. **EstatOverview**: 概要表示
   - 基本情報とデータ詳細を折りたたみ可能なセクションで表示
   - ステータス、統計表ID、統計表名、表題の表示
   - データ件数、分類項目数、更新日時の表示

3. **EstatCategoriesTable**: カテゴリテーブル
   - カテゴリ01から05までの分類コードを表形式で表示
   - DataTableコンポーネントを使用

4. **EstatAreasTable**: 地域テーブル
   - 地域コードと地域名を表形式で表示
   - DataTableコンポーネントを使用

5. **EstatYearsTable**: 年度テーブル
   - 年度コードと説明を表形式で表示
   - DataTableコンポーネントを使用

6. **EstatValuesTable**: 値テーブル
   - カテゴリ、地域、年度、値、単位を表形式で表示
   - カスタムレンダリング機能付き
   - DataTableコンポーネントを使用

7. **EstatRawData**: Raw JSON表示
   - JSONデータを整形して表示
   - コピーボタンでクリップボードにコピー可能

#### 使用方法

```tsx
import { EstatDataDisplay } from "@/components/estat/data/EstatDataDisplay";

// メインコンポーネントの使用
<EstatDataDisplay data={apiResponse} loading={loading} error={error} />

// 個別コンポーネントの使用
import { EstatOverview } from "@/components/estat/data/EstatDataDisplay";

<EstatOverview data={apiResponse} />
```

### Messageコンポーネント

#### 概要

メッセージ表示用の共通コンポーネントで、成功、エラー、情報、警告の4種類のメッセージタイプに対応しています。

#### 特徴

- **4種類のメッセージタイプ**: success, error, info, warning
- **一般的なcalloutスタイル**: 標準的なUIパターンに準拠
- **ダークモード対応**: ライト/ダーク両方のテーマで最適化
- **カスタマイズ可能**: 追加のCSSクラス名を指定可能

#### 使用方法

```tsx
import Message from "@/components/common/Message";

// 成功メッセージ
<Message type="success" message="保存が完了しました" />

// エラーメッセージ
<Message type="error" message="エラーが発生しました" />

// カスタムクラス付き
<Message type="info" message="情報メッセージ" className="mt-4 shadow-lg" />
```

#### 実装場所

- **コンポーネント**: `src/components/common/Message.tsx`
- **ストーリー**: `src/components/common/Message.stories.tsx`
- **スタイル**: `src/hooks/useStyles.ts`の`message`と`messageText`セクション

## 4. 可視化コンポーネント

### 4.1 コロプレス地図

#### 概要

e-stat APIから都道府県統計データを取得し、カテゴリ・サブカテゴリに分類してコロプレス地図で表示する機能です。

#### 機能要件

##### カテゴリ・サブカテゴリ分類システム

**主要カテゴリ**

1. **人口・世帯**
   - 人口総数、世帯数、人口密度
   - 年齢別人口、高齢化率
   - 出生率、死亡率

2. **経済・産業**
   - 県内総生産、一人当たり県民所得
   - 産業別従業者数、製造業出荷額
   - 農業産出額、観光客数

3. **社会・インフラ**
   - 教育（学校数、進学率）
   - 医療（病院数、医師数）
   - 交通（道路密度、駅数）

4. **環境・地理**
   - 森林面積、可住地面積
   - 気象データ（降水量、気温）
   - 自然災害発生件数

##### データ構造

```typescript
interface CategoryData {
  id: string;
  name: string;
  description: string;
  subcategories: SubcategoryData[];
}

interface SubcategoryData {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  statsTables: StatsTableInfo[];
  unit: string;
  dataType: 'numerical' | 'percentage' | 'rate';
}

interface StatsTableInfo {
  statsDataId: string;
  tableName: string;
  lastUpdated: string;
  availableYears: string[];
}
```

#### 画面設計

##### レイアウト構成

```
┌─────────────────────────────────────────────────────────────────┐
│ Header Navigation                                               │
├─────────────────────────────────────────────────────────────────┤
│ │ Sidebar │ Main Content Area                                  │
│ │         │ ┌─────────────────────────────────────────────────┐ │
│ │Category │ │ Category/Subcategory Selector                   │ │
│ │Tree     │ ├─────────────────────────────────────────────────┤ │
│ │         │ │ Year/Time Period Selector                       │ │
│ │         │ ├─────────────────────────────────────────────────┤ │
│ │         │ │ Choropleth Map Display                         │ │
│ │         │ │ ┌─────────────────────────────────────────────┐ │ │
│ │         │ │ │ SVG Map with Color Coding                   │ │ │
│ │         │ │ │ Legend & Controls                           │ │ │
│ │         │ │ └─────────────────────────────────────────────┘ │ │
│ │         │ ├─────────────────────────────────────────────────┤ │
│ │         │ │ Data Table (Prefecture Ranking)                │ │
│ │         │ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

##### コンポーネント構成

```typescript
// メインページコンポーネント
export default function ChoroplethMapPage() {
  // 状態管理とデータフェッチング
}

// カテゴリ選択サイドバー
export const CategorySidebar: React.FC<{
  categories: CategoryData[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onCategorySelect: (categoryId: string) => void;
  onSubcategorySelect: (subcategoryId: string) => void;
}> = () => {};

// 年度・期間選択コンポーネント
export const YearSelector: React.FC<{
  availableYears: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
}> = () => {};

// 地図表示コンポーネント（既存のChoroplethMapを拡張）
export const EnhancedChoroplethMap: React.FC<{
  data: FormattedValue[];
  category: CategoryData;
  subcategory: SubcategoryData;
  options: MapVisualizationOptions;
}> = () => {};

// データテーブルコンポーネント
export const PrefectureDataTable: React.FC<{
  data: FormattedValue[];
  sortBy: 'name' | 'value';
  sortOrder: 'asc' | 'desc';
}> = () => {};
```

#### データ取得設計

##### API設計パターン

**エンドポイント構成**

```typescript
// カテゴリ・サブカテゴリ情報取得
GET /api/choropleth/categories
Response: CategoryData[]

// 特定サブカテゴリのデータ取得
GET /api/choropleth/data?subcategoryId={id}&year={year}
Response: {
  data: FormattedValue[];
  metadata: {
    subcategory: SubcategoryData;
    year: string;
    lastUpdated: string;
    source: string;
  };
}

// 利用可能な年度一覧取得
GET /api/choropleth/years?subcategoryId={id}
Response: {
  availableYears: string[];
  defaultYear: string;
}
```

##### キャッシュ戦略

1. **カテゴリ情報**: アプリケーション起動時に取得、セッション中は保持
2. **統計データ**:
   - ブラウザキャッシュ: 24時間
   - サーバーキャッシュ: Cloudflare D1に保存
   - 更新頻度: 統計表の更新頻度に応じて設定

##### e-stat API統合

**APIパラメータマッピング**

```typescript
interface EstatApiMapping {
  // 統計表ID（サブカテゴリごとに定義）
  statsDataId: string;

  // 地域フィルター（都道府県レベル）
  cdArea: '01000-47000'; // 都道府県コード範囲

  // 時系列フィルター
  cdTime?: string; // 年度指定

  // カテゴリフィルター（統計項目）
  cdCat01?: string; // 分類事項1
  cdCat02?: string; // 分類事項2
  cdCat03?: string; // 分類事項3
}
```

**データ変換処理**

```typescript
// e-stat APIレスポンスから地図表示用データへの変換
export function transformEstatToMapData(
  estatResponse: EstatStatsDataResponse,
  subcategory: SubcategoryData
): FormattedValue[] {
  // 1. データの抽出と正規化
  // 2. 都道府県コードのマッピング
  // 3. 数値の型変換とフォーマット
  // 4. 表示用データの生成
}
```

#### ファイル構成

```
src/
├── app/
│   └── choropleth/
│       └── page.tsx                 # メインページ
├── components/
│   └── choropleth/
│       ├── CategorySidebar.tsx      # カテゴリ選択
│       ├── YearSelector.tsx         # 年度選択
│       ├── EnhancedChoroplethMap.tsx # 拡張地図コンポーネント
│       └── PrefectureDataTable.tsx  # データテーブル
├── lib/
│   └── choropleth/
│       ├── categories.ts            # カテゴリ定義
│       ├── api-client.ts           # API呼び出し
│       └── data-transformer.ts      # データ変換
└── types/
    └── choropleth.ts               # 型定義
```

#### 状態管理（Jotai）

```typescript
// アトム定義
export const selectedCategoryAtom = atom<string | null>(null);
export const selectedSubcategoryAtom = atom<string | null>(null);
export const selectedYearAtom = atom<string | null>(null);
export const categoriesAtom = atom<CategoryData[]>([]);
export const mapDataAtom = atom<FormattedValue[]>([]);
export const loadingAtom = atom<boolean>(false);
export const errorAtom = atom<string | null>(null);

// 派生アトム
export const availableSubcategoriesAtom = atom((get) => {
  const categories = get(categoriesAtom);
  const selectedCategory = get(selectedCategoryAtom);
  return categories.find(c => c.id === selectedCategory)?.subcategories || [];
});
```

#### データベース設計

```sql
-- カテゴリマスター
CREATE TABLE choropleth_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- サブカテゴリマスター
CREATE TABLE choropleth_subcategories (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES choropleth_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT,
  data_type TEXT CHECK(data_type IN ('numerical', 'percentage', 'rate')),
  stats_data_id TEXT NOT NULL, -- e-stat統計表ID
  display_order INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- データキャッシュ
CREATE TABLE choropleth_data_cache (
  id TEXT PRIMARY KEY,
  subcategory_id TEXT REFERENCES choropleth_subcategories(id),
  year TEXT,
  data JSON,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);
```

#### カラースキーム設定

- **数値データ**: Blues, Greens, Oranges
- **比較データ**: RdYlBu, RdYlGn, Spectral
- **割合データ**: PuBuGn, YlOrRd

#### 注意点

1. **e-stat API制限**: リクエスト頻度制限に注意（1秒間に10リクエスト以下）
2. **データ更新頻度**: 統計表によって更新頻度が異なるため、キャッシュ戦略を適切に設定
3. **パフォーマンス**: 大量のデータを扱うため、仮想化やページネーション実装を検討
4. **アクセシビリティ**: 色覚異常者向けのカラーパレット対応
5. **SEO対応**: 統計データの検索エンジン最適化

### 4.2 その他の可視化

#### 共通可視化コンポーネント

**ChoroplethDataDisplayClient**
- コロプレス地図表示用のクライアントコンポーネント

**PrefectureDataTableClient**
- 都道府県別データテーブル表示用のクライアントコンポーネント

**YearSelector**
- 年度選択UI（必要に応じて各ページで実装）

## 5. スタイル管理

### アプローチ

プロジェクトでは、**カスタムフック `useStyles`** を使用したスタイル管理を採用しています。これにより、以下の利点を実現しています：

- **型安全性**: TypeScriptでのスタイル管理
- **一貫性**: プロジェクト全体での統一されたデザイン
- **保守性**: スタイルの変更が一箇所で可能
- **再利用性**: 共通のスタイルパターンを簡単に適用

### 使用方法

#### 基本的な使用方法

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

#### 利用可能なスタイル

```typescript
const styles = useStyles();

// レイアウト
styles.layout.section;    // space-y-6
styles.layout.row;        // space-y-4
styles.layout.grid;       // grid grid-cols-1 md:grid-cols-2 gap-4
styles.layout.flex;       // flex items-center gap-2

// カード
styles.card.base;         // 基本カード（padding: 6）
styles.card.compact;      // コンパクトカード（padding: 4）

// ボタン
styles.button.primary;    // プライマリボタン（インディゴ）
styles.button.secondary;  // セカンダリボタン（グレー）
styles.button.small;      // 小さいボタン

// 入力フィールド
styles.input.base;        // 基本入力フィールド
styles.input.disabled;    // 無効状態

// メッセージ - 一般的なcalloutスタイルに準拠
styles.message.success;   // 成功メッセージ（緑系）
styles.message.error;     // エラーメッセージ（赤系）
styles.message.info;      // 情報メッセージ（青系）
styles.message.warning;   // 警告メッセージ（琥珀系）

// メッセージテキスト色 - 一般的なcalloutスタイルに準拠
styles.messageText.success;  // 成功メッセージテキスト（緑系）
styles.messageText.error;    // エラーメッセージテキスト（赤系）
styles.messageText.info;     // 情報メッセージテキスト（青系）
styles.messageText.warning;  // 警告メッセージテキスト（琥珀系）

// ヘッダー
styles.header.primary;    // プライマリヘッダー（インディゴ）
styles.header.secondary;  // セカンダリヘッダー（グレー）

// ラベル
styles.label.base;        // 基本ラベル
styles.label.required;    // 必須ラベル（*付き）

// 見出し
styles.heading.lg;        // 大見出し（text-lg）
styles.heading.md;        // 中見出し（text-base）
styles.heading.sm;        // 小見出し（text-sm）

// テキスト
styles.text.primary;      // プライマリテキスト（インディゴ）
styles.text.secondary;    // セカンダリテキスト
styles.text.body;         // 本文テキスト
styles.text.muted;        // 無効テキスト
```

#### スタイルの拡張

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

### 配色システム

#### メッセージタイプ別の配色

- **Success（成功）**: 緑系（`bg-green-50`, `text-green-800`）
- **Error（エラー）**: 赤系（`bg-red-50`, `text-red-800`）
- **Info（情報）**: 青系（`bg-blue-50`, `text-blue-800`）
- **Warning（警告）**: 琥珀系（`bg-amber-50`, `text-amber-800`）

#### ダークモード対応

すべてのスタイルはダークモードに対応しており、`dark:`プレフィックスを使用して適切な色を設定しています。

## 6. コンポーネント開発環境

### Storybook統合

#### 概要

コンポーネントの開発・テスト・ドキュメント化のためにStorybook 9.1.3を統合しています。

#### 設定

- **メイン設定**: `.storybook/main.ts`
- **プレビュー設定**: `.storybook/preview.tsx`
- **スタイル**: `.storybook/storybook.css`
- **Tailwind CSS対応**: プロジェクトのスタイルが正しく適用

#### 使用方法

```bash
# Storybook起動
npm run storybook

# ブラウザで http://localhost:6006 にアクセス
```

#### 利用可能なアドオン

- **@storybook/addon-a11y**: アクセシビリティチェック
- **@storybook/addon-vitest**: テスト実行
- **@storybook/addon-docs**: 自動ドキュメント生成

### 開発・テスト

各コンポーネントには以下のファイルが含まれています：

- **コンポーネントファイル**: メインの実装
- **Storybookファイル**: コンポーネントの開発・テスト用ストーリー
- **テストファイル**: ユニットテスト
- **index.ts**: エクスポート管理

## 7. データ統合

### e-Stat API統合

#### 概要

e-Stat APIからメタデータを取得し、Cloudflare D1データベースに保存する機能を実装しています。

#### データフロー

1. **ユーザー入力** → 統計表IDを入力
2. **API呼び出し** → `/api/estat/metadata/save`にPOST
3. **データ取得** → e-Stat APIからメタデータを取得
4. **データ変換** → CSV形式に変換
5. **D1保存** → Cloudflare D1に保存
6. **結果表示** → Messageコンポーネントで成功/エラー表示

#### 実装場所

- **APIルート**: `src/app/api/estat/metadata/save/route.ts`
- **フロントエンド**: `src/components/estat/metadata/MetadataSaver.tsx`
- **データ変換**: `src/lib/estat/data-transformer.ts`
- **データベース操作**: `src/lib/estat/metadata-database.ts`

### Cloudflare D1統合

#### データベース設定

- **データベース名**: `estat-db`
- **バインディング**: `ESTAT_DB`
- **スキーマ**: `database/schemas/main.sql`

#### セットアップ

```bash
# D1データベースの作成
npx wrangler d1 create estat-db

# ローカル開発用のD1インスタンスを起動
npx wrangler d1 execute estat-db --local --file=./database/schemas/main.sql
```

### データ保存戦略

#### 開発環境

- **保存先**: Cloudflare D1（本番環境と同じ）
- **利点**:
  - 本番環境との一貫性
  - ローカルPCの負荷軽減
  - 実際のAPI制限の確認
- **処理方式**: チャンク分割処理（50件ずつ）
- **待機時間**: チャンク間で200ms（API制限対策）

#### 本番環境

- **保存先**: Cloudflare D1
- **利点**:
  - スケーラビリティ
  - グローバル配信
  - 高可用性
- **処理方式**: チャンク分割処理（50件ずつ）
- **待機時間**: チャンク間で200ms（API制限対策）

#### チャンク処理の詳細

```typescript
// チャンクサイズ: 50件（Cloudflare D1の制限に最適化）
const CHUNK_SIZE = 50;

// チャンク分割
const chunks = [];
for (let i = 0; i < data.length; i += CHUNK_SIZE) {
  chunks.push(data.slice(i, i + CHUNK_SIZE));
}

// チャンクごとの処理
for (const [chunkIndex, chunk] of chunks.entries()) {
  // チャンク内で並列処理
  const chunkPromises = chunk.map(async (item) => {
    // 個別データの処理
  });

  // チャンク内の処理完了を待機
  const chunkResults = await Promise.all(chunkPromises);

  // 次のチャンクまで待機（API制限対策）
  if (chunkIndex < chunks.length - 1) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
```

## 8. ベストプラクティス

### スタイル管理

1. **useStylesフックの使用**: インラインスタイルは避ける
2. **一貫性の維持**: 既存のスタイルパターンを再利用
3. **ダークモード対応**: すべてのスタイルでダークモードを考慮
4. **レスポンシブデザイン**: モバイルファーストのアプローチ

### コンポーネント設計

1. **単一責任の原則**: 各コンポーネントは一つの責任を持つ
2. **再利用性**: 共通のUIパターンは共通コンポーネントとして実装
3. **型安全性**: TypeScriptの型定義を活用
4. **エラーハンドリング**: 適切なエラー状態とユーザーフィードバック

### テスト・開発

1. **Storybookでの開発**: コンポーネントの独立した開発・テスト
2. **アクセシビリティ**: a11yアドオンを使用したチェック
3. **パフォーマンス**: 不要な再レンダリングを避ける
4. **ドキュメント**: コンポーネントの使用方法を明確化

## 9. トラブルシューティング

### よくある問題

1. **スタイルが適用されない**
   - `useStyles`フックが正しくインポートされているか確認
   - Tailwind CSSの設定を確認

2. **Storybookでスタイルが表示されない**
   - `.storybook/storybook.css`の設定を確認
   - `tailwind.config.ts`にStorybookパスが含まれているか確認

3. **D1データベース接続エラー**
   - `wrangler.toml`の設定を確認
   - ローカルD1インスタンスが起動しているか確認

4. **e-Stat APIエラー**
   - APIキーが正しく設定されているか確認
   - 統計表IDが正しいか確認

### デバッグ方法

1. **ブラウザの開発者ツール**: CSSとJavaScriptのエラーを確認
2. **Storybookのコンソール**: コンポーネントのエラーを確認
3. **APIレスポンス**: ネットワークタブでAPI呼び出しを確認
4. **D1ログ**: ローカルD1インスタンスのログを確認

## 10. まとめ

本ガイドでは、stats47プロジェクトのコンポーネント設計について包括的に説明しました。ページコンポーネント、共通コンポーネント、可視化コンポーネント、スタイル管理、開発環境など、プロジェクト全体のアーキテクチャを理解することで、効率的な開発と保守が可能になります。

既存の技術スタックを最大限活用しつつ、段階的な実装により安定した機能提供を目指しています。ユーザーが直感的に統計データを探索し、視覚的に理解できるシステムの構築を継続していきます。
