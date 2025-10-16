# ランキングアダプターレイヤー設計書

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: estat-api → ranking ドメイン間のデータ変換

---

## 目次

1. [概要](#概要)
2. [設計原則](#設計原則)
3. [libディレクトリ構成](#libディレクトリ構成)
4. [アダプターパターン設計](#アダプターパターン設計)
5. [データフロー](#データフロー)
6. [実装ガイド](#実装ガイド)
7. [テスト戦略](#テスト戦略)

---

## 概要

### 目的

複数のデータソース（e-Stat API、RESAS、カスタムデータ等）から取得したデータを、統一されたランキングフォーマットに変換するアダプターレイヤーを構築する。

### アーキテクチャパターン

**アダプターパターン（Adapter Pattern）**を採用

```
┌──────────────┐
│ estat-api    │ FormattedEstatData
│   Domain     │ ────────────┐
└──────────────┘             │
                             ▼
                    ┌──────────────────┐
                    │ Adapter Layer    │ 変換・計算
                    │ (疎結合)         │
                    └──────────────────┘
                             │
                             ▼
┌──────────────┐    UnifiedRankingData
│  ranking     │ ◄───────────┘
│   Domain     │
└──────────────┘
```

### メリット

| 項目 | メリット |
|------|---------|
| **疎結合** | estat-apiとrankingが独立、相互依存なし |
| **拡張性** | 新しいデータソース追加が容易 |
| **テスタビリティ** | 単体テストが簡単、モック作成が容易 |
| **保守性** | 変換ロジックが一箇所に集約 |
| **再利用性** | アダプターインターフェースで統一 |

---

## 設計原則

### 1. 単一責任の原則（SRP）

各レイヤーは明確な責任を持つ：

- **estat-apiドメイン**: e-Stat APIとの通信、生データの取得・整形
- **アダプターレイヤー**: ドメイン間のデータ変換
- **rankingドメイン**: ランキング固有のビジネスロジック

### 2. 依存性逆転の原則（DIP）

```typescript
// ❌ 悪い例：rankingドメインがestat-apiに直接依存
import { EstatStatsDataFetcher } from "@/lib/estat-api";

class RankingService {
  async getRanking() {
    const estatData = await EstatStatsDataFetcher.fetch(...);
    // 変換処理...
  }
}

// ✅ 良い例：アダプターインターフェースに依存
interface RankingDataAdapter {
  fetchAndTransform(...): Promise<UnifiedRankingData>;
}

class RankingService {
  constructor(private adapter: RankingDataAdapter) {}
  
  async getRanking() {
    const rankingData = await this.adapter.fetchAndTransform(...);
    // ビジネスロジック...
  }
}
```

### 3. オープン・クローズドの原則（OCP）

新しいデータソース追加時、既存コードを変更せずに拡張可能：

```typescript
// 新しいデータソース追加は新しいアダプタークラスを作るだけ
export class ResasRankingAdapter implements RankingDataAdapter {
  // 実装...
}
```

---

## libディレクトリ構成

### 全体構造

```
src/lib/
├── estat-api/                          # e-Statドメイン（既存）
│   ├── client/
│   │   ├── api-client.ts
│   │   ├── error-handler.ts
│   │   ├── http-client.ts
│   │   └── index.ts
│   ├── constants.ts
│   ├── index.ts
│   ├── meta-info/
│   │   ├── fetcher.ts
│   │   ├── formatter.ts
│   │   └── index.ts
│   ├── stats-data/
│   │   ├── fetcher.ts
│   │   ├── formatter.ts
│   │   ├── helpers.ts
│   │   └── index.ts
│   └── types/
│       ├── common.ts
│       ├── meta-info.ts
│       ├── stats-data.ts              # FormattedEstatData
│       └── index.ts
│
├── ranking/                            # Rankingドメイン（新規・拡張）
│   ├── adapters/                       # ★ アダプターレイヤー（新規）
│   │   ├── base/
│   │   │   ├── adapter-interface.ts   # 共通インターフェース
│   │   │   ├── adapter-registry.ts    # アダプター登録・管理
│   │   │   └── index.ts
│   │   ├── estat/
│   │   │   ├── estat-adapter.ts       # e-Stat変換アダプター
│   │   │   ├── estat-transformer.ts   # 変換ロジック
│   │   │   ├── estat-mapper.ts        # フィールドマッピング
│   │   │   └── index.ts
│   │   ├── resas/                      # 将来のRESASアダプター
│   │   │   ├── resas-adapter.ts
│   │   │   └── index.ts
│   │   ├── custom/                     # カスタムデータアダプター
│   │   │   ├── custom-adapter.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── calculators/                    # 計算ロジック（新規）
│   │   ├── ranking-calculator.ts      # ランキング計算
│   │   ├── statistics-calculator.ts   # 統計計算
│   │   ├── quality-assessor.ts        # データ品質評価
│   │   └── index.ts
│   │
│   ├── services/                       # ビジネスロジック（既存・拡張）
│   │   ├── RankingDataService.ts      # メインサービス
│   │   ├── RankingR2Service.ts        # R2操作
│   │   └── index.ts
│   │
│   ├── utils/                          # ユーティリティ（既存・拡張）
│   │   ├── r2-key-generator.ts
│   │   ├── area-code-utils.ts         # 地域コード関連
│   │   └── index.ts
│   │
│   ├── validators/                     # バリデーション（新規）
│   │   ├── data-validator.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
└── types/
    └── ranking/                        # Ranking型定義
        ├── base.ts
        ├── unified.ts                  # UnifiedRankingData
        ├── r2.ts
        ├── adapters.ts                 # アダプター型定義
        └── index.ts
```

### ディレクトリの責務

#### `ranking/adapters/`（アダプターレイヤー）

**責務**: データソースとrankingドメイン間の変換

```
adapters/
├── base/                    # 共通基盤
│   ├── adapter-interface.ts # すべてのアダプターが実装すべきインターフェース
│   ├── adapter-registry.ts  # アダプターの動的登録・取得
│   └── index.ts
│
├── estat/                   # e-Stat専用アダプター
│   ├── estat-adapter.ts     # メインアダプタークラス
│   ├── estat-transformer.ts # FormattedEstatData → UnifiedRankingData
│   ├── estat-mapper.ts      # フィールドマッピング定義
│   └── index.ts
│
├── resas/                   # RESAS専用アダプター（将来）
│   ├── resas-adapter.ts
│   └── index.ts
│
└── custom/                  # カスタムデータアダプター
    ├── custom-adapter.ts
    └── index.ts
```

#### `ranking/calculators/`（計算ロジック）

**責務**: ランキング計算、統計計算、データ品質評価

```
calculators/
├── ranking-calculator.ts    # ランキング計算（順位、パーセンタイル）
├── statistics-calculator.ts # 統計計算（平均、中央値、標準偏差）
├── quality-assessor.ts      # データ品質評価（完全性、信頼性）
└── index.ts
```

#### `ranking/services/`（ビジネスロジック）

**責務**: ランキングドメインの主要サービス

```
services/
├── RankingDataService.ts    # メインサービス（D1+R2統合）
├── RankingR2Service.ts      # R2ストレージ操作
└── index.ts
```

---

## アダプターパターン設計

### アダプターインターフェース

```typescript
// src/lib/ranking/adapters/base/adapter-interface.ts

import type { UnifiedRankingData, TargetAreaLevel } from "@/types/ranking";

/**
 * ランキングデータアダプターインターフェース
 * すべてのデータソースアダプターが実装すべき
 */
export interface RankingDataAdapter {
  /**
   * データソースID（一意識別子）
   */
  readonly sourceId: string;
  
  /**
   * データソース名（表示用）
   */
  readonly sourceName: string;
  
  /**
   * データソースが利用可能かチェック
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * データを取得して統一フォーマットに変換
   * 
   * @param params - 取得パラメータ
   * @returns 統一されたランキングデータ
   */
  fetchAndTransform(params: AdapterFetchParams): Promise<UnifiedRankingData>;
  
  /**
   * 利用可能な年度リストを取得
   */
  getAvailableYears(
    rankingKey: string,
    level: TargetAreaLevel
  ): Promise<string[]>;
}

/**
 * アダプター取得パラメータ
 */
export interface AdapterFetchParams {
  rankingKey: string;
  timeCode: string;
  level: TargetAreaLevel;
  parentCode?: string;
  
  // データソース固有のパラメータ（オプション）
  sourceSpecific?: {
    statsDataId?: string;      // e-Stat用
    categoryCode?: string;      // e-Stat用
    resasApiKey?: string;       // RESAS用
    [key: string]: unknown;
  };
}

/**
 * アダプター変換結果
 */
export interface AdapterTransformResult {
  data: UnifiedRankingData;
  metadata: {
    sourceId: string;
    sourceName: string;
    fetchedAt: Date;
    transformDuration: number;  // ミリ秒
  };
}
```

### アダプターレジストリ

```typescript
// src/lib/ranking/adapters/base/adapter-registry.ts

import type { RankingDataAdapter } from "./adapter-interface";

/**
 * アダプターレジストリ
 * データソースアダプターの登録・管理
 */
export class RankingAdapterRegistry {
  private static adapters = new Map<string, RankingDataAdapter>();
  
  /**
   * アダプターを登録
   */
  static register(adapter: RankingDataAdapter): void {
    if (this.adapters.has(adapter.sourceId)) {
      console.warn(
        `Adapter ${adapter.sourceId} is already registered. Overwriting...`
      );
    }
    this.adapters.set(adapter.sourceId, adapter);
    console.log(`✅ Registered adapter: ${adapter.sourceId}`);
  }
  
  /**
   * アダプターを取得
   */
  static getAdapter(sourceId: string): RankingDataAdapter | undefined {
    return this.adapters.get(sourceId);
  }
  
  /**
   * すべてのアダプターを取得
   */
  static getAllAdapters(): RankingDataAdapter[] {
    return Array.from(this.adapters.values());
  }
  
  /**
   * 利用可能なアダプターのみ取得
   */
  static async getAvailableAdapters(): Promise<RankingDataAdapter[]> {
    const adapters = this.getAllAdapters();
    const availability = await Promise.all(
      adapters.map(async (adapter) => ({
        adapter,
        available: await adapter.isAvailable(),
      }))
    );
    
    return availability
      .filter((item) => item.available)
      .map((item) => item.adapter);
  }
}
```

### e-Statアダプター実装

```typescript
// src/lib/ranking/adapters/estat/estat-adapter.ts

import { EstatStatsDataFetcher } from "@/lib/estat-api";
import type {
  RankingDataAdapter,
  AdapterFetchParams,
} from "../base/adapter-interface";
import type { UnifiedRankingData, TargetAreaLevel } from "@/types/ranking";
import { EstatTransformer } from "./estat-transformer";
import { RankingCalculator } from "../../calculators/ranking-calculator";
import { StatisticsCalculator } from "../../calculators/statistics-calculator";
import { QualityAssessor } from "../../calculators/quality-assessor";

/**
 * e-Stat専用ランキングアダプター
 */
export class EstatRankingAdapter implements RankingDataAdapter {
  readonly sourceId = "estat";
  readonly sourceName = "e-Stat（政府統計）";
  
  private transformer: EstatTransformer;
  private rankingCalculator: RankingCalculator;
  private statisticsCalculator: StatisticsCalculator;
  private qualityAssessor: QualityAssessor;
  
  constructor() {
    this.transformer = new EstatTransformer();
    this.rankingCalculator = new RankingCalculator();
    this.statisticsCalculator = new StatisticsCalculator();
    this.qualityAssessor = new QualityAssessor();
  }
  
  /**
   * e-Stat APIが利用可能かチェック
   */
  async isAvailable(): Promise<boolean> {
    try {
      // 簡易的なヘルスチェック
      // 実際にはAPIキーの存在確認や軽量なAPI呼び出しで確認
      return !!process.env.NEXT_PUBLIC_ESTAT_APP_ID;
    } catch {
      return false;
    }
  }
  
  /**
   * データを取得して統一フォーマットに変換
   */
  async fetchAndTransform(
    params: AdapterFetchParams
  ): Promise<UnifiedRankingData> {
    const startTime = Date.now();
    console.log(`🔵 EstatAdapter: fetchAndTransform 開始`, params);
    
    try {
      // 1. e-Stat APIから生データ取得
      const { statsDataId, categoryCode } = this.extractEstatParams(params);
      
      const fetcher = new EstatStatsDataFetcher();
      const estatData = await fetcher.fetchAndFormat(statsDataId, {
        categoryFilter: categoryCode,
        yearFilter: params.timeCode,
      });
      
      console.log(
        `✅ EstatAdapter: e-Statデータ取得完了 (${estatData.values.length}件)`
      );
      
      // 2. 統一フォーマットに変換
      const transformedData = this.transformer.transform(
        estatData,
        params.level,
        params.parentCode
      );
      
      // 3. ランキング計算
      const rankedData = this.rankingCalculator.calculate(
        transformedData,
        params.level
      );
      
      // 4. 統計情報計算
      const statistics = this.statisticsCalculator.calculate(rankedData);
      
      // 5. データ品質評価
      const quality = this.qualityAssessor.assess(rankedData, params.level);
      
      // 6. 統一データ構築
      const unifiedData: UnifiedRankingData = {
        metadata: {
          rankingKey: params.rankingKey,
          dataSourceId: this.sourceId,
          dataSourceName: this.sourceName,
          targetAreaLevel: params.level,
          lastUpdated: new Date().toISOString(),
          // ... その他のメタデータ
        },
        values: rankedData,
        statistics,
        quality,
        timeSeries: {
          availableYears: [], // 後で実装
          currentYear: params.timeCode,
          minYear: params.timeCode,
          maxYear: params.timeCode,
        },
      };
      
      const duration = Date.now() - startTime;
      console.log(`✅ EstatAdapter: 変換完了 (${duration}ms)`);
      
      return unifiedData;
    } catch (error) {
      console.error("❌ EstatAdapter: 変換失敗", error);
      throw new Error(
        `e-Statデータの変換に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
  
  /**
   * 利用可能な年度リストを取得
   */
  async getAvailableYears(
    rankingKey: string,
    level: TargetAreaLevel
  ): Promise<string[]> {
    // e-Stat APIから年度リストを取得
    // 実装は省略
    return [];
  }
  
  /**
   * AdapterFetchParamsからe-Stat固有パラメータを抽出
   */
  private extractEstatParams(params: AdapterFetchParams): {
    statsDataId: string;
    categoryCode: string;
  } {
    const { statsDataId, categoryCode } = params.sourceSpecific || {};
    
    if (!statsDataId || !categoryCode) {
      throw new Error(
        "e-Stat adapter requires statsDataId and categoryCode in sourceSpecific"
      );
    }
    
    return {
      statsDataId: statsDataId as string,
      categoryCode: categoryCode as string,
    };
  }
}
```

### Transformer（変換ロジック）

```typescript
// src/lib/ranking/adapters/estat/estat-transformer.ts

import type { FormattedEstatData } from "@/lib/estat-api/types";
import type { RankingDataPoint, TargetAreaLevel } from "@/types/ranking";
import { getAreaType, getParentPrefectureCode } from "../../utils/area-code-utils";

/**
 * e-Statデータ変換クラス
 * FormattedEstatData → RankingDataPoint[]
 */
export class EstatTransformer {
  /**
   * e-Statデータをランキングデータポイントに変換
   */
  transform(
    estatData: FormattedEstatData,
    level: TargetAreaLevel,
    parentCode?: string
  ): RankingDataPoint[] {
    console.log(`🔵 Transformer: 変換開始 (level: ${level})`);
    
    // 1. レベルでフィルタリング
    const filteredValues = this.filterByLevel(estatData.values, level, parentCode);
    
    // 2. RankingDataPointに変換
    const dataPoints = filteredValues.map((value) => {
      const areaCode = value.dimensions.area.code;
      const areaType = getAreaType(areaCode);
      
      return {
        areaCode,
        areaName: value.dimensions.area.name,
        areaType,
        parentAreaCode:
          areaType === "municipality"
            ? getParentPrefectureCode(areaCode)
            : undefined,
        parentAreaName: undefined, // 後で設定
        value: value.value,
        rawValue: value.value,
        displayValue: undefined, // 後でフォーマット
        rank: 0, // 後で計算
        rankInParent: undefined, // 後で計算
        percentile: undefined, // 後で計算
        timeCode: value.dimensions.time.code,
        timeName: value.dimensions.time.name,
        dataQuality: undefined, // 後で評価
      };
    });
    
    console.log(`✅ Transformer: 変換完了 (${dataPoints.length}件)`);
    return dataPoints;
  }
  
  /**
   * レベルでフィルタリング
   */
  private filterByLevel(
    values: any[],
    level: TargetAreaLevel,
    parentCode?: string
  ): any[] {
    return values.filter((value) => {
      const areaCode = value.dimensions.area.code;
      const areaType = getAreaType(areaCode);
      
      // 都道府県レベル
      if (level === "prefecture") {
        return areaType === "prefecture";
      }
      
      // 市区町村レベル
      if (level === "municipality") {
        if (areaType !== "municipality") return false;
        
        // 特定都道府県内のみ
        if (parentCode) {
          const prefCode = getParentPrefectureCode(areaCode);
          return prefCode === parentCode;
        }
        
        return true;
      }
      
      return false;
    });
  }
}
```

---

## データフロー

### 全体フロー

```
┌─────────────────┐
│  User Request   │
│  /api/ranking/  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   RankingDataService                │
│   (rankingドメインのエントリポイント) │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   RankingAdapterRegistry            │
│   アダプター選択・取得               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   EstatRankingAdapter               │
│   ┌───────────────────────────────┐ │
│   │ 1. EstatStatsDataFetcher     │ │ ← estat-apiドメイン
│   │    - API呼び出し              │ │
│   │    - FormattedEstatData取得  │ │
│   │                               │ │
│   │ 2. EstatTransformer          │ │
│   │    - データ変換               │ │
│   │    - RankingDataPoint[]生成  │ │
│   │                               │ │
│   │ 3. RankingCalculator         │ │
│   │    - ランキング計算           │ │
│   │    - 順位・パーセンタイル     │ │
│   │                               │ │
│   │ 4. StatisticsCalculator      │ │
│   │    - 統計計算                │ │
│   │    - 平均・中央値・標準偏差  │ │
│   │                               │ │
│   │ 5. QualityAssessor           │ │
│   │    - データ品質評価          │ │
│   │    - 完全性・信頼性          │ │
│   │                               │ │
│   │ 6. UnifiedRankingData構築    │ │
│   └───────────────────────────────┘ │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   RankingR2Service                  │
│   R2ストレージに保存                 │
└─────────────────────────────────────┘
```

### シーケンス図

```
Client         RankingDataService    AdapterRegistry    EstatAdapter    estatAPI    RankingCalculator
  │                    │                    │                 │             │              │
  │ getRanking()       │                    │                 │             │              │
  │───────────────────>│                    │                 │             │              │
  │                    │                    │                 │             │              │
  │                    │ getAdapter("estat")│                 │             │              │
  │                    │───────────────────>│                 │             │              │
  │                    │<───────────────────│                 │             │              │
  │                    │   EstatAdapter     │                 │             │              │
  │                    │                    │                 │             │              │
  │                    │ fetchAndTransform()│                 │             │              │
  │                    │────────────────────────────────────>│             │              │
  │                    │                    │                 │             │              │
  │                    │                    │                 │ fetch()     │              │
  │                    │                    │                 │────────────>│              │
  │                    │                    │                 │<────────────│              │
  │                    │                    │                 │ FormattedData              │
  │                    │                    │                 │             │              │
  │                    │                    │                 │ transform() │              │
  │                    │                    │                 │─ ─ ─ ─ ─ ─>│              │
  │                    │                    │                 │<─ ─ ─ ─ ─ ─│              │
  │                    │                    │                 │ DataPoints  │              │
  │                    │                    │                 │             │              │
  │                    │                    │                 │ calculate() │              │
  │                    │                    │                 │─────────────────────────>│
  │                    │                    │                 │<─────────────────────────│
  │                    │                    │                 │ RankedData  │              │
  │                    │                    │                 │             │              │
  │                    │<────────────────────────────────────│             │              │
  │                    │   UnifiedRankingData                 │             │              │
  │<───────────────────│                    │                 │             │              │
```

---

## 実装ガイド

### Phase 1: 基盤実装（2日）

#### Day 1: インターフェースと型定義

1. **型定義作成**

```typescript
// src/types/ranking/adapters.ts

export * from "./adapter-interface";
export * from "./adapter-registry";

export interface AdapterConfig {
  sourceId: string;
  enabled: boolean;
  config: Record<string, unknown>;
}
```

2. **アダプターインターフェース作成**

```bash
# ファイル作成
mkdir -p src/lib/ranking/adapters/base
touch src/lib/ranking/adapters/base/adapter-interface.ts
touch src/lib/ranking/adapters/base/adapter-registry.ts
touch src/lib/ranking/adapters/base/index.ts
```

#### Day 2: ユーティリティ実装

1. **地域コードユーティリティ**

```typescript
// src/lib/ranking/utils/area-code-utils.ts

export function getAreaType(areaCode: string): AreaType {
  if (areaCode === "00000") return "country";
  if (areaCode.endsWith("000")) return "prefecture";
  return "municipality";
}

export function getParentPrefectureCode(areaCode: string): string {
  return areaCode.substring(0, 2) + "000";
}

export function validateAreaCode(areaCode: string): boolean {
  if (!/^\d{5,6}$/.test(areaCode)) return false;
  const prefCode = parseInt(areaCode.substring(0, 2));
  return prefCode >= 1 && prefCode <= 47;
}
```

### Phase 2: e-Statアダプター実装（3日）

#### Day 3-4: Transformer実装

```bash
mkdir -p src/lib/ranking/adapters/estat
touch src/lib/ranking/adapters/estat/estat-adapter.ts
touch src/lib/ranking/adapters/estat/estat-transformer.ts
touch src/lib/ranking/adapters/estat/index.ts
```

#### Day 5: Calculator実装

```bash
mkdir -p src/lib/ranking/calculators
touch src/lib/ranking/calculators/ranking-calculator.ts
touch src/lib/ranking/calculators/statistics-calculator.ts
touch src/lib/ranking/calculators/quality-assessor.ts
touch src/lib/ranking/calculators/index.ts
```

### Phase 3: 統合とテスト（2日）

#### Day 6: RankingDataServiceとの統合

```typescript
// src/lib/ranking/services/RankingDataService.ts

import { RankingAdapterRegistry } from "../adapters/base/adapter-registry";

export class RankingDataService {
  async getRankingData(
    rankingKey: string,
    timeCode: string,
    level: TargetAreaLevel,
    sourceId: string = "estat"
  ): Promise<UnifiedRankingData> {
    // 1. アダプター取得
    const adapter = RankingAdapterRegistry.getAdapter(sourceId);
    if (!adapter) {
      throw new Error(`Adapter not found: ${sourceId}`);
    }
    
    // 2. データ取得・変換
    const data = await adapter.fetchAndTransform({
      rankingKey,
      timeCode,
      level,
      sourceSpecific: {
        // データソース固有パラメータ
      },
    });
    
    // 3. R2に保存
    await this.r2Service.saveRankingData(data, level);
    
    return data;
  }
}
```

#### Day 7: テスト作成

```typescript
// src/lib/ranking/adapters/estat/__tests__/estat-adapter.test.ts

describe("EstatRankingAdapter", () => {
  it("should transform estat data to ranking format", async () => {
    const adapter = new EstatRankingAdapter();
    const result = await adapter.fetchAndTransform({
      rankingKey: "population",
      timeCode: "2023",
      level: "prefecture",
      sourceSpecific: {
        statsDataId: "0003448237",
        categoryCode: "A1101",
      },
    });
    
    expect(result.values).toHaveLength(47);
    expect(result.metadata.dataSourceId).toBe("estat");
  });
});
```

---

## テスト戦略

### ユニットテスト

```typescript
// Transformer単体テスト
describe("EstatTransformer", () => {
  it("should filter by prefecture level", () => {
    const transformer = new EstatTransformer();
    // テスト実装
  });
  
  it("should filter by municipality level with parentCode", () => {
    // テスト実装
  });
});

// Calculator単体テスト
describe("RankingCalculator", () => {
  it("should calculate rankings correctly", () => {
    // テスト実装
  });
  
  it("should calculate rankings within parent", () => {
    // テスト実装
  });
});
```

### 統合テスト

```typescript
// アダプター統合テスト
describe("EstatRankingAdapter Integration", () => {
  it("should fetch and transform real data", async () => {
    const adapter = new EstatRankingAdapter();
    const result = await adapter.fetchAndTransform({
      // 実際のパラメータ
    });
    
    expect(result).toBeDefined();
    expect(result.values.length).toBeGreaterThan(0);
  });
});
```

---

## まとめ

### libディレクトリ構成のポイント

1. **明確な責任分離**: 各ディレクトリは単一の責任を持つ
2. **拡張性**: 新しいデータソース追加が容易
3. **テスタビリティ**: 各レイヤーが独立してテスト可能
4. **保守性**: 変換ロジックが一箇所に集約

### 実装の優先順位

1. **Phase 1**: 基盤（インターフェース、型定義）
2. **Phase 2**: e-Statアダプター（最も重要）
3. **Phase 3**: 統合とテスト

### 将来の拡張

- RESASアダプター追加
- カスタムデータアダプター追加
- キャッシュレイヤーの実装

---

## 関連ドキュメント

- [R2ハイブリッドアーキテクチャ設計書](r2-hybrid-architecture.md)
- [実装計画書](r2-hybrid-implementation-plan.md)

---

**更新履歴**:
- 2025-10-16: 初版作成

