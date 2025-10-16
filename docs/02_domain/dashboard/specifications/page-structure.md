---
title: ページ構造とルーティング
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/dashboard
  - specifications
---

# ページ構造とルーティング

## 概要

ダッシュボードドメインのページ構造は、3階層（全国・都道府県・市区町村）の統計データを効率的に表示するため、Next.js App Routerの動的ルーティング機能を活用して設計されています。

## ルート構造

### 基本ルートパターン

```
/[category]/[subcategory]/dashboard/[areaCode]
```

### パラメータ定義

| パラメータ | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| `category` | string | 統計カテゴリID | `population`, `economy`, `education` |
| `subcategory` | string | サブカテゴリID | `basic-population`, `households` |
| `areaCode` | string | 地域コード | `00000`, `13000`, `13101` |

### 地域コード体系

#### 全国レベル
- **パターン**: `00000`
- **説明**: 日本全国の統計データ
- **例**: `/population/basic-population/dashboard/00000`

#### 都道府県レベル
- **パターン**: `XX000` (XX: 01-47)
- **説明**: 特定の都道府県の統計データ
- **例**: 
  - `/population/basic-population/dashboard/13000` (東京都)
  - `/population/basic-population/dashboard/27000` (大阪府)

#### 市区町村レベル
- **パターン**: `XXXXX` (5桁の詳細コード)
- **説明**: 特定の市区町村の統計データ
- **例**:
  - `/population/basic-population/dashboard/13101` (東京都千代田区)
  - `/population/basic-population/dashboard/27100` (大阪府大阪市)

## ページコンポーネント構造

### メインページコンポーネント

```typescript
// src/app/[category]/[subcategory]/dashboard/[areaCode]/page.tsx
export default async function DashboardPage({ params }: PageProps) {
  const { category, subcategory, areaCode } = await params;
  
  // 1. カテゴリ・サブカテゴリの検証
  const subcategoryData = getSubcategoryById(subcategory);
  if (!subcategoryData || subcategoryData.category.id !== category) {
    notFound();
  }
  
  // 2. 地域レベル判定
  const areaLevel = determineAreaLevel(areaCode);
  
  // 3. 適切なダッシュボードコンポーネントを選択
  const DashboardComponent = getDashboardComponentByArea(
    subcategory,
    areaCode,
    category,
    areaLevel
  );
  
  // 4. ダッシュボードコンポーネントをレンダリング
  return (
    <DashboardComponent
      category={subcategoryData.category}
      subcategory={subcategoryData.subcategory}
      areaCode={areaCode}
      areaLevel={areaLevel}
    />
  );
}
```

### 地域レベル判定ロジック

```typescript
export function determineAreaLevel(areaCode: string): AreaLevel {
  // 全国レベル
  if (areaCode === '00000') {
    return 'national';
  }
  
  // 都道府県レベル（XX000形式）
  if (areaCode.match(/^[0-4][0-9]000$/)) {
    return 'prefecture';
  }
  
  // 市区町村レベル（XXXXX形式）
  if (areaCode.match(/^[0-4][0-9][0-9][0-9][0-9]$/)) {
    return 'municipality';
  }
  
  throw new Error(`Invalid area code: ${areaCode}`);
}
```

## ダッシュボードコンポーネント選択

### 動的コンポーネント解決

```typescript
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

### コンポーネント命名規則

#### 全国ダッシュボード
- **命名**: `{Subcategory}NationalDashboard`
- **例**: `BasicPopulationNationalDashboard`
- **ファイル**: `src/components/subcategories/population/basic-population/BasicPopulationNationalDashboard.tsx`

#### 都道府県ダッシュボード
- **命名**: `{Subcategory}PrefectureDashboard`
- **例**: `BasicPopulationPrefectureDashboard`
- **ファイル**: `src/components/subcategories/population/basic-population/BasicPopulationPrefectureDashboard.tsx`

#### 市区町村ダッシュボード
- **命名**: `{Subcategory}MunicipalityDashboard`
- **例**: `BasicPopulationMunicipalityDashboard`
- **ファイル**: `src/components/subcategories/population/basic-population/BasicPopulationMunicipalityDashboard.tsx`

## ページレイアウトパターン

### 全国ダッシュボードレイアウト

```typescript
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
      {/* 1. 統計カードセクション */}
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

      {/* 2. 都道府県ランキングセクション */}
      <div className="px-4 pb-4">
        <PrefectureRankingSection areaCode={areaCode} />
      </div>

      {/* 3. 地域分布地図セクション */}
      <div className="px-4 pb-4">
        <ChoroplethMapSection areaCode={areaCode} />
      </div>

      {/* 4. 推移グラフセクション */}
      <div className="px-4 pb-4">
        <TimeSeriesChartSection areaCode={areaCode} />
      </div>
    </SubcategoryLayout>
  );
};
```

### 都道府県ダッシュボードレイアウト

```typescript
export const BasicPopulationPrefectureDashboard: React.FC<DashboardProps> = ({
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
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatisticsMetricCard
            params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
            areaCode={areaCode}
            title="総人口"
            color="#4f46e5"
          />
          {/* 他の統計カード */}
        </div>
      </div>

      {/* 2. 全国比較セクション */}
      <div className="px-4 pb-4">
        <NationalComparisonSection areaCode={areaCode} />
      </div>

      {/* 3. 市区町村ランキングセクション */}
      <div className="px-4 pb-4">
        <MunicipalityRankingSection areaCode={areaCode} />
      </div>

      {/* 4. 推移グラフセクション */}
      <div className="px-4 pb-4">
        <TimeSeriesChartSection areaCode={areaCode} />
      </div>
    </SubcategoryLayout>
  );
};
```

### 市区町村ダッシュボードレイアウト

```typescript
export const BasicPopulationMunicipalityDashboard: React.FC<DashboardProps> = ({
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
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatisticsMetricCard
            params={{ statsDataId: "0000010101", cdCat01: "A1101" }}
            areaCode={areaCode}
            title="総人口"
            color="#4f46e5"
          />
          {/* 他の統計カード */}
        </div>
      </div>

      {/* 2. 都道府県内順位セクション */}
      <div className="px-4 pb-4">
        <PrefectureRankingSection 
          areaCode={areaCode} 
          prefectureCode={prefectureCode} 
        />
      </div>

      {/* 3. 周辺比較セクション */}
      <div className="px-4 pb-4">
        <NeighboringComparisonSection areaCode={areaCode} />
      </div>

      {/* 4. 推移グラフセクション */}
      <div className="px-4 pb-4">
        <TimeSeriesChartSection areaCode={areaCode} />
      </div>
    </SubcategoryLayout>
  );
};
```

## 地域コード管理

### 地域コード検証

```typescript
export function validateAreaCode(areaCode: string): boolean {
  // 全国
  if (areaCode === '00000') return true;
  
  // 都道府県（XX000形式）
  if (areaCode.match(/^[0-4][0-9]000$/)) return true;
  
  // 市区町村（XXXXX形式）
  if (areaCode.match(/^[0-4][0-9][0-9][0-9][0-9]$/)) return true;
  
  return false;
}
```

### 都道府県コード抽出

```typescript
export function getPrefectureCodeFromMunicipality(municipalityCode: string): string {
  if (municipalityCode.length !== 5) {
    throw new Error(`Invalid municipality code: ${municipalityCode}`);
  }
  
  return municipalityCode.substring(0, 2) + '000';
}
```

### 地域名取得

```typescript
export function getAreaName(areaCode: string): string {
  if (areaCode === '00000') return '全国';
  
  // 都道府県名の取得
  if (areaCode.match(/^[0-4][0-9]000$/)) {
    return getPrefectureName(areaCode);
  }
  
  // 市区町村名の取得
  if (areaCode.match(/^[0-4][0-9][0-9][0-9][0-9]$/)) {
    return getMunicipalityName(areaCode);
  }
  
  return '不明な地域';
}
```

## エラーハンドリング

### 404エラー処理

```typescript
// 無効なカテゴリ・サブカテゴリの場合
if (!subcategoryData || subcategoryData.category.id !== category) {
  notFound();
}

// 無効な地域コードの場合
if (!validateAreaCode(areaCode)) {
  notFound();
}
```

### フォールバック処理

```typescript
// コンポーネントが見つからない場合のフォールバック
const DashboardComponent = getDashboardComponentByArea(
  subcategory,
  areaCode,
  category,
  areaLevel
).catch(() => {
  // デフォルトダッシュボードにフォールバック
  return DefaultDashboard;
});
```

## パフォーマンス最適化

### 動的インポート

```typescript
// コンポーネントの遅延読み込み
const NationalDashboard = lazy(() => 
  import('./NationalDashboard').then(module => ({ 
    default: module.NationalDashboard 
  }))
);

const PrefectureDashboard = lazy(() => 
  import('./PrefectureDashboard').then(module => ({ 
    default: module.PrefectureDashboard 
  }))
);

const MunicipalityDashboard = lazy(() => 
  import('./MunicipalityDashboard').then(module => ({ 
    default: module.MunicipalityDashboard 
  }))
);
```

### プリフェッチ

```typescript
// 関連ページのプリフェッチ
export function prefetchRelatedPages(areaCode: string) {
  const areaLevel = determineAreaLevel(areaCode);
  
  if (areaLevel === 'national') {
    // 都道府県ページのプリフェッチ
    prefetchPrefecturePages();
  } else if (areaLevel === 'prefecture') {
    // 市区町村ページのプリフェッチ
    prefetchMunicipalityPages(areaCode);
  }
}
```

## メタデータ生成

### 動的メタデータ

```typescript
export async function generateMetadata({ params }: PageProps) {
  const { category, subcategory, areaCode } = await params;
  
  const areaName = getAreaName(areaCode);
  const subcategoryData = getSubcategoryById(subcategory);
  
  return {
    title: `${areaName}の${subcategoryData?.subcategory.name} - 統計ダッシュボード`,
    description: `${areaName}の${subcategoryData?.subcategory.name}に関する統計データを可視化したダッシュボードです。`,
    keywords: [
      areaName,
      subcategoryData?.subcategory.name,
      '統計',
      'ダッシュボード',
      'データ可視化'
    ]
  };
}
```

### 構造化データ

```typescript
export function generateStructuredData(
  category: string,
  subcategory: string,
  areaCode: string
) {
  const areaName = getAreaName(areaCode);
  const areaLevel = determineAreaLevel(areaCode);
  
  return {
    "@context": "https://schema.org",
    "@type": "DataVisualization",
    "name": `${areaName}の統計ダッシュボード`,
    "description": `${areaName}の統計データを可視化したダッシュボード`,
    "spatialCoverage": {
      "@type": "Place",
      "name": areaName,
      "containedInPlace": areaLevel === 'municipality' ? 
        getPrefectureName(getPrefectureCodeFromMunicipality(areaCode)) : 
        undefined
    },
    "temporalCoverage": "2020/2024",
    "creator": {
      "@type": "Organization",
      "name": "Stats47"
    }
  };
}
```

## ナビゲーション

### ブレッドクラム

```typescript
export function generateBreadcrumbs(
  category: string,
  subcategory: string,
  areaCode: string
) {
  const areaLevel = determineAreaLevel(areaCode);
  const breadcrumbs = [
    { name: 'ホーム', href: '/' },
    { name: '統計ダッシュボード', href: '/dashboard' },
    { name: getCategoryName(category), href: `/${category}` },
    { name: getSubcategoryName(subcategory), href: `/${category}/${subcategory}` }
  ];
  
  if (areaLevel === 'prefecture') {
    breadcrumbs.push({
      name: getAreaName(areaCode),
      href: `/${category}/${subcategory}/dashboard/${areaCode}`
    });
  } else if (areaLevel === 'municipality') {
    const prefectureCode = getPrefectureCodeFromMunicipality(areaCode);
    breadcrumbs.push(
      {
        name: getAreaName(prefectureCode),
        href: `/${category}/${subcategory}/dashboard/${prefectureCode}`
      },
      {
        name: getAreaName(areaCode),
        href: `/${category}/${subcategory}/dashboard/${areaCode}`
      }
    );
  }
  
  return breadcrumbs;
}
```

### 関連ページリンク

```typescript
export function generateRelatedLinks(
  category: string,
  subcategory: string,
  areaCode: string
) {
  const areaLevel = determineAreaLevel(areaCode);
  const links = [];
  
  if (areaLevel === 'national') {
    // 主要都道府県へのリンク
    links.push(
      { name: '東京都', href: `/${category}/${subcategory}/dashboard/13000` },
      { name: '大阪府', href: `/${category}/${subcategory}/dashboard/27000` },
      { name: '愛知県', href: `/${category}/${subcategory}/dashboard/23000` }
    );
  } else if (areaLevel === 'prefecture') {
    // 市区町村へのリンク
    const municipalities = getMunicipalitiesInPrefecture(areaCode);
    links.push(...municipalities.slice(0, 5).map(muni => ({
      name: muni.name,
      href: `/${category}/${subcategory}/dashboard/${muni.code}`
    })));
  }
  
  return links;
}
```

## まとめ

ダッシュボードドメインのページ構造は、3階層の地域データを効率的に表示するため、以下の特徴を持っています：

1. **動的ルーティング**: Next.js App Routerを活用した柔軟なURL構造
2. **階層別レイアウト**: 全国・都道府県・市区町村で最適化された表示
3. **コンポーネント解決**: 地域レベルに応じた動的コンポーネント選択
4. **エラーハンドリング**: 無効なパラメータに対する適切な処理
5. **パフォーマンス**: 遅延読み込みとプリフェッチによる最適化
6. **SEO対応**: 動的メタデータと構造化データの生成

この構造により、ユーザーは直感的に地域を選択し、その地域に最適化された統計ダッシュボードを閲覧することができます。
