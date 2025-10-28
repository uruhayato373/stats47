---
title: 動的ダッシュボード実装 - 現状と作業計画
created: 2025-10-27
updated: 2025-10-27
tags:
  - ダッシュボード
  - 実装計画
  - 現状把握
  - ロードマップ
---

# 動的ダッシュボード実装 - 現状と作業計画

## 1. プロジェクト概要

### 1.1 目的

サブカテゴリダッシュボードを、ハードコードされた個別コンポーネントから、データ駆動型の動的ダッシュボードシステムに移行することで、以下を実現します：

- **コード削減**: 200個のコンポーネント → 10個の汎用コンポーネント（90%削減）
- **開発効率**: 新規追加時間を90%削減
- **保守性向上**: 一元管理による修正箇所の最小化
- **スケーラビリティ**: データ駆動による無制限の拡張性

### 1.2 アーキテクチャ方針

**データ駆動アプローチ + ウィジェットシステム**

- D1データベース: ダッシュボード設定、ウィジェット定義を保存
- R2ストレージ: レイアウトテンプレート、ウィジェットテンプレートを保存
- shadcn/ui + recharts: チャート表示
- Next.js App Router: ルーティングとページ生成

## 2. 現状把握（2025-10-27時点）

### 2.1 ✅ 完了している作業

#### データベース環境の構築

**ローカルD1データベース**
- ✅ `subcategory_ranking_items` テーブル作成済み
- ✅ `subcategory_configs` テーブル作成済み
- ✅ `ranking_items_new` テーブル作成済み
- ✅ `data_source_metadata` テーブル作成済み
- ✅ `data_sources` テーブル作成済み

**シードデータ投入**
- ✅ `database/seeds/subcategory_configs_seed.sql` 作成・実行
- ✅ `database/seeds/ranking_items_seed.sql` 作成・実行
- ✅ サブカテゴリとランキング項目のマッピング作成（8件）
- ✅ 10件のランキング項目データ投入

**Mockデータ**
- ✅ `data/mock/database/subcategory_ranking_items.json` 作成
- ✅ `data/mock/database/subcategory_configs.json` 作成
- ✅ `data/mock/database/README.md` 更新

#### 現在のマッピング状況

| サブカテゴリID | ランキング項目 | デフォルト |
|----------------|----------------|-----------|
| land-area | areaRatio (面積割合) | ✓ |
| land-use | agriculturalLand (農用地) | ✓ |
| land-use | agriculturalLandRatio (農用地割合) | - |
| weather-climate | avgTemperature (年平均気温) | ✓ |
| households | averageHouseholdSize (平均世帯人員) | ✓ |
| birth-death | birthRate (出生率) | ✓ |
| agricultural-household | agriculturalHouseholds (農業世帯数) | ✓ |
| household-economy | averageIncome (平均収入) | ✓ |

#### 既存の実装

**ランキング機能**
- ✅ `src/features/ranking/` - ランキング機能の実装
- ✅ `src/features/ranking/repositories/ranking-repository.ts` - リポジトリ実装
- ✅ `src/features/ranking/ranking-queries.ts` - SQLクエリ定義
- ✅ サブカテゴリ別ランキング項目取得機能実装済み

**可視化機能**
- ✅ `src/features/visualization/map/` - コロプレス地図実装
- ✅ D3.js + TopoJSONによる地図描画
- ✅ カラースケールユーティリティ
- ✅ 凡例コンポーネント

### 2.2 ❌ 未実装の部分

#### ダッシュボードシステム（本プロジェクトの対象）

**データベーススキーマ**
- ❌ `dashboard_configs` テーブル未作成
- ❌ `dashboard_widgets` テーブル未作成
- ❌ `widget_templates` テーブル未作成

**R2ストレージ**
- ❌ レイアウトテンプレート未配置
- ❌ ウィジェットテンプレート未配置

**コンポーネント実装**
- ❌ `DynamicDashboard` コンポーネント未実装
- ❌ `WidgetRenderer` コンポーネント未実装
- ❌ ウィジェットコンポーネント未実装
  - MetricCardWidget
  - LineChartWidget
  - BarChartWidget
  - TableWidget

**shadcn/ui chart**
- ❌ chartコンポーネント未インストール
- ❌ recharts未インストール

### 2.3 現在のディレクトリ構造（問題点）

```
src/components/pages/subcategories/
├── agriculture/
│   └── agricultural-household/
│       ├── AgriculturalHouseholdNationalDashboard.tsx  ❌ 冗長
│       └── AgriculturalHouseholdPrefectureDashboard.tsx ❌ 冗長
├── tourism/
│   └── tourism-accommodation/
│       ├── TourismAccommodationNationalDashboard.tsx   ❌ 冗長
│       └── TourismAccommodationPrefectureDashboard.tsx ❌ 冗長
└── [100以上のサブカテゴリディレクトリ...]           ❌ 大量のファイル
```

**問題点**:
- 各サブカテゴリに2つのファイルが必要（National/Prefecture）
- コードの大部分が重複
- 新規追加時に毎回2ファイル作成が必要
- 保守が困難

## 3. 今後の作業方針

### 3.1 段階的実装アプローチ

#### Phase 0: プロトタイプ実装（優先度: 🔴 最高）

**目的**: shadcn/ui chartを使用したモックデータ版の動作検証

**期間**: 1-2週間

**成果物**:
- shadcn/ui chartコンポーネントの導入
- モックデータによる動的ダッシュボードの実装
- サンプルページでの動作確認
- 設計の検証とフィードバック

**メリット**:
- 実装前に設計を検証できる
- データベース接続なしで開発可能
- チャートライブラリの評価

#### Phase 1: データベース連携（優先度: 🟠 高）

**目的**: D1データベースとの統合

**期間**: 2-3週間

**成果物**:
- `dashboard_configs` テーブル作成
- `dashboard_widgets` テーブル作成
- `widget_templates` テーブル作成
- DashboardResolverの実装
- API Routesの実装

#### Phase 2: データソース統合（優先度: 🟡 中）

**目的**: 実データとの連携

**期間**: 2-3週間

**成果物**:
- Ranking API連携
- e-Stat API連携
- キャッシュ戦略の実装
- エラーハンドリング

#### Phase 3: パイロット移行（優先度: 🟡 中）

**目的**: 既存ダッシュボードからの移行検証

**期間**: 1週間

**成果物**:
- 3-5個のサブカテゴリを動的ダッシュボードに移行
- A/Bテスト
- パフォーマンス測定
- ユーザーフィードバック収集

#### Phase 4: 全体移行（優先度: 🟢 通常）

**目的**: すべてのサブカテゴリの移行

**期間**: 3-4週間

**成果物**:
- バッチ移行スクリプト
- 全サブカテゴリの移行
- 旧コンポーネント削除
- ビルドサイズ削減確認

## 4. 具体的な実装手順（Phase 0: プロトタイプ）

### Step 1: 環境準備

#### 1.1 shadcn/ui chartのインストール

```bash
# chartコンポーネントを追加（rechartsも自動インストール）
npx shadcn@latest add chart

# 確認
# - src/components/atoms/ui/chart.tsx が作成される
# - package.json に recharts が追加される
```

#### 1.2 型定義ファイルの作成

```bash
mkdir -p src/types/dashboard
touch src/types/dashboard/config.ts
touch src/types/dashboard/widget.ts
touch src/types/dashboard/layout.ts
touch src/types/dashboard/index.ts
```

### Step 2: 型定義の実装

**ファイル**:
- `src/types/dashboard/config.ts` - ダッシュボード設定の型
- `src/types/dashboard/widget.ts` - ウィジェットの型
- `src/types/dashboard/layout.ts` - レイアウトの型

**内容**: `dynamic-dashboard-implementation-plan.md` の Step 2 を参照

### Step 3: モックデータの実装

**ファイル**:
- `src/lib/dashboard/mock-data.ts` - モックデータとヘルパー関数

**内容**: `dynamic-dashboard-implementation-plan.md` の Step 3 を参照

**データ構造**:
- サンプルダッシュボード設定
- サンプルウィジェット定義（5個）
  - メトリックカード × 3
  - 折れ線グラフ × 1
  - 棒グラフ × 1
- モックデータ

### Step 4: ウィジェットコンポーネントの実装

**ディレクトリ作成**:
```bash
mkdir -p src/components/organisms/dashboard/widgets
```

**実装するコンポーネント**:
1. `MetricCardWidget.tsx` - メトリックカード
2. `LineChartWidget.tsx` - 折れ線グラフ
3. `BarChartWidget.tsx` - 棒グラフ
4. `AreaChartWidget.tsx` - エリアチャート
5. `widgets/index.ts` - エクスポート

**内容**: `dynamic-dashboard-implementation-plan.md` の Step 4 を参照

### Step 5: レイアウトコンポーネントの実装

**実装するコンポーネント**:
1. `DashboardLayout.tsx` - グリッドレイアウト
2. `DashboardSkeleton.tsx` - ローディング表示
3. `DashboardError.tsx` - エラー表示

**内容**: `dynamic-dashboard-implementation-plan.md` の Step 6 を参照

### Step 6: WidgetRendererの実装

**ファイル**:
- `src/components/organisms/dashboard/WidgetRenderer.tsx`

**機能**:
- ウィジェットタイプに応じたコンポーネント選択
- チャートタイプに応じた分岐
- グリッド位置の計算

**内容**: `dynamic-dashboard-implementation-plan.md` の Step 5 を参照

### Step 7: DynamicDashboardの実装

**ファイル**:
- `src/components/organisms/dashboard/DynamicDashboard.tsx`

**機能**:
- ダッシュボード設定の取得
- ウィジェットデータの取得
- レイアウトの適用
- エラーハンドリング

**内容**: `dynamic-dashboard-implementation-plan.md` の Step 7 を参照

### Step 8: サンプルページの作成

**ファイル**:
- `src/components/pages/subcategories/_dynamic-sample/DynamicSampleDashboard.tsx`

**内容**: `dynamic-dashboard-implementation-plan.md` の Step 8 を参照

### Step 9: 動作確認

```bash
# 開発サーバー起動
npm run dev:mock

# ブラウザでアクセス
http://localhost:3000/[適切なルート]/dynamic-sample/national
```

**確認ポイント**:
- メトリックカードが3つ表示される
- 折れ線グラフが正しく描画される
- 棒グラフが正しく描画される
- レスポンシブデザインが機能する
- ローディング状態が表示される

## 5. 実装チェックリスト

### Phase 0: プロトタイプ実装

#### 環境準備
- [ ] shadcn/ui chartコンポーネントのインストール
- [ ] rechartsの確認
- [ ] 型定義ディレクトリの作成

#### 型定義
- [ ] `config.ts` - ダッシュボード設定の型
- [ ] `widget.ts` - ウィジェットの型
- [ ] `layout.ts` - レイアウトの型
- [ ] `index.ts` - 型のエクスポート

#### モックデータ
- [ ] `mock-data.ts` - モックデータ作成
- [ ] サンプルダッシュボード設定
- [ ] サンプルウィジェット定義
- [ ] ウィジェット用モックデータ

#### ウィジェットコンポーネント
- [ ] `MetricCardWidget.tsx` - メトリックカード
- [ ] `LineChartWidget.tsx` - 折れ線グラフ
- [ ] `BarChartWidget.tsx` - 棒グラフ
- [ ] `AreaChartWidget.tsx` - エリアチャート
- [ ] `widgets/index.ts` - エクスポート

#### レイアウトコンポーネント
- [ ] `DashboardLayout.tsx` - グリッドレイアウト
- [ ] `DashboardSkeleton.tsx` - ローディング表示
- [ ] `DashboardError.tsx` - エラー表示

#### コアコンポーネント
- [ ] `WidgetRenderer.tsx` - ウィジェット描画
- [ ] `DynamicDashboard.tsx` - メインコンポーネント

#### サンプルページ
- [ ] `DynamicSampleDashboard.tsx` - サンプルページ
- [ ] Next.jsルーティング統合

#### テストと確認
- [ ] ローカル環境での動作確認
- [ ] レスポンシブデザインの確認
- [ ] エラーハンドリングの確認
- [ ] パフォーマンス測定

### Phase 1: データベース連携（将来実装）

#### マイグレーション
- [ ] `dashboard_configs` テーブル作成
- [ ] `dashboard_widgets` テーブル作成
- [ ] `widget_templates` テーブル作成
- [ ] インデックス作成

#### リゾルバー実装
- [ ] `DashboardResolver` クラス作成
- [ ] ダッシュボード設定取得メソッド
- [ ] ウィジェット定義取得メソッド
- [ ] テンプレート取得メソッド

#### API Routes
- [ ] `/api/dashboard/[subcategoryId]` - 設定取得
- [ ] `/api/dashboard/widgets/[id]` - ウィジェット取得
- [ ] エラーハンドリング
- [ ] キャッシュ実装

### Phase 2: データソース統合（将来実装）

#### データソース連携
- [ ] Ranking API連携
- [ ] e-Stat API連携
- [ ] カスタムデータソース対応

#### キャッシュ戦略
- [ ] ダッシュボード設定キャッシュ（1時間）
- [ ] ウィジェットデータキャッシュ（5分）
- [ ] テンプレートキャッシュ（24時間）

## 6. 期待される効果

### 6.1 開発効率の向上

**新規サブカテゴリ追加時**
- 従来: 2つのコンポーネントファイル作成（200-300行 × 2）
- 新方式: D1にレコード登録のみ（5-10レコード）
- **削減率: 90%以上**

### 6.2 保守性の向上

**共通機能の変更時**
- 従来: 100以上のファイルを個別修正
- 新方式: 1つのウィジェットコンポーネント修正
- **削減率: 99%**

### 6.3 パフォーマンス改善

**ビルドサイズ**
- 従来: 200個のコンポーネントファイル（約500KB）
- 新方式: 10個の汎用コンポーネント + 設定データ（約50KB）
- **削減率: 90%**

### 6.4 スケーラビリティ

**サブカテゴリ増加への対応**
- 従来: ファイル数が線形増加（n × 2 ファイル）
- 新方式: データレコードのみ増加（一定のコンポーネント数）
- **拡張性: 無制限**

## 7. リスクと対策

### 7.1 技術的リスク

| リスク | 影響 | 対策 |
|--------|------|------|
| rechartsのパフォーマンス | 中 | プロトタイプで検証、必要に応じて別ライブラリ検討 |
| D1のクエリ速度 | 低 | キャッシュ戦略の実装、インデックス最適化 |
| R2の読み込み速度 | 低 | テンプレートキャッシュ（24時間） |
| 既存ダッシュボードとの互換性 | 高 | 段階的移行、フォールバック機能 |

### 7.2 運用リスク

| リスク | 影響 | 対策 |
|--------|------|------|
| 設定データの管理 | 中 | 管理UI実装（Phase 4） |
| データ移行の複雑さ | 高 | バッチスクリプト、段階的移行 |
| パフォーマンス劣化 | 中 | 継続的なモニタリング、最適化 |

## 8. 次のアクション

### 最優先タスク（今すぐ着手）

1. **shadcn/ui chartのインストール**
   ```bash
   npx shadcn@latest add chart
   ```

2. **型定義の作成**
   - `src/types/dashboard/` ディレクトリ作成
   - 3つの型定義ファイル作成

3. **モックデータの作成**
   - `src/lib/dashboard/mock-data.ts` 作成
   - サンプルダッシュボード設定とウィジェット定義

4. **最初のウィジェット実装**
   - `MetricCardWidget.tsx` から開始
   - 動作確認しながら進める

### 1週間以内に完了すべきタスク

- [ ] 全ウィジェットコンポーネントの実装
- [ ] DynamicDashboard コンポーネントの実装
- [ ] サンプルページの作成と動作確認

### 2週間以内に完了すべきタスク

- [ ] レスポンシブデザインの調整
- [ ] エラーハンドリングの実装
- [ ] パフォーマンス測定と最適化
- [ ] Phase 0 完了、Phase 1 の設計レビュー

## 9. 参考ドキュメント

### 設計ドキュメント
- `subcategory-dashboard-architecture.md` - アーキテクチャ設計（参照のみ、削除予定）
- `dynamic-dashboard-implementation-plan.md` - 実装計画詳細（参照のみ、削除予定）

### 技術ドキュメント
- [shadcn/ui Chart](https://ui.shadcn.com/docs/components/chart)
- [Recharts](https://recharts.org/)
- [D3.js](https://d3js.org/) - コロプレス地図用

### プロジェクト内ドキュメント
- `docs/04_開発ガイド/01_ドメイン/visualization/choropleth-map-guide.md`
- `docs/04_開発ガイド/01_ドメイン/ranking/`
- `data/mock/database/README.md`

## 10. まとめ

### 現在の状況

- ✅ ローカルD1データベースとmockデータ作成完了
- ✅ サブカテゴリとランキング項目のマッピング実装済み
- ❌ 動的ダッシュボードシステムは未実装

### 次の目標

**Phase 0: プロトタイプ実装（1-2週間）**
- shadcn/ui chartを使用したモックデータ版の実装
- 設計の検証とフィードバック収集
- パフォーマンス測定

### 最終ゴール

**Phase 4完了時（2-3ヶ月後）**
- 200個のコンポーネントファイルを10個に削減
- 新規追加時間を90%削減
- 保守性とスケーラビリティの大幅向上
- ビルドサイズ90%削減

---

**更新履歴**
- 2025-10-27: 初版作成（Phase 0実装前の現状把握）
