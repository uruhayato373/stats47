# サブカテゴリーコンポーネント

このディレクトリには、各サブカテゴリーページの専用コンポーネントが含まれています。

## 新しい構造（v2.0）

### URL 構造

```
/[category]/[subcategory]                    → /[category]/[subcategory]/dashboard にリダイレクト
/[category]/[subcategory]/dashboard          → /[category]/[subcategory]/dashboard/00000 にリダイレクト（全国）
/[category]/[subcategory]/dashboard/[areaCode] → ダッシュボード（全国: 00000 または 都道府県: 13000等）
/[category]/[subcategory]/ranking            → 都道府県ランキング（コロプレス地図、テーブル）
```

### コンポーネント分離

各サブカテゴリは以下の 3 つのコンポーネントに分離されています：

1. **Dashboard Components**: ダッシュボード表示（全国用・都道府県用に分離）

   - **NationalDashboard**: 全国専用ダッシュボード
     - 全国統計概要
     - 全国的な政策動向
     - 都道府県間比較
     - 全国レベルの詳細分析
   - **PrefectureDashboard**: 都道府県専用ダッシュボード
     - 都道府県詳細データ
     - 全国平均との比較
     - 周辺地域との比較
     - 都道府県固有の分析

2. **RankingComponent**: ランキング表示
   - コロプレス地図
   - 都道府県別ランキングテーブル
   - タブ切り替え（複数指標）

## 構造

```
src/components/subcategories/
├── README.md                          # このファイル
├── SubcategoryLayout.tsx              # 共通レイアウトコンポーネント
├── SubcategoryViewNavigation.tsx      # ダッシュボード/ランキング切り替えタブ
├── index.tsx                          # 全体のコンポーネントマッピング
├── landweather/                       # 国土・気象カテゴリー
│   ├── index.tsx
│   ├── land-area/
│   │   ├── LandAreaNationalDashboard.tsx
│   │   ├── LandAreaPrefectureDashboard.tsx
│   │   └── index.tsx
│   └── [その他のサブカテゴリー]/
├── population/                        # 人口・世帯カテゴリー
│   ├── index.ts
│   ├── basic-population/
│   │   ├── BasicPopulationNationalDashboard.tsx
│   │   ├── BasicPopulationPrefectureDashboard.tsx
│   │   └── index.tsx
│   └── [その他のサブカテゴリー]/
├── laborwage/                         # 労働・賃金カテゴリー
│   ├── index.tsx
│   ├── wages-working-conditions/
│   │   ├── WagesWorkingConditionsNationalDashboard.tsx
│   │   ├── WagesWorkingConditionsPrefectureDashboard.tsx
│   │   └── index.tsx
│   └── [その他のサブカテゴリー]/
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

## 使い方

### 1. 新しいサブカテゴリーコンポーネントの作成

新しいサブカテゴリー専用のコンポーネントを作成する場合、適切なカテゴリーディレクトリ内に作成します：

#### 1.1 ディレクトリ構造の作成

```
src/components/subcategories/[category]/[subcategory]/
├── [Name]NationalDashboard.tsx      # 全国用ダッシュボード
├── [Name]PrefectureDashboard.tsx    # 都道府県用ダッシュボード
└── index.tsx                        # エクスポート
```

#### 1.2 全国用ダッシュボードの実装

```tsx
// 例: src/components/subcategories/population/basic-population/BasicPopulationNationalDashboard.tsx
"use client";

import React from "react";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const BasicPopulationNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010101";
  const cdCat01 = {
    totalPopulation: "A1101", // 総人口
    malePopulation: "A1102",  // 男性人口
    femalePopulation: "A1103", // 女性人口
  };

  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* 全国専用の統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalPopulation,
            }}
            areaCode={areaCode}
            title="全国総人口"
            color="#3b82f6"
          />
          {/* 他の統計カード */}
        </div>
      </div>

      {/* 全国専用の分析セクション */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国人口動態分析
          </h2>
          {/* 全国レベルの詳細分析 */}
        </div>
      </div>
    </SubcategoryLayout>
  );
};
```

#### 1.3 都道府県用ダッシュボードの実装

```tsx
// 例: src/components/subcategories/population/basic-population/BasicPopulationPrefectureDashboard.tsx
"use client";

import React from "react";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const BasicPopulationPrefectureDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010101";
  const cdCat01 = {
    totalPopulation: "A1101", // 総人口
    malePopulation: "A1102",  // 男性人口
    femalePopulation: "A1103", // 女性人口
  };

  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* 都道府県専用の統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalPopulation,
            }}
            areaCode={areaCode}
            title="総人口"
            color="#3b82f6"
          />
          {/* 他の統計カード */}
        </div>
      </div>

      {/* 都道府県詳細セクション */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            都道府県詳細
          </h2>
          {/* 都道府県固有の詳細分析 */}
        </div>
      </div>

      {/* 全国との比較セクション */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国との比較
          </h2>
          {/* 全国平均との比較グラフ */}
        </div>
      </div>
    </SubcategoryLayout>
  );
};
```

### 2. エクスポートの設定

#### 2.1 サブカテゴリーレベルのindex.tsx

```tsx
// src/components/subcategories/population/basic-population/index.tsx
export { BasicPopulationPage } from "./BasicPopulationPage";
export { BasicPopulationNationalDashboard } from "./BasicPopulationNationalDashboard";
export { BasicPopulationPrefectureDashboard } from "./BasicPopulationPrefectureDashboard";
```

#### 2.2 カテゴリーレベルのindex.tsx

```tsx
// src/components/subcategories/population/index.ts
export {
  BasicPopulationPage,
  BasicPopulationNationalDashboard,
  BasicPopulationPrefectureDashboard,
} from "./basic-population";
// 他のサブカテゴリーも同様に追加
```

#### 2.3 全体のindex.tsx

```tsx
// src/components/subcategories/index.tsx
export {
  BasicPopulationNationalDashboard,
  BasicPopulationPrefectureDashboard,
} from "./population";
// 他のカテゴリーも同様に追加
```

### 3. categories.jsonの更新

```json
{
  "id": "basic-population",
  "name": "基本人口",
  "href": "/basic-population",
  "dashboardComponent": "BasicPopulationNationalDashboard",
  "nationalDashboardComponent": "BasicPopulationNationalDashboard",
  "prefectureDashboardComponent": "BasicPopulationPrefectureDashboard",
  "displayOrder": 1
}
```

### 4. コンポーネント解決システム

`getDashboardComponentByArea`関数が自動的に適切なコンポーネントを選択：

- `areaCode === "00000"` → NationalDashboard
- `areaCode !== "00000"` → PrefectureDashboard

### 5. チェックリスト

- [ ] NationalDashboard作成
- [ ] PrefectureDashboard作成
- [ ] index.tsx更新（3箇所）
- [ ] categories.json更新
- [ ] 全国表示テスト（/dashboard/00000）
- [ ] 都道府県表示テスト（/dashboard/13000）
- [ ] リンターエラーなし

## レイアウトパターン例

### パターン 1: 2 カラムレイアウト（LandAreaPage）

- 左側: コロプレス地図
- 右側: データテーブル

### パターン 2: サマリーカード + 2 カラム（BasicPopulationDashboard）

- 上部: 統計サマリーカード（合計、平均、最大、最小）
- 下部: 2 カラムレイアウト（地図 + テーブル）

### パターン 3: 1 カラムレイアウト（WagesWorkingConditionsPage）

- 上部: コロプレス地図（全幅）
- 下部: データテーブル（全幅）

## SubcategoryLayout コンポーネント

共通のレイアウト要素を提供：

- ヘッダー
- サイドバー
- ページヘッダー（カテゴリアイコン、パンくずナビ、タイトル）
- メインコンテンツエリア

## デフォルトコンポーネント

マッピングに存在しないサブカテゴリーは、`SubcategoryPageClient` がデフォルトで使用されます。

## Props

すべてのサブカテゴリーコンポーネントは以下の Props を受け取ります：

- `category`: カテゴリー情報
- `subcategory`: サブカテゴリー情報
- `choroplethData`: コロプレス地図用のデータ
- `formattedValues`: フォーマット済みデータ
- `currentYear`: 現在選択されている年度
- `isSample`: サンプルデータかどうか
- `error`: エラーメッセージ（ある場合）
