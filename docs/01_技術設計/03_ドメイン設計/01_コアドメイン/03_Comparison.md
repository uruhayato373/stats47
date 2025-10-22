---
title: Comparison ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - コアドメイン
  - Comparison
---

# Comparison ドメイン

## 概要

Comparison ドメインは、stats47 プロジェクトのコアドメインの一つで、統計データの比較分析を担当します。ランキング比較、時系列比較、地域間比較、統計的有意性判定など、データ比較に関するすべての機能を提供します。

### ビジネス価値

- **相対的な位置づけの理解**: 地域や指標の相対的な位置づけを明確に把握
- **変化の定量化**: 時系列データの変化を定量的に評価
- **類似性の発見**: 類似した地域やパターンの発見
- **統計的根拠に基づく判断**: 統計的有意性を考慮した比較分析

## 責務

- ランキング比較
- 時系列比較
- 地域間比較
- 統計的有意性判定
- 類似度計算
- 差分分析
- 変化率計算
- 相関分析

## 主要エンティティ

### ComparisonResult（比較結果）

比較分析の結果を管理するエンティティ。

**属性:**
- `comparisonId`: 比較の一意識別子
- `comparisonType`: 比較タイプ（ranking/timeSeries/regional）
- `primaryValue`: 主要値
- `secondaryValue`: 比較対象値
- `difference`: 差分
- `ratio`: 比率
- `isSignificant`: 統計的有意性
- `confidenceLevel`: 信頼度

### DifferenceAnalysis（差分分析）

値の差分とその分析結果を管理するエンティティ。

**属性:**
- `absoluteDifference`: 絶対差分
- `relativeDifference`: 相対差分
- `percentageChange`: 変化率
- `direction`: 変化方向（increase/decrease/no_change）
- `magnitude`: 変化の大きさ（small/medium/large）

### SimilarityScore（類似度スコア）

地域やデータ間の類似度を管理するエンティティ。

**属性:**
- `similarityId`: 類似度の一意識別子
- `primaryArea`: 主要地域
- `secondaryArea`: 比較対象地域
- `score`: 類似度スコア（0-1）
- `calculationMethod`: 計算方法（euclidean/cosine/pearson）
- `dimensions`: 比較次元

## 値オブジェクト

### ComparisonType（比較タイプ）

比較の種類を表現する値オブジェクト。

**具体例:**
- `ranking`: ランキング比較（都道府県間の順位比較）
- `timeSeries`: 時系列比較（年度間の変化比較）
- `regional`: 地域間比較（複数地域の総合比較）
- `crossIndicator`: 指標間比較（異なる統計指標の比較）

**制約:**
- 有効な比較タイプのみ許可
- 空文字列は不可
- 最大20文字

**用途:**
- 比較方法の指定
- 結果の分類
- UI表示の制御

### SimilarityMethod（類似度計算方法）

類似度の計算方法を表現する値オブジェクト。

**具体例:**
- `euclidean`: ユークリッド距離（地理的類似性）
- `cosine`: コサイン類似度（ベクトル類似性）
- `pearson`: ピアソン相関係数（線形相関）
- `manhattan`: マンハッタン距離（都市ブロック距離）

**制約:**
- 有効な計算方法のみ許可
- 数値計算の安定性を考慮
- データの性質に応じた選択

**用途:**
- 類似度計算アルゴリズムの指定
- 結果の解釈方法の決定
- パフォーマンス最適化の選択

### StatisticalSignificance（統計的有意性）

統計的有意性の判定結果を表現する値オブジェクト。

**具体例:**
- `p-value: 0.05`: 5%水準で有意
- `p-value: 0.01`: 1%水準で有意
- `p-value: 0.95`: 有意でない
- `confidence: 95%`: 95%信頼区間

**制約:**
- 0〜1の範囲の実数
- 小数点以下3桁まで
- 信頼度は50%〜99%の範囲

**用途:**
- 比較結果の信頼性評価
- 意思決定の根拠
- 結果の解釈

## ドメインサービス

### RankingComparisonService

ランキングデータの比較分析を実装するドメインサービス。

- **責務**: ランキング比較、順位差分分析、パーセンタイル比較
- **主要メソッド**:
  - `compareRankings(area1, area2, rankingKey)`: 2地域のランキング比較
  - `calculateRankDifference(rank1, rank2)`: 順位差分の計算
  - `compareWithNational(areaValue, nationalAverage)`: 全国平均との比較
- **使用例**: 都道府県ランキングの比較、上位・下位の判定、全国平均との乖離度分析

### TimeSeriesComparisonService

時系列データの比較分析を実装するドメインサービス。

- **責務**: 時系列比較、変化率計算、トレンド比較
- **主要メソッド**:
  - `compareTimePeriods(data1, data2)`: 2期間のデータ比較
  - `calculateChangeRate(oldValue, newValue)`: 変化率の計算
  - `compareTrends(trend1, trend2)`: トレンドの比較分析
- **使用例**: 年度間の変化分析、前年比の計算、長期トレンドの比較

### SimilarityCalculationService

類似度計算を実装するドメインサービス。

- **責務**: 類似度計算、距離計算、相関分析
- **主要メソッド**:
  - `calculateEuclideanDistance(data1, data2)`: ユークリッド距離の計算
  - `calculateCosineSimilarity(vector1, vector2)`: コサイン類似度の計算
  - `findSimilarAreas(targetArea, candidateAreas)`: 類似地域の検索
- **使用例**: 地域の類似性分析、類似地域の推薦、パターンマッチング

### StatisticalTestService

統計的有意性の判定を実装するドメインサービス。

- **責務**: 統計的有意性判定、信頼区間計算、仮説検定
- **主要メソッド**:
  - `testSignificance(value1, value2, sampleSize)`: 統計的有意性の検定
  - `calculateConfidenceInterval(data, confidenceLevel)`: 信頼区間の計算
  - `performHypothesisTest(hypothesis, data)`: 仮説検定の実行
- **使用例**: 比較結果の信頼性評価、統計的根拠に基づく判断

## リポジトリ

### ComparisonRepository

比較データの永続化を抽象化するリポジトリインターフェース。

- **責務**: 比較結果のCRUD操作、検索、履歴管理
- **主要メソッド**:
  - `save(comparisonResult)`: 比較結果の保存
  - `findByComparisonId(id)`: 比較IDによる結果取得
  - `findByAreaAndType(areaCode, comparisonType)`: 地域・タイプによる検索
  - `findSimilarityHistory(areaCode)`: 類似度計算の履歴取得

## ディレクトリ構造

```
src/lib/comparison/
├── model/
│   ├── ComparisonResult.ts
│   ├── DifferenceAnalysis.ts
│   ├── SimilarityScore.ts
│   ├── ComparisonType.ts
│   ├── SimilarityMethod.ts
│   └── StatisticalSignificance.ts
├── service/
│   ├── RankingComparisonService.ts
│   ├── TimeSeriesComparisonService.ts
│   ├── SimilarityCalculationService.ts
│   └── StatisticalTestService.ts
└── repositories/
    └── ComparisonRepository.ts
```

## ベストプラクティス

### 1. 比較方法の選択

データの性質に応じて適切な比較方法を選択する。

### 2. 統計的有意性の考慮

比較結果には必ず統計的有意性を考慮し、信頼性を評価する。

### 3. パフォーマンス最適化

大量データの比較時は効率的なアルゴリズムを選択する。

### 4. 結果の解釈

比較結果は文脈に応じて適切に解釈し、誤解を招かないようにする。

## 関連ドメイン

- **Ranking ドメイン**: ランキングデータの提供
- **TimeSeries ドメイン**: 時系列データの提供
- **Area ドメイン**: 地域情報の提供

---

**更新履歴**:

- 2025-01-20: 初版作成
