---
title: organisms/estat-api内のサブドメイン構造に関する分析
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/estat-api
  - refactoring
  - component-architecture
  - scalability
---

# organisms/estat-api内のサブドメイン構造に関する分析

## 概要

現在、`organisms/estat-api/`配下には24個のコンポーネントが並列に配置されています。このドキュメントでは、サブドメイン（meta-info, stats-data, stats-list, visualizationなど）による階層化が有効かどうかを分析します。

---

## 現状分析

### 現在の構造

```
src/components/organisms/estat-api/
├── EstatMetaInfoFetcher/           # メタ情報取得フォーム
├── EstatMetaInfoPageHeader/        # メタ情報ページヘッダー
├── EstatMetaInfoSidebar/           # メタ情報サイドバー
├── EstatDataFetcher/               # 統計データ取得フォーム
├── EstatDataTable/                 # データテーブル
├── EstatAreasTable/                # 地域テーブル
├── EstatCategoriesTable/           # カテゴリテーブル
├── EstatValuesTable/               # 値テーブル
├── EstatYearsTable/                # 年度テーブル
├── EstatRawData/                   # 生データ表示
├── EstatOverview/                  # 概要表示
├── EstatGenderDonutChart/          # 性別ドーナツチャート
├── EstatLineChart/                 # 折れ線グラフ
├── EstatMultiLineChart/            # 複数線グラフ
├── EstatPopulationPyramid/         # 人口ピラミッド
├── EstatStackedBarChart/           # 積み上げ棒グラフ
├── EstatClassificationTabs/        # 分類タブ
├── EstatUnifiedClassificationTabs/ # 統合分類タブ
├── EstatYearSelector/              # 年度セレクター
├── EstatStatisticsMetricCard/      # 統計メトリックカード
├── StatsFieldNavigation/           # 統計分野ナビゲーション
├── StatsListResults/               # 統計リスト結果
└── StatsTableDetailModal/          # 統計表詳細モーダル
```

**合計**: 24コンポーネント（23コンポーネント + 1ナビゲーション）

### 問題点

#### 1. スケーラビリティの欠如
- 24個のコンポーネントが並列に配置され、見通しが悪い
- 今後のコンポーネント追加で更に見通しが悪化する
- 関連するコンポーネントの把握が困難

#### 2. 機能的なまとまりが不明確
- メタ情報関連、統計データ関連、可視化関連が混在
- どのコンポーネントがどの機能に属するか直感的でない

#### 3. インポートパスの冗長性
```tsx
// 現状
import { EstatMetaInfoFetcher } from "@/components/organisms/estat-api/EstatMetaInfoFetcher";
import { EstatMetaInfoPageHeader } from "@/components/organisms/estat-api/EstatMetaInfoPageHeader";
import { EstatMetaInfoSidebar } from "@/components/organisms/estat-api/EstatMetaInfoSidebar";

// 理想（サブドメイン化後）
import {
  MetaInfoFetcher,
  MetaInfoPageHeader,
  MetaInfoSidebar
} from "@/components/organisms/estat-api/meta-info";
```

---

## 機能別分類

### グループ1: meta-info（メタ情報管理）

**目的**: 統計表のメタ情報（基本情報）を管理

| コンポーネント | 責務 | 使用箇所 |
|--------------|------|---------|
| EstatMetaInfoFetcher | メタ情報取得フォーム | EstatMetainfoPage |
| EstatMetaInfoPageHeader | ページヘッダー | EstatMetainfoPage |
| EstatMetaInfoSidebar | 保存済み統計表リスト | EstatMetainfoPage |

**特徴**:
- ✅ 明確な機能的まとまり
- ✅ 同一ページ（EstatMetainfoPage）で使用
- ✅ 相互に関連が強い

### グループ2: stats-data（統計データ管理）

**目的**: 統計データの取得・表示

| コンポーネント | 責務 | 使用箇所 |
|--------------|------|---------|
| EstatDataFetcher | 統計データ取得フォーム | EstatAPIStatsDataPage |
| EstatDataTable | データテーブル表示 | - |
| EstatAreasTable | 地域別データテーブル | EstatDataDisplay |
| EstatCategoriesTable | カテゴリ別データテーブル | EstatDataDisplay |
| EstatValuesTable | 値一覧テーブル | EstatDataDisplay |
| EstatYearsTable | 年度別データテーブル | EstatDataDisplay |
| EstatRawData | 生データ（JSON）表示 | EstatDataDisplay |
| EstatOverview | データ概要 | EstatDataDisplay |

**特徴**:
- ✅ データ表示に特化
- ✅ EstatDataDisplayで複数使用
- ⚠️ 8コンポーネントと多い

### グループ3: visualization（データ可視化）

**目的**: 統計データのグラフ・チャート表示

| コンポーネント | 責務 | データ型 |
|--------------|------|---------|
| EstatGenderDonutChart | 性別分布ドーナツチャート | 性別統計データ |
| EstatLineChart | 時系列折れ線グラフ | 時系列データ |
| EstatMultiLineChart | 複数系列折れ線グラフ | 複数時系列データ |
| EstatPopulationPyramid | 人口ピラミッド | 年齢別・性別人口データ |
| EstatStackedBarChart | 積み上げ棒グラフ | カテゴリ別データ |

**特徴**:
- ✅ 可視化に特化
- ✅ 再利用性が高い
- ✅ 独立性が高い

### グループ4: ui-components（共通UIコンポーネント）

**目的**: 統計データ表示で共通利用されるUIパーツ

| コンポーネント | 責務 | 再利用性 |
|--------------|------|---------|
| EstatClassificationTabs | 分類タブ切り替え | 中 |
| EstatUnifiedClassificationTabs | 統合分類タブ | 中 |
| EstatYearSelector | 年度選択UI | 高 |
| EstatStatisticsMetricCard | 統計メトリック表示カード | 高 |

**特徴**:
- ✅ 複数箇所で再利用
- ✅ UI表現に特化
- ⚠️ 分類が曖昧

### グループ5: stats-list（統計表リスト管理）

**目的**: 統計表の検索・一覧表示

| コンポーネント | 責務 | 使用箇所 |
|--------------|------|---------|
| StatsFieldNavigation | 分野別ナビゲーション | StatsListPage |
| StatsListResults | 検索結果リスト | StatsListPage |
| StatsTableDetailModal | 統計表詳細モーダル | StatsListPage |

**特徴**:
- ✅ 明確な機能的まとまり
- ✅ 同一ページで使用
- ✅ 相互に関連が強い

---

## サブドメイン構造の提案

### 提案1: 機能別サブドメイン（推奨）⭐

```
src/components/organisms/estat-api/
├── meta-info/                      # メタ情報管理（3コンポーネント）
│   ├── MetaInfoFetcher/
│   ├── MetaInfoPageHeader/
│   ├── MetaInfoSidebar/
│   └── index.ts                    # 再エクスポート
│
├── stats-data/                     # 統計データ管理（8コンポーネント）
│   ├── DataFetcher/
│   ├── DataTable/
│   ├── AreasTable/
│   ├── CategoriesTable/
│   ├── ValuesTable/
│   ├── YearsTable/
│   ├── RawData/
│   ├── Overview/
│   └── index.ts
│
├── visualization/                  # データ可視化（5コンポーネント）
│   ├── GenderDonutChart/
│   ├── LineChart/
│   ├── MultiLineChart/
│   ├── PopulationPyramid/
│   ├── StackedBarChart/
│   └── index.ts
│
├── stats-list/                     # 統計表リスト（3コンポーネント）
│   ├── FieldNavigation/
│   ├── ListResults/
│   ├── TableDetailModal/
│   └── index.ts
│
└── shared/                         # 共通UIコンポーネント（4コンポーネント）
    ├── ClassificationTabs/
    ├── UnifiedClassificationTabs/
    ├── YearSelector/
    ├── StatisticsMetricCard/
    └── index.ts
```

#### メリット

1. **スケーラビリティ** ⭐⭐⭐
   - 各サブドメインが独立して成長可能
   - 新規コンポーネントの配置場所が明確

2. **保守性** ⭐⭐⭐
   - 関連コンポーネントがまとまり、理解しやすい
   - 変更の影響範囲が明確

3. **再利用性** ⭐⭐
   - サブドメイン単位でまとめてインポート可能
   - 依存関係が整理される

4. **開発体験** ⭐⭐⭐
   - IDEの補完が効きやすい
   - 目的のコンポーネントを見つけやすい

#### デメリット

1. **初期コスト** ⚠️
   - ファイル移動とインポートパス更新が必要
   - 一時的な混乱の可能性

2. **命名の変更** ⚠️
   - `Estat`プレフィックスの削除が必要
   - 既存コードへの影響

#### インポート例

```tsx
// Before
import { EstatMetaInfoFetcher } from "@/components/organisms/estat-api/EstatMetaInfoFetcher";
import { EstatMetaInfoPageHeader } from "@/components/organisms/estat-api/EstatMetaInfoPageHeader";
import { EstatMetaInfoSidebar } from "@/components/organisms/estat-api/EstatMetaInfoSidebar";

// After
import {
  MetaInfoFetcher,
  MetaInfoPageHeader,
  MetaInfoSidebar
} from "@/components/organisms/estat-api/meta-info";
```

---

### 提案2: 現状維持 + index.ts追加（軽量）

現在の構造を維持しつつ、グループ化されたindex.tsを追加

```
src/components/organisms/estat-api/
├── EstatMetaInfoFetcher/
├── EstatMetaInfoPageHeader/
├── EstatMetaInfoSidebar/
├── ... （既存の構造）
├── meta-info.ts                    # メタ情報関連の再エクスポート
├── stats-data.ts                   # 統計データ関連の再エクスポート
├── visualization.ts                # 可視化関連の再エクスポート
└── index.ts                        # 全コンポーネントの再エクスポート
```

#### メリット

1. **低コスト** ⭐⭐⭐
   - ファイル移動不要
   - インポートパス変更不要

2. **後方互換性** ⭐⭐⭐
   - 既存コードへの影響なし
   - 段階的な移行が可能

#### デメリット

1. **スケーラビリティ** ❌
   - 根本的な問題解決にならない
   - コンポーネント数増加への対応困難

2. **整理効果** ❌
   - ディレクトリ構造は改善されない
   - 視認性の向上が限定的

---

### 提案3: 2段階リファクタリング（段階的）

フェーズ1とフェーズ2に分けて段階的に実施

#### フェーズ1: 明確なサブドメインのみ分離

```
src/components/organisms/estat-api/
├── meta-info/                      # 明確なまとまり
│   ├── MetaInfoFetcher/
│   ├── MetaInfoPageHeader/
│   └── MetaInfoSidebar/
│
├── stats-list/                     # 明確なまとまり
│   ├── FieldNavigation/
│   ├── ListResults/
│   └── TableDetailModal/
│
└── （その他は現状維持）
```

#### フェーズ2: 残りを整理

```
src/components/organisms/estat-api/
├── meta-info/
├── stats-list/
├── stats-data/                     # フェーズ2で追加
├── visualization/                  # フェーズ2で追加
└── shared/                         # フェーズ2で追加
```

#### メリット

1. **リスク分散** ⭐⭐⭐
   - 段階的な変更でリスク低減
   - 各フェーズで検証可能

2. **学習曲線** ⭐⭐
   - 徐々に新構造に慣れる
   - フィードバックを反映可能

#### デメリット

1. **長期化** ⚠️
   - 完全な整理まで時間がかかる
   - 中途半端な期間が生じる

---

## 比較表

| 項目 | 提案1（機能別） | 提案2（現状維持） | 提案3（段階的） |
|------|----------------|-----------------|----------------|
| **スケーラビリティ** | ⭐⭐⭐ | ❌ | ⭐⭐ |
| **保守性** | ⭐⭐⭐ | ⭐ | ⭐⭐ |
| **実装コスト** | ⚠️ 高 | ⭐⭐⭐ 低 | ⭐⭐ 中 |
| **移行リスク** | ⚠️ 中 | ⭐⭐⭐ 無 | ⭐⭐ 低 |
| **後方互換性** | ❌ | ⭐⭐⭐ | ⭐⭐ |
| **長期的価値** | ⭐⭐⭐ | ❌ | ⭐⭐ |
| **開発体験** | ⭐⭐⭐ | ⭐ | ⭐⭐ |

---

## 推奨アプローチ

### 🎯 推奨: **提案1（機能別サブドメイン）を段階的に実施**

#### 理由

1. **現在のコンポーネント数（24個）は臨界点**
   - これ以上増えると管理困難
   - 早期の構造化が必要

2. **明確な機能的まとまりが存在**
   - meta-info: 3コンポーネント
   - stats-list: 3コンポーネント
   - visualization: 5コンポーネント
   - 各グループの独立性が高い

3. **将来の拡張性を確保**
   - 各サブドメインが独立して成長
   - 新規機能の追加が容易

4. **他のドメインへの適用可能性**
   - rankingドメインなど他でも応用可能
   - プロジェクト全体の一貫性向上

---

## 実装計画（推奨案）

### フェーズ1: meta-infoサブドメイン（リスク低）

**対象**: 3コンポーネント

```bash
# 1. ディレクトリ作成
mkdir -p src/components/organisms/estat-api/meta-info

# 2. コンポーネント移動
mv src/components/organisms/estat-api/EstatMetaInfoFetcher/ \
   src/components/organisms/estat-api/meta-info/MetaInfoFetcher/

mv src/components/organisms/estat-api/EstatMetaInfoPageHeader/ \
   src/components/organisms/estat-api/meta-info/MetaInfoPageHeader/

mv src/components/organisms/estat-api/EstatMetaInfoSidebar/ \
   src/components/organisms/estat-api/meta-info/MetaInfoSidebar/

# 3. index.ts作成
cat > src/components/organisms/estat-api/meta-info/index.ts << 'EOF'
export { default as MetaInfoFetcher } from "./MetaInfoFetcher";
export { default as MetaInfoPageHeader } from "./MetaInfoPageHeader";
export { default as MetaInfoSidebar } from "./MetaInfoSidebar";
EOF
```

**影響範囲**: EstatMetainfoPageのみ

### フェーズ2: stats-listサブドメイン（リスク低）

**対象**: 3コンポーネント

### フェーズ3: visualizationサブドメイン（リスク中）

**対象**: 5コンポーネント

### フェーズ4: stats-dataサブドメイン（リスク中）

**対象**: 8コンポーネント

### フェーズ5: sharedサブドメイン（リスク低）

**対象**: 4コンポーネント

---

## 命名規則

### コンポーネント名の変更

| Before（現状） | After（サブドメイン化後） | 理由 |
|---------------|-------------------------|------|
| EstatMetaInfoFetcher | MetaInfoFetcher | サブドメインで既にestat-api/meta-infoなので重複を削除 |
| EstatDataFetcher | DataFetcher | 同上 |
| EstatGenderDonutChart | GenderDonutChart | 同上 |

### ディレクトリ構造規則

```
src/components/organisms/estat-api/
├── {subdomain}/                    # ケバブケース
│   ├── {ComponentName}/            # パスカルケース
│   │   ├── {ComponentName}.tsx
│   │   └── index.ts
│   └── index.ts                    # サブドメインの再エクスポート
```

---

## 移行チェックリスト

### 事前準備
- [ ] すべての使用箇所を確認
- [ ] テストファイルの有無確認
- [ ] 依存関係マップ作成

### フェーズ1実施
- [ ] meta-infoディレクトリ作成
- [ ] 3コンポーネントの移動
- [ ] コンポーネント名変更（Estatプレフィックス削除）
- [ ] index.ts作成
- [ ] インポートパス更新（EstatMetainfoPage）
- [ ] TypeScript型チェック
- [ ] ビルド確認
- [ ] 動作確認

### フェーズ2以降
- [ ] （各フェーズで同様の手順）

---

## まとめ

### 推奨事項

✅ **サブドメイン化を実施すべき**

**理由**:
1. 現在24コンポーネントあり、管理困難な状態
2. 明確な機能的まとまりが存在
3. 将来的な拡張に備える必要がある
4. 開発体験の大幅な向上が期待できる

### 実装方針

✅ **段階的な実装（提案1を分割実施）**

1. **フェーズ1**: meta-info（3コンポーネント）
2. **フェーズ2**: stats-list（3コンポーネント）
3. **フェーズ3**: visualization（5コンポーネント）
4. **フェーズ4**: stats-data（8コンポーネント）
5. **フェーズ5**: shared（4コンポーネント）

### 期待される効果

1. **短期的効果**
   - コンポーネントの発見性向上
   - インポートパスの簡潔化
   - IDEの補完精度向上

2. **長期的効果**
   - スケーラビリティの確保
   - 保守性の向上
   - チーム開発の効率化
   - 新規参加者のオンボーディング改善

---

**作成者**: Claude Code
**最終更新**: 2025-01-18
**バージョン**: 1.0
**ステータス**: 分析完了・段階的実装推奨
