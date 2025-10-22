---
title: Analytics ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - コアドメイン
  - Analytics
---

# Analytics ドメイン

## 概要

Analytics ドメインは、stats47 プロジェクトのコアドメインの一つで、ビジネスの中核価値を提供する最も重要なドメインです。統計データの分析、ランキング計算、地域プロファイル生成など、統計サイトの中核機能を担当します。

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

### RankingKey

ランキング項目の一意識別子を表現する値オブジェクト。

```typescript
export class RankingKey {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<RankingKey> {
    if (!value || value.trim().length === 0) {
      return Result.fail("Ranking key cannot be empty");
    }
    return Result.ok(new RankingKey(value));
  }

  toString(): string {
    return this.value;
  }

  equals(other: RankingKey): boolean {
    return this.value === other.value;
  }
}
```

### Rank

ランキングの順位を表現する値オブジェクト。

```typescript
export class Rank {
  private constructor(private readonly value: number) {}

  static create(value: number): Result<Rank> {
    if (value < 1) {
      return Result.fail("Rank must be greater than 0");
    }
    return Result.ok(new Rank(value));
  }

  getValue(): number {
    return this.value;
  }

  isTopTen(): boolean {
    return this.value <= 10;
  }
}
```

### Percentile

パーセンタイル値を表現する値オブジェクト。

```typescript
export class Percentile {
  private constructor(private readonly value: number) {}

  static create(value: number): Result<Percentile> {
    if (value < 0 || value > 100) {
      return Result.fail("Percentile must be between 0 and 100");
    }
    return Result.ok(new Percentile(value));
  }

  getValue(): number {
    return this.value;
  }

  isHigh(): boolean {
    return this.value >= 80;
  }

  isLow(): boolean {
    return this.value <= 20;
  }
}
```

## ドメインサービス

### RankingCalculationService

ランキング計算のビジネスロジックを実装するドメインサービス。

```typescript
export class RankingCalculationService {
  /**
   * ランキングを計算
   */
  calculateRanks(values: RankingValue[]): RankedValue[] {
    const sorted = [...values].sort((a, b) => b.getValue() - a.getValue());

    return sorted.map((value, index) => {
      const rank = Rank.create(index + 1).getValue();
      const percentile = Percentile.create(
        ((sorted.length - index) / sorted.length) * 100
      ).getValue();

      return {
        value,
        rank,
        percentile,
      };
    });
  }

  /**
   * 全国平均との比較
   */
  compareWithNational(
    prefectureValue: number,
    nationalAverage: number
  ): ComparisonResult {
    const difference = prefectureValue - nationalAverage;
    const ratio = (prefectureValue / nationalAverage) * 100;

    return {
      difference,
      ratio,
      isAboveAverage: difference > 0,
    };
  }
}
```

### RegionProfileService

地域プロファイル生成のビジネスロジックを実装するドメインサービス。

```typescript
export class RegionProfileService {
  constructor(
    private rankingRepository: RankingRepository,
    private areaRepository: AreaRepository
  ) {}

  async generateRegionProfile(areaCode: AreaCode): Promise<RegionProfile> {
    // 1. 基本情報を取得
    const basicInfo = await this.areaRepository.findByCode(areaCode);
    
    // 2. 主要指標を取得
    const keyIndicators = await this.getKeyIndicators(areaCode);
    
    // 3. 強みを検出
    const strengths = await this.detectStrengths(areaCode);
    
    // 4. 類似地域を検出
    const similarRegions = await this.findSimilarRegions(areaCode);

    return RegionProfile.create({
      areaCode,
      basicInfo,
      keyIndicators,
      strengths,
      similarRegions,
    }).getValue();
  }

  private async detectStrengths(areaCode: AreaCode): Promise<RegionStrength[]> {
    // トップ10ランキング項目を検出するロジック
    // 実装省略
  }
}
```

## リポジトリ

### RankingRepository

ランキングデータの永続化を抽象化するリポジトリインターフェース。

```typescript
export interface RankingRepository {
  findById(id: RankingItemId): Promise<RankingItem | null>;
  findByKey(key: RankingKey): Promise<RankingItem | null>;
  findAll(filter: RankingFilter): Promise<RankingItem[]>;
  save(item: RankingItem): Promise<void>;
  delete(id: RankingItemId): Promise<void>;
  exists(key: RankingKey): Promise<boolean>;
}

export interface RankingFilter {
  categoryId?: string;
  subcategoryId?: string;
  isActive?: boolean;
}
```

## ディレクトリ構造

```
src/domain/analytics/
├── ranking/
│   ├── entities/
│   │   ├── RankingItem.ts
│   │   └── RankingValue.ts
│   ├── value-objects/
│   │   ├── RankingKey.ts
│   │   ├── Rank.ts
│   │   └── Percentile.ts
│   ├── services/
│   │   ├── RankingCalculationService.ts
│   │   └── RankingComparisonService.ts
│   ├── repositories/
│   │   └── RankingRepository.ts
│   └── aggregates/
│       └── RankingAggregate.ts
├── comparison/
│   ├── entities/
│   │   └── ComparisonResult.ts
│   └── services/
│       └── ComparisonService.ts
├── trend-analysis/
│   ├── entities/
│   │   └── Trend.ts
│   └── services/
│       └── TrendAnalysisService.ts
├── statistics/
│   ├── value-objects/
│   │   ├── Mean.ts
│   │   ├── Median.ts
│   │   └── StandardDeviation.ts
│   └── services/
│       └── StatisticsCalculationService.ts
└── region-profile/
    ├── entities/
    │   ├── RegionProfile.ts
    │   ├── RegionStrength.ts
    │   └── SimilarRegion.ts
    ├── value-objects/
    │   ├── SimilarityScore.ts
    │   └── StrengthThreshold.ts
    ├── services/
    │   ├── RegionProfileService.ts
    │   ├── StrengthDetectionService.ts
    │   └── SimilarityCalculationService.ts
    └── repositories/
        └── RegionProfileRepository.ts
```

## DDDパターン実装例

### エンティティ実装例

```typescript
// src/domain/analytics/ranking/entities/RankingItem.ts
export class RankingItem {
  private constructor(
    private readonly id: RankingItemId,
    private readonly rankingKey: RankingKey,
    private label: Label,
    private name: string,
    private unit: Unit,
    private dataSourceId: string,
    private isActive: boolean
  ) {}

  static create(props: {
    id: RankingItemId;
    rankingKey: RankingKey;
    label: Label;
    name: string;
    unit: Unit;
    dataSourceId: string;
  }): Result<RankingItem> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail("Name cannot be empty");
    }

    return Result.ok(
      new RankingItem(
        props.id,
        props.rankingKey,
        props.label,
        props.name,
        props.unit,
        props.dataSourceId,
        true
      )
    );
  }

  updateLabel(newLabel: Label): Result<void> {
    this.label = newLabel;
    return Result.ok();
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }
}
```

### アグリゲート実装例

```typescript
// src/domain/analytics/ranking/aggregates/RankingAggregate.ts
export class RankingAggregate {
  private constructor(
    private readonly item: RankingItem,
    private values: RankingValue[],
    private metadata: RankingMetadata,
    private statistics: RankingStatistics
  ) {}

  addValue(value: RankingValue): Result<void> {
    const exists = this.values.some((v) =>
      v.getAreaCode().equals(value.getAreaCode())
    );

    if (exists) {
      return Result.fail("Value for this area already exists");
    }

    this.values.push(value);
    this.statistics = RankingAggregate.calculateStatistics(this.values);
    return Result.ok();
  }

  validate(): Result<void> {
    if (this.values.length < 2) {
      return Result.fail("At least 2 values are required");
    }
    return Result.ok();
  }
}
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

- **Visualization ドメイン**: ランキング結果の可視化
- **Area Management ドメイン**: 地域情報の取得
- **Data Integration ドメイン**: 統計データの取得
- **Taxonomy Management ドメイン**: カテゴリ情報の管理

---

**更新履歴**:

- 2025-01-20: 初版作成
