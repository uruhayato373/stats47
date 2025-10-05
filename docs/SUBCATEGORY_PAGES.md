# サブカテゴリページの管理ガイド

## 概要

このドキュメントでは、統計データ表示サイトにおけるカテゴリ管理と、各サブカテゴリのページコンポーネントの構成について説明します。

## ファイル構造

```
stats47/
├── src/
│   ├── config/
│   │   └── categories.json              # カテゴリ・サブカテゴリの定義（ナビゲーション用）
│   ├── lib/
│   │   └── choropleth/
│   │       └── categories.ts            # カテゴリ・サブカテゴリの詳細定義（データ表示用）
│   ├── components/
│   │   └── subcategories/
│   │       ├── index.tsx                # コンポーネントマッピング
│   │       ├── SubcategoryLayout.tsx    # 共通レイアウト
│   │       ├── landweather/             # 国土・気象カテゴリ
│   │       ├── population/              # 人口・世帯カテゴリ
│   │       ├── laborwage/               # 労働・賃金カテゴリ
│   │       ├── agriculture/             # 農林水産業カテゴリ
│   │       ├── miningindustry/          # 鉱工業カテゴリ
│   │       ├── commercial/              # 商業・サービス業カテゴリ
│   │       ├── economy/                 # 企業・家計・経済カテゴリ
│   │       ├── construction/            # 住宅・土地・建設カテゴリ
│   │       ├── energy/                  # エネルギー・水カテゴリ
│   │       ├── tourism/                 # 運輸・観光カテゴリ
│   │       ├── educationsports/         # 教育・文化・スポーツカテゴリ
│   │       ├── administrativefinancial/ # 行財政カテゴリ
│   │       ├── safetyenvironment/       # 司法・安全・環境カテゴリ
│   │       ├── socialsecurity/          # 社会保障・衛生カテゴリ
│   │       └── international/           # 国際カテゴリ
│   └── app/
│       └── [category]/
│           └── [subcategory]/
│               └── page.tsx             # 動的ルーティング
└── docs/
    └── SUBCATEGORY_PAGES.md             # このドキュメント
```

## カテゴリ定義

### 1. categories.json

**ファイルパス**: `src/config/categories.json`

**用途**: ナビゲーションメニューの構成に使用

**構造**:
```json
{
  "categories": [
    {
      "id": "カテゴリID",
      "name": "カテゴリ名",
      "icon": "アイコン名",
      "color": "カラー",
      "subcategories": [
        {
          "id": "サブカテゴリID",
          "name": "サブカテゴリ名",
          "href": "/パス",
          "component": "コンポーネント名"
        }
      ]
    }
  ]
}
```

**例**:
```json
{
  "id": "international",
  "name": "国際",
  "icon": "FaGlobe",
  "color": "blue",
  "subcategories": [
    {
      "id": "foreigners",
      "name": "外国人",
      "href": "/foreigners",
      "component": "ForeignersPage"
    }
  ]
}
```

### 2. categories.ts

**ファイルパス**: `src/lib/choropleth/categories.ts`

**用途**: データ表示・統計情報の詳細定義

**構造**:
```typescript
export const CHOROPLETH_CATEGORIES: CategoryData[] = [
  {
    id: 'カテゴリID',
    name: 'カテゴリ名',
    description: 'カテゴリ説明',
    icon: 'アイコン名',
    displayOrder: 表示順序,
    subcategories: [
      {
        id: 'サブカテゴリID',
        categoryId: 'カテゴリID',
        name: 'サブカテゴリ名',
        description: '説明',
        unit: '単位',
        dataType: 'numerical' | 'percentage' | 'rate',
        statsDataId: 'e-Stat統計表ID',
        tableName: '統計表名',
        displayOrder: 表示順序,
        colorScheme: 'カラースキーム',
        categoryCode: 'カテゴリコード',
      }
    ]
  }
];
```

**例**:
```typescript
{
  id: 'international',
  name: '国際',
  description: '国際関係、貿易、在留外国人に関する統計',
  icon: 'Globe',
  displayOrder: 15,
  subcategories: [
    {
      id: 'foreigners',
      categoryId: 'international',
      name: '外国人',
      description: '外国人人口、国籍別統計',
      unit: '人',
      dataType: 'numerical',
      statsDataId: '0000010101',
      tableName: '社会・人口統計体系',
      displayOrder: 1,
      colorScheme: 'interpolateBlues',
      categoryCode: 'A1700',
    }
  ]
}
```

### 重要な注意点

⚠️ **categories.json と categories.ts のサブカテゴリIDは必ず一致させる必要があります**

- `categories.json` の `subcategories[].id`
- `categories.ts` の `subcategories[].id`

これらが一致しない場合、404エラーが発生します。

## ページコンポーネントの構成

### 基本構造

各サブカテゴリのページコンポーネントは以下の構造を持ちます：

```typescript
'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/dashboard/Ranking';

interface PageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const PageComponent: React.FC<PageProps> = ({
  category,
  subcategory,
  currentYear,
}) => {
  // e-Stat APIパラメータの定義
  const statsDataId = 'e-Stat統計表ID';
  const cdCat01 = 'カテゴリコード';

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* 統計カード */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01,
            }}
            areaCode="00000"
            title="カードタイトル"
            unit="単位"
            color="#色コード"
          />
        </div>
      </div>

      {/* ランキングと地図 */}
      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01,
        }}
        subcategory={subcategory}
        options={{
          colorScheme: subcategory.colorScheme || 'interpolateBlues',
          divergingMidpoint: 'zero',
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
```

### 高度な例（タブ付き）

```typescript
'use client';

import React, { useState } from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/dashboard/Ranking';
import { EstatGenderDonutChart } from '@/components/dashboard/GenderDonutChart';

interface PageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

type RankingTab = 'total' | 'type1' | 'type2';

export const PageComponent: React.FC<PageProps> = ({
  category,
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>('total');

  const statsDataId = 'e-Stat統計表ID';
  const cdCat01 = {
    total: 'カテゴリコード1',
    male: 'カテゴリコード2',
    female: 'カテゴリコード3',
    type1: 'カテゴリコード4',
    type2: 'カテゴリコード5',
  };

  const rankings = {
    total: {
      statsDataId: statsDataId,
      cdCat01: cdCat01.total,
      unit: '人',
      name: '総数',
    },
    type1: {
      statsDataId: statsDataId,
      cdCat01: cdCat01.type1,
      unit: '人',
      name: 'タイプ1',
    },
    type2: {
      statsDataId: statsDataId,
      cdCat01: cdCat01.type2,
      unit: '人',
      name: 'タイプ2',
    },
  };

  const activeRanking = rankings[activeTab];

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.total,
            }}
            areaCode="00000"
            title="全国総数"
            unit="人"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.type1,
            }}
            areaCode="00000"
            title="タイプ1"
            unit="人"
            color="#10b981"
          />
          <EstatGenderDonutChart
            params={{
              statsDataId: statsDataId,
            }}
            maleCategoryCode={cdCat01.male}
            femaleCategoryCode={cdCat01.female}
            areaCode="00000"
            title="男女比率"
            width={300}
            height={300}
          />
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="px-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('total')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'total'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              総数
            </button>
            <button
              onClick={() => setActiveTab('type1')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'type1'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              タイプ1
            </button>
            <button
              onClick={() => setActiveTab('type2')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'type2'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              タイプ2
            </button>
          </nav>
        </div>
      </div>

      {/* ランキングと地図 */}
      <EstatRanking
        params={{
          statsDataId: activeRanking.statsDataId,
          cdCat01: activeRanking.cdCat01,
        }}
        subcategory={{
          ...subcategory,
          unit: activeRanking.unit,
          name: activeRanking.name,
        }}
        options={{
          colorScheme: subcategory.colorScheme || 'interpolateBlues',
          divergingMidpoint: 'zero',
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
```

### コンポーネントの登録

#### 1. カテゴリディレクトリ内のindex.tsx

例: `src/components/subcategories/international/index.tsx`

```typescript
export { ForeignersPage } from './foreigners/ForeignersPage';
// 他のサブカテゴリもここにエクスポート
```

#### 2. subcategories/index.tsx

```typescript
// カテゴリー別にインポート
import { ForeignersPage } from './international';

// サブカテゴリーIDとコンポーネントのマッピング
export const subcategoryComponentMap: Record<string, React.ComponentType<any>> = {
  // 国際
  'foreigners': ForeignersPage,

  // 他のサブカテゴリー...
};

// カテゴリー別エクスポート
export * from './international';
```

## 新しいサブカテゴリの追加手順

### ステップ1: categories.json に追加

```json
{
  "id": "category-id",
  "name": "カテゴリ名",
  "subcategories": [
    {
      "id": "new-subcategory",
      "name": "新しいサブカテゴリ",
      "href": "/new-subcategory",
      "component": "NewSubcategoryPage"
    }
  ]
}
```

### ステップ2: categories.ts に追加

```typescript
{
  id: 'category-id',
  subcategories: [
    {
      id: 'new-subcategory',  // categories.jsonのIDと一致させる
      categoryId: 'category-id',
      name: '新しいサブカテゴリ',
      description: '説明文',
      unit: '単位',
      dataType: 'numerical',
      statsDataId: 'e-Stat統計表ID',
      tableName: '統計表名',
      displayOrder: 1,
      colorScheme: 'interpolateBlues',
      categoryCode: 'カテゴリコード',
    }
  ]
}
```

### ステップ3: ページコンポーネント作成

ディレクトリ構造:
```
src/components/subcategories/
└── category-name/
    ├── index.tsx
    └── new-subcategory/
        └── NewSubcategoryPage.tsx
```

`NewSubcategoryPage.tsx`:
```typescript
'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/dashboard/Ranking';

interface NewSubcategoryPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const NewSubcategoryPage: React.FC<NewSubcategoryPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = 'e-Stat統計表ID';
  const cdCat01 = 'カテゴリコード';

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01,
            }}
            areaCode="00000"
            title="統計カードタイトル"
            unit="単位"
            color="#4f46e5"
          />
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01,
        }}
        subcategory={subcategory}
        options={{
          colorScheme: subcategory.colorScheme || 'interpolateBlues',
          divergingMidpoint: 'zero',
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
```

### ステップ4: カテゴリのindex.tsxにエクスポート追加

`src/components/subcategories/category-name/index.tsx`:
```typescript
export { NewSubcategoryPage } from './new-subcategory/NewSubcategoryPage';
```

### ステップ5: subcategories/index.tsxに登録

`src/components/subcategories/index.tsx`:
```typescript
// インポート追加
import { NewSubcategoryPage } from './category-name';

// マッピング追加
export const subcategoryComponentMap: Record<string, React.ComponentType<any>> = {
  'new-subcategory': NewSubcategoryPage,
  // ...
};

// エクスポート追加
export * from './category-name';
```

### ステップ6: 動作確認

1. 開発サーバーを再起動（必要に応じて）
```bash
npm run dev
```

2. ブラウザで確認
```
http://localhost:3000/category-id/new-subcategory
```

## e-Stat データマッピング

### データソース

e-Stat APIから取得したメタデータCSV:
`/Users/minamidaisuke/stats47-blog/_backend/e_stat/meta/csv_export/estat_meta_all.csv`

### 主要パラメータ

| パラメータ | 説明 | 例 |
|---------|------|-----|
| `statsDataId` | 統計表ID | `0000010101` |
| `cdCat01` | カテゴリコード | `A1700` |
| `areaCode` | 地域コード | `00000`（全国）、`01000`（北海道）など |

### カテゴリコードの調べ方

1. `estat_meta_all.csv` を開く
2. `stats_data_id` 列で統計表IDを検索
3. `cat01` 列でカテゴリコードを確認
4. `cat01_name` 列でカテゴリ名を確認

### 主要な統計表ID

| 統計表名 | statsDataId |
|---------|------------|
| 社会・人口統計体系 | 0000010101 |
| 国勢調査 | 0003448738 |
| 人口推計 | 0003448738 |
| 毎月勤労統計調査 | 0000200001 |
| 農林業センサス | 0000030101 |
| 工業統計調査 | 0000020101 |
| 経済センサス | 0000140001 |

## コンポーネント一覧

### 利用可能なコンポーネント

1. **StatisticsMetricCard**
   - 単一の統計値を表示
   - 全国データや特定都道府県のデータ表示に使用

2. **EstatRanking**
   - 都道府県ランキングとコロプレス地図を表示
   - ソート、フィルタリング機能付き

3. **EstatGenderDonutChart**
   - 男女比率をドーナツチャートで表示
   - 2つのカテゴリコード（男性・女性）が必要

4. **EstatStackedBarChart**
   - 積み上げ棒グラフで複数カテゴリを表示
   - 時系列データや構成比の表示に適している

5. **SubcategoryLayout**
   - すべてのサブカテゴリページの共通レイアウト
   - パンくずリスト、ヘッダーを含む

## トラブルシューティング

### 404エラーが発生する

**原因**: categories.json と categories.ts のサブカテゴリIDが一致していない

**解決方法**:
1. `src/config/categories.json` でサブカテゴリIDを確認
2. `src/lib/choropleth/categories.ts` で同じIDを使用しているか確認
3. 両方のファイルでIDを統一

### コンポーネントが見つからないエラー

**原因**: subcategories/index.tsx にコンポーネントが登録されていない

**解決方法**:
1. カテゴリディレクトリの `index.tsx` でコンポーネントをエクスポート
2. `subcategories/index.tsx` でインポート
3. `subcategoryComponentMap` にマッピングを追加

### データが表示されない

**原因**: e-Stat APIパラメータが正しくない

**解決方法**:
1. `statsDataId` が正しいか確認
2. `cdCat01` カテゴリコードが存在するか確認
3. `estat_meta_all.csv` でデータを確認

### Turbopackのキャッシュ問題

**症状**: ファイルを変更しても反映されない

**解決方法**:
```bash
# 開発サーバーを停止
# .nextディレクトリを削除
rm -rf .next
# 開発サーバーを再起動
npm run dev
```

## ベストプラクティス

1. **一貫した命名規則**
   - サブカテゴリID: ケバブケース（例: `foreigners`, `land-area`）
   - コンポーネント名: パスカルケース（例: `ForeignersPage`, `LandAreaPage`）

2. **型安全性の確保**
   - すべてのPropsインターフェースを定義
   - TypeScriptの型チェックを活用

3. **再利用可能なコンポーネント**
   - 共通ロジックは SubcategoryLayout に集約
   - カスタマイズが必要な部分のみ各ページで実装

4. **パフォーマンス**
   - 'use client' ディレクティブを適切に使用
   - 必要な場所でのみクライアントコンポーネントを使用

5. **データ検証**
   - estat_meta_all.csv でデータの存在を事前確認
   - エラーハンドリングを実装

## 参考リンク

- [e-Stat API仕様](https://www.e-stat.go.jp/api/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [D3.js カラースキーム](https://github.com/d3/d3-scale-chromatic)
