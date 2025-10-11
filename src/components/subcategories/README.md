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

各サブカテゴリは以下の 2 つのコンポーネントに分離されています：

1. **DashboardComponent**: ダッシュボード表示（全国・都道府県共通）

   - 統計カード（StatisticsMetricCard）
   - グラフ（EstatGenderDonutChart、EstatLineChart 等）
   - 全国の場合は追加のグラフ（人口ピラミッド等）

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
│   ├── LandAreaDashboard.tsx
│   ├── LandAreaRanking.tsx
│   └── [その他のサブカテゴリー].tsx
├── population/                        # 人口・世帯カテゴリー
│   ├── index.tsx
│   ├── BasicPopulationDashboard.tsx
│   ├── BasicPopulationRanking.tsx
│   └── [その他のサブカテゴリー].tsx
├── laborwage/                         # 労働・賃金カテゴリー
│   ├── index.tsx
│   ├── WagesWorkingConditionsDashboard.tsx
│   ├── WagesWorkingConditionsRanking.tsx
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

## 使い方

### 1. 新しいサブカテゴリーコンポーネントの作成

新しいサブカテゴリー専用のコンポーネントを作成する場合、適切なカテゴリーディレクトリ内に作成します：

```tsx
// 例: src/components/subcategories/population/PopulationCompositionPage.tsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SubcategoryLayout } from "../SubcategoryLayout";
import {
  CategoryData,
  SubcategoryData,
  ChoroplethDisplayData,
} from "@/types/choropleth";

interface PopulationCompositionPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  choroplethData: ChoroplethDisplayData | null;
  formattedValues: any[] | null;
  currentYear: string;
  isSample: boolean;
  error: string | null;
}

export const PopulationCompositionPage: React.FC<
  PopulationCompositionPageProps
> = ({
  category,
  subcategory,
  choroplethData,
  formattedValues,
  currentYear,
  isSample,
  error,
}) => {
  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* ここに独自のレイアウトを実装 */}
    </SubcategoryLayout>
  );
};
```

### 2. カテゴリーの index.tsx にエクスポートを追加

該当カテゴリーの `index.tsx` にエクスポートを追加：

```tsx
// src/components/subcategories/population/index.tsx
export { BasicPopulationDashboard } from "./basic-population";
export { PopulationCompositionPage } from "./PopulationCompositionPage"; // 追加
```

### 3. コンポーネントマッピングへの追加

`src/components/subcategories/index.tsx` にマッピングを追加：

```tsx
import { PopulationCompositionPage } from "./population";

export const subcategoryComponentMap: Record<
  string,
  React.ComponentType<any>
> = {
  // ... 既存のマッピング
  "population-composition": PopulationCompositionPage, // 追加
};
```

### 3. 自動的にレンダリング

`[category]/[subcategory]/page.tsx` が自動的に適切なコンポーネントを選択してレンダリングします。

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
