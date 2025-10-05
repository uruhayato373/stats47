# サブカテゴリページ実装ガイド

## 概要

このドキュメントでは、統計データ表示サイトにおけるサブカテゴリページの実装方法と、守るべきルールについて説明します。

## ファイル構造

```
stats47/
├── src/
│   ├── config/
│   │   └── categories.json              # カテゴリ・サブカテゴリの基本情報（ナビゲーション用）
│   ├── types/
│   │   ├── subcategory.ts               # サブカテゴリページの共通型定義
│   │   └── choropleth.ts                # コロプレス地図関連の型定義
│   ├── lib/
│   │   └── choropleth/
│   │       └── category-helpers.ts      # カテゴリ取得ヘルパー関数
│   ├── components/
│   │   └── subcategories/
│   │       ├── index.tsx                # コンポーネントマッピング
│   │       ├── SubcategoryLayout.tsx    # 共通レイアウト
│   │       ├── landweather/             # 国土・気象カテゴリ
│   │       ├── population/              # 人口・世帯カテゴリ
│   │       ├── laborwage/               # 労働・賃金カテゴリ
│   │       └── ...                      # その他のカテゴリ
│   └── app/
│       └── [category]/
│           └── [subcategory]/
│               └── page.tsx             # 動的ルーティング
└── docs/
    └── SUBCATEGORY_PAGES.md             # このドキュメント
```

## アーキテクチャの原則

### 1. カテゴリ情報の管理

**`src/config/categories.json`** - ナビゲーションメニューの構成のみを定義

```json
{
  "id": "population",
  "name": "人口・世帯",
  "icon": "FaUsers",
  "color": "blue",
  "subcategories": [
    {
      "id": "basic-population",
      "name": "総人口",
      "href": "/basic-population",
      "component": "BasicPopulationPage"
    }
  ]
}
```

**重要**: 統計データの詳細情報（unit, statsDataId, categoryCode等）は各サブカテゴリページコンポーネント内で個別に定義します。

### 2. 型定義の使用

**必須**: すべてのサブカテゴリページコンポーネントは共通の型を使用してください。

**`src/types/subcategory.ts`**:
```typescript
/**
 * 標準的なサブカテゴリページのProps
 */
export interface SubcategoryPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

/**
 * 都道府県別ページのProps
 */
export interface SubcategoryAreaPageProps extends SubcategoryPageProps {
  areaCode: string;
}
```

## サブカテゴリページの実装ルール

### ルール1: 共通型の使用

✅ **正しい例**:
```typescript
import { SubcategoryPageProps } from '@/types/subcategory';

export const BasicPopulationPage: React.FC<SubcategoryPageProps> = ({
  category,
  subcategory,
  currentYear,
}) => {
  // ...
};
```

❌ **間違った例**:
```typescript
// 独自のインターフェースを定義しない
interface BasicPopulationPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}
```

### ルール2: 統計データパラメータの定義

各ページコンポーネント内で、e-Stat APIパラメータを定義してください。

✅ **正しい例**:
```typescript
export const BasicPopulationPage: React.FC<SubcategoryPageProps> = ({
  category,
  subcategory,
}) => {
  // 統計表IDとカテゴリコードを定義
  const statsDataId = "0000010101";
  const cdCat01 = {
    totalPopulation: "A1101",
    dayNightRatio: "A6108",
    malePopulation: "A110101",
    femalePopulation: "A110102",
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カードやランキングコンポーネントを配置 */}
    </SubcategoryLayout>
  );
};
```

### ルール3: SubcategoryLayoutの使用

すべてのサブカテゴリページは `SubcategoryLayout` でラップしてください。

```typescript
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';

return (
  <SubcategoryLayout category={category} subcategory={subcategory}>
    {/* ページコンテンツ */}
  </SubcategoryLayout>
);
```

### ルール4: 参考実装の活用

新しいサブカテゴリページを実装する際は、以下のファイルを参考にしてください：

**参考実装**: `src/components/subcategories/population/basic-population/BasicPopulationPage.tsx`

この実装には以下が含まれています：
- 統計カードの配置
- 男女比ドーナツチャート
- タブ付きランキング表示
- コロプレス地図表示

## 基本的な実装パターン

### パターン1: シンプルなページ（統計カード + ランキング）

```typescript
"use client";

import React from "react";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryPageProps } from "@/types/subcategory";

export const ExamplePage: React.FC<SubcategoryPageProps> = ({
  category,
  subcategory,
}) => {
  // e-Stat APIパラメータの定義
  const statsDataId = "0000010101";
  const cdCat01 = "A1700";

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01,
            }}
            areaCode="00000"
            title="全国総数"
            unit="人"
            color="#4f46e5"
          />
        </div>
      </div>

      {/* ランキングと地図 */}
      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01,
        }}
        subcategory={{
          ...subcategory,
          unit: "人",
          name: "外国人人口",
        }}
        title="都道府県別ランキング"
        options={{
          colorScheme: "interpolateBlues",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
```

### パターン2: タブ付きページ（複数指標の切り替え）

```typescript
"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryPageProps } from "@/types/subcategory";

type RankingTab = "total" | "density" | "didArea";

export const ExampleRankingPage: React.FC<SubcategoryPageProps> = ({
  category,
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("total");

  const rankings = {
    total: {
      statsDataId: "0000010101",
      cdCat01: "A1101",
      unit: "人",
      name: "総人口",
    },
    density: {
      statsDataId: "0000010201",
      cdCat01: "#A01201",
      unit: "人/km²",
      name: "人口密度",
    },
    didArea: {
      statsDataId: "0000010201",
      cdCat01: "#A01402",
      unit: "%",
      name: "人口集中地区面積比率",
    },
  };

  const activeRanking = rankings[activeTab];

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* タブナビゲーション */}
      <div className="px-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("total")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "total"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総人口
            </button>
            <button
              onClick={() => setActiveTab("density")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "density"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              人口密度
            </button>
            <button
              onClick={() => setActiveTab("didArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "didArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              人口集中地区面積比率
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
        title={`${activeRanking.name}ランキング`}
        options={{
          colorScheme: "interpolateBlues",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
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

### ステップ2: ページコンポーネント作成

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
"use client";

import React from "react";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryPageProps } from "@/types/subcategory";

export const NewSubcategoryPage: React.FC<SubcategoryPageProps> = ({
  category,
  subcategory,
}) => {
  // TODO: e-Stat APIパラメータを定義
  const statsDataId = "XXXXXXXXXX";
  const cdCat01 = "XXXXXX";

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

      {/* ランキングと地図 */}
      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01,
        }}
        subcategory={{
          ...subcategory,
          unit: "単位",
          name: "表示名",
        }}
        title="ランキングタイトル"
        options={{
          colorScheme: "interpolateBlues",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
```

### ステップ3: カテゴリのindex.tsxにエクスポート追加

`src/components/subcategories/category-name/index.tsx`:
```typescript
export { NewSubcategoryPage } from "./new-subcategory/NewSubcategoryPage";
```

### ステップ4: subcategories/index.tsxに登録

`src/components/subcategories/index.tsx`:
```typescript
// インポート追加
import { NewSubcategoryPage } from "./category-name";

// マッピング追加
export const subcategoryComponentMap: Record<string, React.ComponentType<any>> = {
  "new-subcategory": NewSubcategoryPage,
  // ...
};

// エクスポート追加
export * from "./category-name";
```

### ステップ5: 動作確認

```bash
npm run dev
```

ブラウザで確認:
```
http://localhost:3000/category-id/new-subcategory
```

## 利用可能なコンポーネント

### 1. StatisticsMetricCard
単一の統計値を表示するカード

```typescript
<StatisticsMetricCard
  params={{
    statsDataId: "0000010101",
    cdCat01: "A1101",
  }}
  areaCode="00000"
  title="全国総人口"
  unit="人"
  color="#4f46e5"
/>
```

### 2. EstatRanking
都道府県ランキングとコロプレス地図

```typescript
<EstatRanking
  params={{
    statsDataId: "0000010101",
    cdCat01: "A1101",
  }}
  subcategory={{
    ...subcategory,
    unit: "人",
    name: "総人口",
  }}
  title="総人口ランキング"  // タイトルを表示する場合
  options={{
    colorScheme: "interpolateBlues",
    divergingMidpoint: "zero",
  }}
  mapWidth={800}
  mapHeight={600}
/>
```

### 3. EstatGenderDonutChart
男女比率をドーナツチャートで表示

```typescript
<EstatGenderDonutChart
  params={{
    statsDataId: "0000010101",
  }}
  maleCategoryCode="A110101"
  femaleCategoryCode="A110102"
  areaCode="00000"
  title="男女人口比率"
  width={300}
  height={300}
/>
```

## e-Stat データの調べ方

### データソース

e-Stat APIから取得したメタデータCSV:
```
/Users/minamidaisuke/stats47-blog/_backend/e_stat/meta/csv_export/estat_meta_all.csv
```

### 調査手順

1. **統計表IDを調べる**
   - `estat_meta_all.csv` を開く
   - `table_name` 列で統計表名を検索
   - `stats_data_id` 列でIDを確認

2. **カテゴリコードを調べる**
   - 同じ行の `cat01` 列でカテゴリコードを確認
   - `cat01_name` 列でカテゴリ名を確認

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

## トラブルシューティング

### 404エラーが発生する

**原因**: categories.json のサブカテゴリIDとコンポーネントマッピングが一致していない

**解決方法**:
1. `src/config/categories.json` でサブカテゴリIDを確認
2. `src/components/subcategories/index.tsx` の `subcategoryComponentMap` で同じIDが登録されているか確認

### コンポーネントが見つからないエラー

**解決方法**:
1. カテゴリディレクトリの `index.tsx` でコンポーネントをエクスポート
2. `subcategories/index.tsx` でインポート
3. `subcategoryComponentMap` にマッピングを追加

### データが表示されない

**解決方法**:
1. `statsDataId` が正しいか確認
2. `cdCat01` カテゴリコードが存在するか確認
3. `estat_meta_all.csv` でデータを確認

## チェックリスト

新しいサブカテゴリページを実装する際は、以下を確認してください：

- [ ] `SubcategoryPageProps` 型を使用している
- [ ] `SubcategoryLayout` でコンテンツをラップしている
- [ ] `statsDataId` と `cdCat01` をコンポーネント内で定義している
- [ ] `categories.json` にサブカテゴリを追加した
- [ ] コンポーネントを `subcategoryComponentMap` に登録した
- [ ] ブラウザで動作確認を行った
- [ ] BasicPopulationPage.tsx を参考にした

## 参考リンク

- [e-Stat API仕様](https://www.e-stat.go.jp/api/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [D3.js カラースキーム](https://github.com/d3/d3-scale-chromatic)
- [参考実装: BasicPopulationPage](../src/components/subcategories/population/basic-population/BasicPopulationPage.tsx)
