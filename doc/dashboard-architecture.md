# ダッシュボードアーキテクチャ

## 1. 概要

stats47プロジェクトでは、全67個のダッシュボードコンポーネントに「複数コンポーネント + コンポーネント解決」パターンを適用した新しいアーキテクチャを採用しています。このアーキテクチャにより、全国用と都道府県用のダッシュボードを明確に分離し、それぞれに最適化されたUI/UXを提供できます。

## 2. 設計原則

### 2.1 単一責任の原則

各ダッシュボードコンポーネントは、特定の地域レベル（全国または都道府県）に特化した責任を持ちます。

- **NationalDashboard**: 全国レベルの統計概要と分析
- **PrefectureDashboard**: 都道府県固有の詳細データと比較分析

### 2.2 明確な分離

全国用と都道府県用のコンポーネントは完全に分離され、それぞれ独立して開発・保守できます。

### 2.3 動的解決

`areaCode`パラメータに基づいて、実行時に適切なコンポーネントが動的に選択されます。

### 2.4 後方互換性

既存の単一コンポーネントアーキテクチャとの互換性を維持し、段階的な移行を可能にします。

## 3. アーキテクチャパターン

### 3.1 複数コンポーネント + コンポーネント解決

```
┌─────────────────────────┐
│ /[category]/[subcategory]│
│ /dashboard/[areaCode]   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ getDashboardComponentByArea │
│ - areaCode判定          │
│ - categories.jsonから解決 │
└───────┬─────────────────┘
        │
        ├─ areaCode=00000 ─► NationalDashboard
        │                    - 全国統計概要
        │                    - 政策動向分析
        │                    - 全国トレンド
        │
        └─ areaCode≠00000 ─► PrefectureDashboard
                             - 都道府県詳細
                             - 全国比較
                             - 周辺地域比較
```

### 3.2 コンポーネント解決フロー

1. **URL解析**: `/[category]/[subcategory]/dashboard/[areaCode]`
2. **areaCode判定**: `areaCode === "00000"`で全国/都道府県を判定
3. **設定参照**: `categories.json`から適切なコンポーネント名を取得
4. **コンポーネント解決**: `componentMap`から実際のコンポーネントを取得
5. **レンダリング**: 解決されたコンポーネントをレンダリング

## 4. コンポーネント解決システム

### 4.1 解決関数

```typescript
// src/components/subcategories/index.tsx
export const getDashboardComponentByArea = (
  subcategoryId: string,
  areaCode: string,
  categoryId?: string
): React.ComponentType<SubcategoryDashboardPageProps> => {
  const subcategory = getSubcategoryInfo(subcategoryId, categoryId);

  if (!subcategory) {
    return DefaultDashboardPage;
  }

  const isNational = areaCode === "00000";

  // 新しいアーキテクチャ: 地域別コンポーネント
  if (isNational && subcategory.nationalDashboardComponent) {
    return (
      componentMap[subcategory.nationalDashboardComponent] ||
      DefaultDashboardPage
    );
  }

  if (!isNational && subcategory.prefectureDashboardComponent) {
    return (
      componentMap[subcategory.prefectureDashboardComponent] ||
      DefaultDashboardPage
    );
  }

  // フォールバック: 従来の単一コンポーネント
  if (subcategory.dashboardComponent) {
    return componentMap[subcategory.dashboardComponent] || DefaultDashboardPage;
  }

  return DefaultDashboardPage;
};
```

### 4.2 設定ファイル構造

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

### 4.3 コンポーネントマッピング

```typescript
// src/components/subcategories/index.tsx
const componentMap: Record<string, React.ComponentType<any>> = {
  // 全国用ダッシュボード
  "BasicPopulationNationalDashboard": BasicPopulationNationalDashboard,
  "LandAreaNationalDashboard": LandAreaNationalDashboard,
  // ... 他の全国用コンポーネント

  // 都道府県用ダッシュボード
  "BasicPopulationPrefectureDashboard": BasicPopulationPrefectureDashboard,
  "LandAreaPrefectureDashboard": LandAreaPrefectureDashboard,
  // ... 他の都道府県用コンポーネント
};
```

## 5. 実装ガイドライン

### 5.1 命名規則

- **ファイル名**: `[Name]NationalDashboard.tsx`, `[Name]PrefectureDashboard.tsx`
- **コンポーネント名**: `[Name]NationalDashboard`, `[Name]PrefectureDashboard`
- **エクスポート名**: コンポーネント名と同じ

### 5.2 ディレクトリ構造

```
src/components/subcategories/[category]/[subcategory]/
├── [Name]NationalDashboard.tsx      # 全国用ダッシュボード
├── [Name]PrefectureDashboard.tsx    # 都道府県用ダッシュボード
└── index.tsx                        # エクスポート
```

### 5.3 プロパティインターフェース

```typescript
interface SubcategoryDashboardPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string;
}
```

### 5.4 実装テンプレート

**NationalDashboard**

```tsx
"use client";

import React from "react";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const [Name]NationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
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
          {/* 統計カード */}
        </div>
      </div>

      {/* 全国専用の分析セクション */}
      <div className="px-4 pb-4">
        {/* 全国レベルの詳細分析 */}
      </div>
    </SubcategoryLayout>
  );
};
```

**PrefectureDashboard**

```tsx
"use client";

import React from "react";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const [Name]PrefectureDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
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
          {/* 統計カード */}
        </div>
      </div>

      {/* 都道府県詳細セクション */}
      <div className="px-4 pb-4">
        {/* 都道府県固有の詳細分析 */}
      </div>

      {/* 全国との比較セクション */}
      <div className="px-4 pb-4">
        {/* 全国平均との比較グラフ */}
      </div>
    </SubcategoryLayout>
  );
};
```

## 6. メリット・デメリット

### 6.1 メリット

#### 明確な分離
- 全国用と都道府県用で異なるUI/UXを提供
- 各コンポーネントが単一責任を持つ
- コードの可読性と保守性が向上

#### 拡張性
- 新しい地域レベル（市区町村等）の追加が容易
- 各コンポーネントが独立して開発可能
- 段階的な機能追加が可能

#### 型安全性
- TypeScriptによる厳密な型チェック
- コンパイル時のエラー検出
- 開発体験の向上

#### パフォーマンス
- 必要なコンポーネントのみをロード
- バンドルサイズの最適化
- レンダリング効率の向上

### 6.2 デメリット

#### 複雑性の増加
- コンポーネント数の増加（2倍）
- 設定ファイルの複雑化
- 学習コストの増加

#### 重複コード
- 共通部分の重複実装
- メンテナンスコストの増加
- 一貫性の維持が困難

#### 移行コスト
- 既存コンポーネントの移行作業
- テストケースの追加
- ドキュメントの更新

## 7. 移行履歴

### 7.1 移行対象コンポーネント

全67個のダッシュボードコンポーネントを以下のカテゴリーに分けて移行：

1. **landweather** (1個)
   - `LandAreaDashboard` → `LandAreaNationalDashboard` + `LandAreaPrefectureDashboard`

2. **population** (1個)
   - `BasicPopulationDashboard` → `BasicPopulationNationalDashboard` + `BasicPopulationPrefectureDashboard`

3. **laborwage** (8個)
   - `WagesWorkingConditionsDashboard`
   - `LaborForceStructureDashboard`
   - `IndustrialStructureDashboard`
   - `CommutingEmploymentDashboard`
   - `LaborDisputesDashboard`
   - `JobSeekingPlacementDashboard`
   - `IndustryOccupationDashboard`
   - `EmploymentTypeDashboard`

4. **construction** (7個)
   - `ConstructionManufacturingDashboard`
   - `HousingFacilitiesDashboard`
   - `HousingOwnershipDashboard`
   - `HousingStatisticsDashboard`
   - `HousingStructureDashboard`
   - `LivingEnvironmentDashboard`
   - `WelfareFacilitiesDashboard`

5. **economy** (6個)
   - `EconomicIndicatorsDashboard`
   - `BusinessConditionsDashboard`
   - `TradeBalanceDashboard`
   - `PriceIndexDashboard`
   - `FinancialMarketsDashboard`
   - `EconomicGrowthDashboard`

6. **educationsports** (10個)
   - `SchoolEnrollmentDashboard`
   - `EducationalFacilitiesDashboard`
   - `EducationalExpenditureDashboard`
   - `SportsFacilitiesDashboard`
   - `SportsParticipationDashboard`
   - `CulturalFacilitiesDashboard`
   - `LibraryServicesDashboard`
   - `MuseumServicesDashboard`
   - `EducationalAchievementDashboard`
   - `TeacherStaffDashboard`

7. **energy** (4個)
   - `EnergyProductionDashboard`
   - `EnergyConsumptionDashboard`
   - `RenewableEnergyDashboard`
   - `EnergyEfficiencyDashboard`

8. **safetyenvironment** (5個)
   - `EnvironmentalPollutionDashboard`
   - `AirQualityDashboard`
   - `WaterQualityDashboard`
   - `NoisePollutionDashboard`
   - `EnvironmentalProtectionDashboard`

9. **socialsecurity** (4個)
   - `HealthInsuranceDashboard`
   - `MedicalFacilitiesDashboard`
   - `PublicHealthDashboard`
   - `SocialWelfareDashboard`

10. **administrativefinancial** (6個)
    - `AdministrativeExpensesDashboard`
    - `FinancialManagementDashboard`
    - `PublicDebtDashboard`
    - `TaxRevenueDashboard`
    - `BudgetAllocationDashboard`
    - `GovernmentEfficiencyDashboard`

11. **infrastructure** (1個)
    - `RoadsDashboard`

12. **international** (1個)
    - `ForeignPopulationDashboard`

13. **tourism** (1個)
    - `TourismAccommodationDashboard`

14. **agriculture** (1個)
    - `AgriculturalHouseholdDashboard`

15. **miningindustry** (1個)
    - `ManufacturingDashboard`

16. **commercial** (2個)
    - `CommerceServiceIndustryDashboard`
    - `CommercialFacilitiesDashboard`

### 7.2 移行手順

各コンポーネントに対して以下の手順で移行：

1. **NationalDashboard作成**
   - 既存の`isNational`条件分岐の全国用部分を抽出
   - 全国専用の分析セクションを追加
   - 適切な命名規則でファイル作成

2. **PrefectureDashboard作成**
   - 既存の`isNational`条件分岐の都道府県用部分を抽出
   - 都道府県固有の分析セクションを追加
   - 全国比較機能を強化

3. **エクスポート更新**
   - サブカテゴリーレベルの`index.tsx`
   - カテゴリーレベルの`index.tsx`
   - 全体の`index.tsx`

4. **設定ファイル更新**
   - `categories.json`に`nationalDashboardComponent`と`prefectureDashboardComponent`を追加

5. **旧コンポーネント削除**
   - 元の`*Dashboard.tsx`ファイルを削除

6. **テスト実行**
   - 全国表示テスト（`/dashboard/00000`）
   - 都道府県表示テスト（`/dashboard/13000`）
   - リンターエラーチェック

### 7.3 移行完了

- **移行日**: 2025年1月
- **移行コンポーネント数**: 67個
- **新規作成ファイル数**: 134個（67 × 2）
- **削除ファイル数**: 67個
- **更新ファイル数**: 201個（各カテゴリーのindex.tsx + categories.json）

## 8. よくある質問

### Q1: なぜ単一コンポーネントから複数コンポーネントに移行したのですか？

**A**: 以下の理由から移行しました：

1. **明確な分離**: 全国用と都道府県用で異なるUI/UXを提供するため
2. **保守性向上**: 各コンポーネントが単一責任を持つため
3. **拡張性**: 新しい地域レベルの追加が容易なため
4. **型安全性**: TypeScriptによる厳密な型チェックのため

### Q2: 既存の単一コンポーネントはどうなりますか？

**A**: 後方互換性を維持するため、`getDashboardComponentByArea`関数でフォールバック機能を提供しています。移行が完了していないコンポーネントは従来通り動作します。

### Q3: 新しいサブカテゴリーを追加する際の手順は？

**A**: 以下の手順で追加してください：

1. `[Name]NationalDashboard.tsx`と`[Name]PrefectureDashboard.tsx`を作成
2. 各レベルの`index.tsx`にエクスポートを追加
3. `categories.json`に設定を追加
4. テストを実行

詳細は`development-guide.md`の「新しいダッシュボードコンポーネントの作成」セクションを参照してください。

### Q4: パフォーマンスへの影響はありますか？

**A**: 以下の理由でパフォーマンスが向上します：

1. **必要なコンポーネントのみロード**: 全国用と都道府県用で不要なコードをロードしない
2. **バンドルサイズ最適化**: 各コンポーネントが独立してバンドルされる
3. **レンダリング効率向上**: 条件分岐が不要になり、レンダリングが高速化

### Q5: エラーが発生した場合の対処法は？

**A**: 以下の手順で対処してください：

1. **コンポーネント解決エラー**: `categories.json`の設定を確認
2. **エクスポートエラー**: 各レベルの`index.tsx`のエクスポートを確認
3. **型エラー**: `SubcategoryDashboardPageProps`の型定義を確認
4. **レンダリングエラー**: ブラウザの開発者ツールでエラーを確認

## 9. トラブルシューティング

### 9.1 コンポーネントが解決されない

**症状**: ダッシュボードページでコンポーネントが表示されない

**原因**: 
- `categories.json`の設定が正しくない
- コンポーネントマッピングに登録されていない
- エクスポートが正しくない

**対処法**:
1. `categories.json`の`nationalDashboardComponent`と`prefectureDashboardComponent`を確認
2. `src/components/subcategories/index.tsx`の`componentMap`を確認
3. 各レベルの`index.tsx`のエクスポートを確認

### 9.2 型エラーが発生する

**症状**: TypeScriptで型エラーが発生する

**原因**:
- `SubcategoryDashboardPageProps`の型定義が正しくない
- プロパティの型が一致しない

**対処法**:
1. `src/types/subcategory.ts`の型定義を確認
2. コンポーネントのプロパティ型を確認
3. インポート文を確認

### 9.3 レンダリングエラーが発生する

**症状**: ブラウザでエラーが表示される

**原因**:
- コンポーネントの実装に問題がある
- 依存関係が正しくない
- データの取得に失敗している

**対処法**:
1. ブラウザの開発者ツールでエラーを確認
2. コンポーネントの実装を確認
3. データの取得処理を確認

### 9.4 パフォーマンスが低下する

**症状**: ページの読み込みが遅い

**原因**:
- 不要なコンポーネントがロードされている
- データの取得が非効率
- レンダリングが重い

**対処法**:
1. ネットワークタブでリクエストを確認
2. パフォーマンスタブでボトルネックを特定
3. コンポーネントの最適化を実施

## 10. 今後の拡張予定

### 10.1 市区町村レベル対応

現在の全国・都道府県レベルに加えて、市区町村レベルのダッシュボードを追加予定です。

### 10.2 地域別カスタマイズ

各都道府県の特性に応じたカスタマイズ機能を追加予定です。

### 10.3 動的コンポーネント生成

設定ファイルから動的にコンポーネントを生成する機能を検討中です。

### 10.4 パフォーマンス最適化

- コンポーネントの遅延読み込み
- データのキャッシュ最適化
- レンダリングの最適化

## 更新履歴

- **2025-01-XX**: 初版作成
- **2025-01-XX**: 全67個のコンポーネント移行完了
- **2025-01-XX**: ドキュメント更新完了
