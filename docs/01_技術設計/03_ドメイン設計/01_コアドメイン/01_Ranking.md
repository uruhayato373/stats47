---
title: Ranking ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - コアドメイン
  - Ranking
---

# Ranking ドメイン

## 概要

Ranking ドメインは、stats47 プロジェクトのコアドメインの一つで、ビジネスの中核価値を提供する最も重要なドメインです。統計データのランキング計算、地域プロファイル生成、比較分析など、統計サイトの中核機能を担当します。

### ビジネス価値

- **データドリブンな意思決定支援**: 統計データの分析により、ユーザーがデータに基づいた判断を行える
- **地域の特徴把握**: 地域プロファイル機能により、地域の強みや特徴を可視化
- **比較分析**: 複数地域間の比較により、相対的な位置づけを理解

## 責務

- ランキング計算
- 比較分析
- 傾向分析
- 統計サマリー生成
- データ品質評価
- 地域プロファイル生成
- 地域の強み検出
- 類似地域検出

## 主要エンティティ

### RankingItem（ランキング項目）

統計指標の定義とメタデータを管理するエンティティ。

**属性:**
- `rankingKey`: ランキングの一意識別子
- `label`: 表示用ラベル
- `unit`: 単位
- `dataSource`: データソース
- `categoryId`: カテゴリID
- `isActive`: 有効フラグ

### RankingValue（ランキング値）

地域ごとの統計値とランキング情報を管理するエンティティ。

**属性:**
- `areaCode`: 地域コード
- `value`: 値
- `rank`: 順位
- `percentile`: パーセンタイル
- `year`: 年度
- `timeCode`: 時間コード

### RegionProfile（地域プロファイル）

地域の総合的な統計プロファイルを管理するエンティティ。

**属性:**
- `areaCode`: 地域コード
- `basicInfo`: 基本情報
- `keyIndicators`: 主要指標リスト
- `strengths`: 強み（トップ10ランキング項目）
- `radarData`: レーダーチャート用データ
- `similarRegions`: 類似地域リスト

### RegionStrength（地域の強み）

地域の特定指標における強みを表現するエンティティ。

**属性:**
- `indicator`: 統計指標
- `rank`: 順位
- `value`: 値
- `nationalAvg`: 全国平均
- `percentile`: パーセンタイル

### SimilarRegion（類似地域）

地域間の類似度を表現するエンティティ。

**属性:**
- `areaCode`: 地域コード
- `similarityScore`: 類似度スコア
- `calculationMethod`: 計算方法（ユークリッド距離/コサイン類似度）

## 値オブジェクト

### RankingKey（ランキングキー）

ランキング項目の一意識別子を表現する値オブジェクト。

**具体例:**
- `total-population`: 総人口
- `population-density`: 人口密度
- `gdp-per-capita`: 一人当たりGDP
- `unemployment-rate`: 失業率
- `elderly-population-ratio`: 高齢化率

**制約:**
- 空文字列は不可
- ケバブケース形式（小文字とハイフン）
- 一意である必要がある
- 最大50文字

**用途:**
- ランキング項目の識別
- URL パラメータとして使用（例: `/population/basic-population/ranking/total-population`）
- データベースのキーとして使用
- API レスポンスでの項目指定

### Rank（順位）

ランキングの順位を表現する値オブジェクト。

**具体例:**
- `1`: 1位（東京都の総人口）
- `10`: 10位（大阪府の総人口）
- `47`: 47位（鳥取県の総人口）

**制約:**
- 1以上の整数
- 最大47（都道府県数）
- 同順位は同じ数値を使用

**用途:**
- 都道府県の順位表示
- ランキング表での位置表示
- 上位・下位の判定（例: 上位10位以内）
- 順位変動の計算

### Percentile（パーセンタイル）

パーセンタイル値を表現する値オブジェクト。

**具体例:**
- `95.7`: 上位5%（東京都の人口密度）
- `50.0`: 中央値（全国平均レベル）
- `15.3`: 下位15%（鳥取県の人口密度）
- `99.2`: 上位1%（非常に高い値）

**制約:**
- 0〜100の実数
- 小数点以下2桁まで
- 0は最小値、100は最大値を意味

**用途:**
- 相対的な位置づけの表現
- 全国平均との比較
- 上位・下位の判定
- データの分布理解

## ドメインサービス

### RankingCalculationService

ランキング計算のビジネスロジックを実装するドメインサービス。

- **責務**: ランキング計算、全国平均との比較、パーセンタイル算出
- **主要メソッド**:
  - `calculateRanks(values)`: 統計値のランキング計算と順位付け
  - `compareWithNational(prefectureValue, nationalAverage)`: 全国平均との比較分析
  - `calculatePercentile(rank, total)`: パーセンタイル値の算出
- **使用例**: 都道府県ランキングの生成、相対的位置づけの評価、全国平均比較

### RankingRepository

ランキングデータの永続化を抽象化するリポジトリインターフェース。

- **責務**: ランキングデータのCRUD操作、検索、フィルタリング
- **主要メソッド**:
  - `findByKey(rankingKey)`: ランキングキーによる項目取得
  - `findAll(filter)`: カテゴリ・サブカテゴリによるフィルタリング検索
  - `save(item)` / `delete(id)`: ランキング項目の保存・削除
  - `exists(key)`: ランキングキーの存在確認

## ディレクトリ構造

```
src/infrastructure/ranking/
├── model/
│   ├── RankingItem.ts
│   ├── RankingValue.ts
│   ├── RankingKey.ts
│   ├── Rank.ts
│   └── Percentile.ts
├── service/
│   ├── RankingCalculationService.ts
│   └── RankingComparisonService.ts
└── repositories/
    └── RankingRepository.ts
```


## ベストプラクティス

### 1. ビジネスルールのドメイン層配置

統計計算のロジックは必ずドメイン層に配置し、アプリケーション層に漏らさない。

### 2. 不変性の維持

値オブジェクト（Rank、Percentile等）は不変にし、変更時は新しいインスタンスを作成。

### 3. エラーハンドリング

Result型を使用して、ビジネスルール違反を適切にハンドリング。

### 4. テスト容易性

ドメインロジックは外部依存を排除し、単体テストを容易にする。

## 関連ドメイン

- **Area Management ドメイン**: 地域情報の取得
- **Data Integration ドメイン**: 統計データの取得
- **Taxonomy Management ドメイン**: カテゴリ情報の管理

---

**更新履歴**:

- 2025-01-20: 初版作成
