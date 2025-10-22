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

```typescript
export class TimePeriod {
  private constructor(
    private readonly startYear: number,
    private readonly endYear: number
  ) {}

  static create(startYear: number, endYear: number): Result<TimePeriod> {
    if (startYear > endYear) {
      return Result.fail("Start year cannot be greater than end year");
    }
    if (endYear - startYear > 50) {
      return Result.fail("Time period cannot exceed 50 years");
    }
    return Result.ok(new TimePeriod(startYear, endYear));
  }

  getDuration(): number {
    return this.endYear - this.startYear + 1;
  }

  getStartYear(): number {
    return this.startYear;
  }

  getEndYear(): number {
    return this.endYear;
  }

  contains(year: number): boolean {
    return year >= this.startYear && year <= this.endYear;
  }
}
```

### CAGR（年平均成長率）

CAGR値を表現する値オブジェクト。

```typescript
export class CAGR {
  private constructor(
    private readonly value: number,
    private readonly isValid: boolean
  ) {}

  static create(
    startValue: number,
    endValue: number,
    years: number
  ): Result<CAGR> {
    if (startValue <= 0 || endValue <= 0) {
      return Result.fail("Values must be positive");
    }
    if (years <= 0) {
      return Result.fail("Years must be positive");
    }

    const cagr = Math.pow(endValue / startValue, 1 / years) - 1;
    const isValid = !isNaN(cagr) && isFinite(cagr);

    return Result.ok(new CAGR(cagr, isValid));
  }

  getValue(): number {
    return this.value;
  }

  getPercentage(): number {
    return this.value * 100;
  }

  isValid(): boolean {
    return this.isValid;
  }

  isHigh(): boolean {
    return this.value > 0.1; // 10%以上
  }

  isLow(): boolean {
    return this.value < -0.1; // -10%以下
  }
}
```

### TrendType（トレンドタイプ）

トレンド分析のタイプを表現する値オブジェクト。

```typescript
export class TrendType {
  private constructor(private readonly value: string) {}

  static readonly LINEAR_REGRESSION = new TrendType("linear_regression");
  static readonly MOVING_AVERAGE = new TrendType("moving_average");
  static readonly EXPONENTIAL_SMOOTHING = new TrendType("exponential_smoothing");

  static create(value: string): Result<TrendType> {
    const validTypes = ["linear_regression", "moving_average", "exponential_smoothing"];
    if (!validTypes.includes(value)) {
      return Result.fail(`Invalid trend type: ${value}`);
    }
    return Result.ok(new TrendType(value));
  }

  getValue(): string {
    return this.value;
  }

  isLinearRegression(): boolean {
    return this.value === "linear_regression";
  }

  isMovingAverage(): boolean {
    return this.value === "moving_average";
  }
}
```

## ドメインサービス

### TimeSeriesService

時系列データの基本操作を実装するドメインサービス。

```typescript
export class TimeSeriesService {
  constructor(
    private readonly timeSeriesRepository: TimeSeriesRepository,
    private readonly trendCalculationService: TrendCalculationService
  ) {}

  async getTimeSeriesData(
    indicatorId: string,
    areaCode: string,
    timePeriod: TimePeriod
  ): Promise<TimeSeriesData[]> {
    return await this.timeSeriesRepository.findByIndicatorAndAreaAndPeriod(
      indicatorId,
      areaCode,
      timePeriod
    );
  }

  async calculateTrend(
    data: TimeSeriesData[],
    trendType: TrendType
  ): Promise<TrendAnalysis> {
    const sortedData = data.sort((a, b) => a.getYear() - b.getYear());
    
    switch (trendType.getValue()) {
      case "linear_regression":
        return this.trendCalculationService.calculateLinearRegression(sortedData);
      case "moving_average":
        return this.trendCalculationService.calculateMovingAverage(sortedData);
      default:
        throw new Error(`Unsupported trend type: ${trendType.getValue()}`);
    }
  }

  async detectAnomalies(data: TimeSeriesData[]): Promise<TimeSeriesData[]> {
    // 異常値検出ロジック
    // 実装省略
  }
}
```

### CAGRCalculationService

CAGR計算のビジネスロジックを実装するドメインサービス。

```typescript
export class CAGRCalculationService {
  calculateCAGR(
    startValue: number,
    endValue: number,
    years: number
  ): Result<CAGRCalculation> {
    const cagrResult = CAGR.create(startValue, endValue, years);
    if (!cagrResult.isSuccess()) {
      return Result.fail(cagrResult.getError());
    }

    const cagr = cagrResult.getValue();
    const confidence = this.calculateConfidence(startValue, endValue, years);

    return Result.ok(
      CAGRCalculation.create({
        startValue,
        endValue,
        years,
        cagr: cagr.getValue(),
        isValid: cagr.isValid(),
        confidence,
        method: "standard",
      }).getValue()
    );
  }

  private calculateConfidence(
    startValue: number,
    endValue: number,
    years: number
  ): number {
    // 信頼区間の計算ロジック
    // 実装省略
    return 0.95; // 95%信頼区間
  }

  compareCAGRs(cagrs: CAGRCalculation[]): ComparisonResult {
    const sortedCAGRs = cagrs.sort((a, b) => b.getCAGR() - a.getCAGR());
    
    return {
      highest: sortedCAGRs[0],
      lowest: sortedCAGRs[sortedCAGRs.length - 1],
      average: this.calculateAverageCAGR(sortedCAGRs),
    };
  }
}
```

### YearOverYearService

前年比計算のビジネスロジックを実装するドメインサービス。

```typescript
export class YearOverYearService {
  calculateYearOverYear(
    currentData: TimeSeriesData,
    previousData: TimeSeriesData
  ): Result<YearOverYearChange> {
    if (currentData.getYear() !== previousData.getYear() + 1) {
      return Result.fail("Data must be consecutive years");
    }

    const changeValue = currentData.getValue() - previousData.getValue();
    const changeRate = previousData.getValue() !== 0 
      ? changeValue / previousData.getValue() 
      : 0;

    const isSignificant = this.isStatisticallySignificant(changeRate);

    return Result.ok(
      YearOverYearChange.create({
        currentYear: currentData.getYear(),
        previousYear: previousData.getYear(),
        changeRate,
        changeValue,
        isSignificant,
        seasonalAdjustment: false,
      }).getValue()
    );
  }

  private isStatisticallySignificant(changeRate: number): boolean {
    // 統計的有意性の判定ロジック
    return Math.abs(changeRate) > 0.05; // 5%以上の変化
  }

  calculateSeasonalAdjustment(data: TimeSeriesData[]): TimeSeriesData[] {
    // 季節調整の計算ロジック
    // 実装省略
  }
}
```

## リポジトリ

### TimeSeriesRepository

時系列データの永続化を抽象化するリポジトリインターフェース。

```typescript
export interface TimeSeriesRepository {
  findByIndicatorAndArea(
    indicatorId: string,
    areaCode: string
  ): Promise<TimeSeriesData[]>;
  
  findByIndicatorAndAreaAndPeriod(
    indicatorId: string,
    areaCode: string,
    timePeriod: TimePeriod
  ): Promise<TimeSeriesData[]>;
  
  findByIndicatorAndYear(
    indicatorId: string,
    year: number
  ): Promise<TimeSeriesData[]>;
  
  save(data: TimeSeriesData): Promise<void>;
  saveAll(data: TimeSeriesData[]): Promise<void>;
  
  delete(indicatorId: string, areaCode: string, year: number): Promise<void>;
  
  exists(indicatorId: string, areaCode: string, year: number): Promise<boolean>;
}
```

## ディレクトリ構造

```
src/domain/time-series/
├── entities/
│   ├── TimeSeriesData.ts
│   ├── TrendAnalysis.ts
│   ├── CAGRCalculation.ts
│   ├── YearOverYearChange.ts
│   └── TimeSeriesChart.ts
├── value-objects/
│   ├── TimePeriod.ts
│   ├── CAGR.ts
│   ├── TrendType.ts
│   ├── ChangeRate.ts
│   └── DataQuality.ts
├── services/
│   ├── TimeSeriesService.ts
│   ├── TrendCalculationService.ts
│   ├── CAGRCalculationService.ts
│   ├── YearOverYearService.ts
│   └── AnomalyDetectionService.ts
├── repositories/
│   └── TimeSeriesRepository.ts
├── aggregates/
│   └── TimeSeriesAggregate.ts
└── specifications/
    ├── TrendSpecification.ts
    └── QualitySpecification.ts
```

## DDDパターン実装例

### エンティティ実装例

```typescript
// src/domain/time-series/entities/TimeSeriesData.ts
export class TimeSeriesData {
  private constructor(
    private readonly indicatorId: string,
    private readonly areaCode: string,
    private readonly year: number,
    private readonly value: number,
    private readonly metadata: Map<string, any>,
    private readonly dataSource: string,
    private readonly quality: DataQuality
  ) {}

  static create(props: {
    indicatorId: string;
    areaCode: string;
    year: number;
    value: number;
    metadata?: Map<string, any>;
    dataSource: string;
  }): Result<TimeSeriesData> {
    if (!props.indicatorId || !props.areaCode) {
      return Result.fail("Indicator ID and area code are required");
    }
    if (props.year < 1900 || props.year > 2100) {
      return Result.fail("Year must be between 1900 and 2100");
    }
    if (isNaN(props.value)) {
      return Result.fail("Value must be a valid number");
    }

    const quality = DataQuality.create(props.value).getValue();

    return Result.ok(
      new TimeSeriesData(
        props.indicatorId,
        props.areaCode,
        props.year,
        props.value,
        props.metadata || new Map(),
        props.dataSource,
        quality
      )
    );
  }

  getIndicatorId(): string {
    return this.indicatorId;
  }

  getAreaCode(): string {
    return this.areaCode;
  }

  getYear(): number {
    return this.year;
  }

  getValue(): number {
    return this.value;
  }

  getQuality(): DataQuality {
    return this.quality;
  }

  isHighQuality(): boolean {
    return this.quality.isHigh();
  }
}
```

### アグリゲート実装例

```typescript
// src/domain/time-series/aggregates/TimeSeriesAggregate.ts
export class TimeSeriesAggregate {
  private constructor(
    private readonly indicatorId: string,
    private readonly areaCode: string,
    private data: TimeSeriesData[],
    private trendAnalysis: TrendAnalysis | null,
    private cagrCalculation: CAGRCalculation | null
  ) {}

  static create(
    indicatorId: string,
    areaCode: string,
    data: TimeSeriesData[]
  ): TimeSeriesAggregate {
    return new TimeSeriesAggregate(
      indicatorId,
      areaCode,
      data,
      null,
      null
    );
  }

  addDataPoint(dataPoint: TimeSeriesData): Result<void> {
    if (dataPoint.getIndicatorId() !== this.indicatorId) {
      return Result.fail("Indicator ID mismatch");
    }
    if (dataPoint.getAreaCode() !== this.areaCode) {
      return Result.fail("Area code mismatch");
    }

    // 重複チェック
    const exists = this.data.some(
      d => d.getYear() === dataPoint.getYear()
    );
    if (exists) {
      return Result.fail("Data point for this year already exists");
    }

    this.data.push(dataPoint);
    this.data.sort((a, b) => a.getYear() - b.getYear());
    
    // トレンド分析とCAGR計算を無効化
    this.trendAnalysis = null;
    this.cagrCalculation = null;

    return Result.ok();
  }

  calculateTrend(trendType: TrendType): Result<TrendAnalysis> {
    if (this.data.length < 2) {
      return Result.fail("At least 2 data points are required for trend analysis");
    }

    // 既存の分析結果を再利用
    if (this.trendAnalysis && 
        this.trendAnalysis.getTrendType().equals(trendType)) {
      return Result.ok(this.trendAnalysis);
    }

    // 新しい分析を実行
    const trendService = new TrendCalculationService();
    const analysis = trendService.calculateTrend(this.data, trendType);
    
    this.trendAnalysis = analysis;
    return Result.ok(analysis);
  }

  calculateCAGR(): Result<CAGRCalculation> {
    if (this.data.length < 2) {
      return Result.fail("At least 2 data points are required for CAGR calculation");
    }

    // 既存の計算結果を再利用
    if (this.cagrCalculation) {
      return Result.ok(this.cagrCalculation);
    }

    const sortedData = [...this.data].sort((a, b) => a.getYear() - b.getYear());
    const startValue = sortedData[0].getValue();
    const endValue = sortedData[sortedData.length - 1].getValue();
    const years = sortedData[sortedData.length - 1].getYear() - sortedData[0].getYear();

    const cagrService = new CAGRCalculationService();
    const calculation = cagrService.calculateCAGR(startValue, endValue, years);
    
    if (calculation.isSuccess()) {
      this.cagrCalculation = calculation.getValue();
    }
    
    return calculation;
  }

  validate(): Result<void> {
    if (this.data.length === 0) {
      return Result.fail("No data points available");
    }

    // データの整合性チェック
    const years = this.data.map(d => d.getYear());
    const uniqueYears = new Set(years);
    if (years.length !== uniqueYears.size) {
      return Result.fail("Duplicate years found");
    }

    return Result.ok();
  }
}
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

- **Analytics ドメイン**: 時系列データの分析結果の活用
- **Visualization ドメイン**: 時系列グラフの描画
- **Data Integration ドメイン**: 時系列データの取得と管理

---

**更新履歴**:

- 2025-01-20: 初版作成
