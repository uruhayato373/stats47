---
title: TimeSeries ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - コアドメイン
  - TimeSeries
---

# TimeSeries ドメイン

## 概要

TimeSeries ドメインは、stats47 プロジェクトのコアドメインの一つで、時系列データの分析と可視化を担当します。複数年度データの管理、CAGR計算、トレンド分析、時系列グラフ生成など、時間軸での統計データ分析に関するすべての機能を提供します。

### ビジネス価値

- **トレンド分析**: 時間経過に伴う変化の傾向を把握し、将来予測に活用
- **成長率分析**: CAGR（年平均成長率）により、長期的な成長パフォーマンスを評価
- **比較分析**: 複数地域の時系列比較により、相対的な変化を理解
- **前年比分析**: 前年同期比や前年比により、短期間の変化を把握

## 責務

- 複数年度データの取得・管理
- CAGR（年平均成長率）計算
- トレンドライン計算（線形回帰、移動平均）
- 前年比・前年同期比計算
- 時系列グラフ生成
- 複数地域の時系列比較
- 時系列データの品質管理
- 異常値検出と処理

## 主要エンティティ

### TimeSeriesData（時系列データ）

時系列データの基本単位を管理するエンティティ。

**属性:**
- `indicatorId`: 統計指標 ID
- `areaCode`: 地域コード
- `year`: 年度
- `value`: 値
- `metadata`: メタデータ
- `dataSource`: データソース
- `quality`: データ品質スコア

### TrendAnalysis（トレンド分析）

時系列データのトレンド分析結果を管理するエンティティ。

**属性:**
- `trendType`: トレンドタイプ（線形回帰、移動平均）
- `equation`: 回帰式
- `rSquared`: 決定係数
- `slope`: 傾き
- `intercept`: 切片
- `confidence`: 信頼区間
- `pValue`: p値

### CAGRCalculation（CAGR 計算）

年平均成長率の計算結果を管理するエンティティ。

**属性:**
- `startValue`: 開始値
- `endValue`: 終了値
- `years`: 年数
- `cagr`: CAGR 値
- `isValid`: 有効性
- `confidence`: 信頼区間
- `method`: 計算方法

### YearOverYearChange（前年比）

前年比の計算結果を管理するエンティティ。

**属性:**
- `currentYear`: 当年
- `previousYear`: 前年
- `changeRate`: 変化率
- `changeValue`: 変化量
- `isSignificant`: 統計的有意性
- `seasonalAdjustment`: 季節調整フラグ

### TimeSeriesChart（時系列チャート）

時系列グラフの設定とデータを管理するエンティティ。

**属性:**
- `chartType`: チャートタイプ（線グラフ、棒グラフ等）
- `timeRange`: 時間範囲
- `dataPoints`: データポイント
- `trendLine`: トレンドライン
- `annotations`: 注釈
- `responsive`: レスポンシブ設定

## 値オブジェクト

### TimePeriod（時間期間）

時間期間を表現する値オブジェクト。

- **具体例**: `2015-2020`（6年間）, `2018-2023`（6年間）, `2000-2010`（11年間）
- **制約**: 開始年 ≤ 終了年、最大50年間、1900年以降2100年以前
- **用途**: 時系列データの範囲指定、トレンド分析の期間設定、CAGR計算の期間

### CAGR（年平均成長率）

CAGR値を表現する値オブジェクト。

- **具体例**: `0.05`（5%成長）, `-0.03`（3%減少）, `0.15`（15%高成長）
- **制約**: 開始値・終了値は正の数、年数は1以上、NaN/Infiniteは無効
- **用途**: 長期成長率の評価、地域間比較、投資判断指標

### TrendType（トレンドタイプ）

トレンド分析のタイプを表現する値オブジェクト。

- **具体例**: `linear_regression`（線形回帰）, `moving_average`（移動平均）, `exponential_smoothing`（指数平滑化）
- **制約**: 3種類の定義済みトレンドタイプのみ
- **用途**: トレンドライン計算方法の選択、時系列予測、データ平滑化

## ドメインサービス

### TimeSeriesService

時系列データの基本操作を実装するドメインサービス。

- **責務**: 時系列データの取得・管理、トレンド計算、異常値検出
- **主要メソッド**:
  - `getTimeSeriesData(indicatorId, areaCode, timePeriod)`: 時系列データの取得
  - `calculateTrend(data, trendType)`: トレンド分析の実行
  - `detectAnomalies(data)`: 異常値の検出
- **使用例**: 複数年度の統計データ取得、長期トレンドの分析、データ品質チェック

### CAGRCalculationService

CAGR計算のビジネスロジックを実装するドメインサービス。

- **責務**: CAGR計算、信頼区間の算出、複数CAGRの比較分析
- **主要メソッド**:
  - `calculateCAGR(startValue, endValue, years)`: CAGR値の計算
  - `calculateConfidence(startValue, endValue, years)`: 信頼区間の計算
  - `compareCAGRs(cagrs)`: 複数地域のCAGR比較
- **使用例**: 地域成長率の評価、長期トレンド分析、投資判断指標の算出

### YearOverYearService

前年比計算のビジネスロジックを実装するドメインサービス。

- **責務**: 前年比計算、統計的有意性判定、季節調整
- **主要メソッド**:
  - `calculateYearOverYear(currentData, previousData)`: 前年比の計算
  - `isStatisticallySignificant(changeRate)`: 統計的有意性の判定
  - `calculateSeasonalAdjustment(data)`: 季節調整の適用
- **使用例**: 短期変化の把握、前年同期比分析、季節変動の除去

## リポジトリ

### TimeSeriesRepository

時系列データの永続化を抽象化するリポジトリインターフェース。

- **責務**: 時系列データのCRUD操作、期間指定検索、年度指定検索
- **主要メソッド**:
  - `findByIndicatorAndArea(indicatorId, areaCode)`: 全期間データの取得
  - `findByIndicatorAndAreaAndPeriod(indicatorId, areaCode, timePeriod)`: 期間指定検索
  - `findByIndicatorAndYear(indicatorId, year)`: 年度指定検索
  - `save(data)` / `saveAll(data)`: データの保存
  - `delete(indicatorId, areaCode, year)`: データの削除

## ディレクトリ構造

```
src/infrastructure/timeseries/
├── model/              # エンティティと値オブジェクト
│   ├── TimeSeriesData.ts
│   ├── TrendAnalysis.ts
│   ├── CAGRCalculation.ts
│   ├── YearOverYearChange.ts
│   ├── TimeSeriesChart.ts
│   ├── TimePeriod.ts
│   ├── CAGR.ts
│   ├── TrendType.ts
│   ├── ChangeRate.ts
│   └── DataQuality.ts
├── service/            # ドメインサービス
│   ├── TimeSeriesService.ts
│   ├── TrendCalculationService.ts
│   ├── CAGRCalculationService.ts
│   ├── YearOverYearService.ts
│   └── AnomalyDetectionService.ts
└── repositories/       # リポジトリ
    └── TimeSeriesRepository.ts
```


## ベストプラクティス

### 1. データ品質管理

- 異常値の検出と処理
- 欠損データの適切な処理
- データソースの信頼性評価

### 2. パフォーマンス最適化

- 大量データの効率的な処理
- キャッシュ戦略の活用
- 遅延計算による初期表示の高速化

### 3. 統計的妥当性

- 適切な統計手法の選択
- 信頼区間の計算
- 統計的有意性の判定

### 4. 可視化の最適化

- データに適したチャートタイプの選択
- レスポンシブデザインの実装
- インタラクティブ機能の提供

## 関連ドメイン

- **Ranking ドメイン**: 時系列データの分析結果の活用
- **Data Integration ドメイン**: 時系列データの取得と管理

---

**更新履歴**:

- 2025-01-20: 初版作成
