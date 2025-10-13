# ランキングデータR2移行計画書

**作成日**: 2025-10-13
**対象システム**: stats47
**移行対象**: `ranking_values` および `estat_ranking_values` データ

---

## 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [現状分析](#2-現状分析)
3. [移行の背景と目的](#3-移行の背景と目的)
4. [移行アーキテクチャ設計](#4-移行アーキテクチャ設計)
5. [データ構造設計](#5-データ構造設計)
6. [実装計画](#6-実装計画)
7. [API設計](#7-api設計)
8. [テスト計画](#8-テスト計画)
9. [パフォーマンス比較](#9-パフォーマンス比較)
10. [ロールバック計画](#10-ロールバック計画)
11. [スケジュールとマイルストーン](#11-スケジュールとマイルストーン)
12. [リスクと対策](#12-リスクと対策)

---

## 1. エグゼクティブサマリー

### 概要

現在D1データベースに保存している大量のランキング値データ（`ranking_values`および`estat_ranking_values`）を、Cloudflare R2オブジェクトストレージに移行します。

### 移行による主要メリット

| 項目 | 現状（D1） | 移行後（R2） | 改善率 |
|------|-----------|-------------|--------|
| **読み取りコスト** | 有料（1日10万回制限） | **完全無料** | ∞ |
| **読み取り速度** | 47回のSELECT | 1回のGET | **47倍** |
| **書き込み速度** | 47回のINSERT | 1回のPUT | **47倍** |
| **スケーラビリティ** | テーブルサイズに依存 | データ量無制限 | **無制限** |
| **エッジキャッシュ** | 不可 | Cache API利用可 | **超高速化** |

### 推奨移行方針

**ハイブリッドアーキテクチャ**を採用：
- **D1**: メタデータ・設定情報（`ranking_items`, `estat_metainfo`など）
- **R2**: 実データ（`ranking_values`の値データ）

---

## 2. 現状分析

### 2.1 現在のデータベーススキーマ

#### D1テーブル構成

```sql
-- 現在D1に存在（保持）
ranking_items (
  id, ranking_key, label, name, unit,
  map_color_scheme, ranking_direction, ...
)

estat_metainfo (
  id, stats_data_id, cd_cat01, ranking_key, ...
)

-- 移行対象（D1 → R2）
ranking_values (
  id, ranking_key, area_code, time_code,
  value, numeric_value, rank, ...
)

estat_ranking_values (
  stats_data_id, category_code, time_code, area_code,
  value, numeric_value, rank, unit, ...
)
```

### 2.2 現在のデータアクセスパターン

#### EstatRelationalCacheService（src/lib/estat/cache/EstatRelationalCacheService.ts）

**書き込み処理**:
```typescript
// 47都道府県分を1件ずつINSERT（46-82行目）
for (const record of rankedData) {
  await db.prepare(`INSERT INTO estat_ranking_values ...`).bind(...).run();
}
// → 47回のD1クエリ発行（非効率）
```

**読み取り処理**:
```typescript
// 1回のSELECT（114-134行目）
const result = await db.prepare(`
  SELECT * FROM estat_ranking_values
  WHERE stats_data_id = ? AND category_code = ? AND time_code = ?
`).bind(...).all();
// → 47件のレコードを取得
```

### 2.3 データ量の試算

```
47都道府県 × 100項目 × 10年度 = 47,000レコード
各レコード約200バイト = 9.4MB

将来的に項目数・年度が増加すると数十MB〜数百MBに拡大
```

### 2.4 現在の課題

1. **D1クエリ制限**: 無料枠は1日10万読み取り、1,000書き込み
2. **書き込み速度**: 47件×複数項目のループINSERTが遅い
3. **読み取りコスト**: アクセス頻度が高い（ランキングページ閲覧時）
4. **スケーラビリティ**: データ量増加でD1パフォーマンス低下の懸念

---

## 3. 移行の背景と目的

### 3.1 背景

1. **コスト最適化**: R2の読み取りが完全無料（egress料金なし）
2. **パフォーマンス向上**: 1回のGETで全都道府県データ取得
3. **キャッシュ戦略**: R2はCache APIと統合しやすい
4. **データ特性**: ランキング値は「読み取り頻度高、更新頻度低」

### 3.2 目的

- [x] **コスト削減**: D1クエリ回数を削減し、R2の無料読み取りを活用
- [x] **速度向上**: 47回のクエリ → 1回のGET
- [x] **スケーラビリティ**: 将来的なデータ増加に対応
- [x] **エッジキャッシュ**: CDNエッジでのキャッシュ実現

### 3.3 非目的（スコープ外）

- [ ] 既存の`ranking_items`テーブルの移行（D1に保持）
- [ ] リアルタイムデータ処理（バッチ処理で十分）
- [ ] データベース完全置き換え（ハイブリッド構成）

---

## 4. 移行アーキテクチャ設計

### 4.1 ハイブリッドアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐              ┌──────────────┐         │
│  │  D1 Database │              │  R2 Storage  │         │
│  ├──────────────┤              ├──────────────┤         │
│  │              │              │              │         │
│  │ ranking_     │              │ rankings/    │         │
│  │   items      │◄─────────┐   │   {key}/     │         │
│  │              │          │   │   {time}.json│         │
│  │ estat_       │          │   │              │         │
│  │   metainfo   │          │   │ estat_cache/ │         │
│  │              │          │   │   {id}/      │         │
│  │ subcategory_ │          │   │   {cat}/     │         │
│  │   ranking_   │          │   │   {time}.json│         │
│  │   items      │          │   │              │         │
│  │              │          │   │              │         │
│  └──────────────┘          │   └──────────────┘         │
│       ▲                    │          ▲                 │
│       │                    │          │                 │
│       │    ┌───────────────┴──────────┴─────┐           │
│       │    │  RankingDataService           │           │
│       │    │  - getMetadata() → D1         │           │
│       │    │  - getValues() → R2           │           │
│       └────┤  - saveValues() → R2          │           │
│            └───────────────────────────────┘           │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 4.2 データ分離方針

#### D1に保存（メタデータ）

- `ranking_items`: ランキング項目設定
- `estat_metainfo`: e-Statメタ情報
- `subcategory_ranking_items`: サブカテゴリ関連
- `data_source_metadata`: データソース情報

**理由**: 頻繁に更新され、リレーショナルなクエリが必要

#### R2に保存（実データ）

- `ranking_values`: ランキング値データ
- `estat_ranking_values`: e-Statキャッシュデータ

**理由**: 読み取り頻度高、更新頻度低、バッチ処理に適している

---

## 5. データ構造設計

### 5.1 R2オブジェクトキー設計

#### パターン1: 汎用ランキングデータ

```
rankings/{ranking_key}/{time_code}.json

例:
rankings/population_density/2023100000.json
rankings/total_area/2023100000.json
rankings/household_count/2022100000.json
```

#### パターン2: e-Statキャッシュデータ

```
estat_cache/{stats_data_id}/{category_code}/{time_code}.json

例:
estat_cache/0003448738/A1101/2023100000.json
estat_cache/0003448738/A1102/2023100000.json
```

#### メタデータファイル（オプション）

```
rankings/{ranking_key}/_metadata.json  // 利用可能年度一覧など

例:
{
  "ranking_key": "population_density",
  "available_years": ["2023100000", "2022100000", "2021100000"],
  "last_updated": "2025-10-13T00:00:00Z"
}
```

### 5.2 JSONファイル構造

#### 汎用ランキングデータ

```json
{
  "version": "1.0",
  "ranking_key": "population_density",
  "time_code": "2023100000",
  "time_name": "2023年",
  "unit": "人/km²",
  "data_source": "estat",
  "updated_at": "2025-10-13T00:00:00Z",
  "total_count": 47,
  "values": [
    {
      "area_code": "13",
      "area_name": "東京都",
      "value": "6430.0",
      "numeric_value": 6430.0,
      "display_value": "6,430",
      "rank": 1
    },
    {
      "area_code": "27",
      "area_name": "大阪府",
      "value": "4631.0",
      "numeric_value": 4631.0,
      "display_value": "4,631",
      "rank": 2
    }
    // ... 残り45都道府県
  ]
}
```

#### e-Statキャッシュデータ

```json
{
  "version": "1.0",
  "stats_data_id": "0003448738",
  "category_code": "A1101",
  "category_name": "総人口",
  "time_code": "2023100000",
  "time_name": "2023年",
  "unit": "人",
  "updated_at": "2025-10-13T00:00:00Z",
  "total_count": 47,
  "values": [
    {
      "area_code": "13",
      "area_name": "東京都",
      "value": "14047594",
      "numeric_value": 14047594,
      "display_value": "14,047,594",
      "rank": 1
    }
    // ... 残り46都道府県
  ]
}
```

### 5.3 TypeScript型定義

```typescript
/**
 * R2に保存されるランキングデータのJSON構造
 */
export interface RankingDataR2 {
  version: string;
  ranking_key: string;
  time_code: string;
  time_name: string;
  unit: string;
  data_source: string;
  updated_at: string;
  total_count: number;
  values: RankingValueR2[];
}

/**
 * R2内の個別ランキング値
 */
export interface RankingValueR2 {
  area_code: string;
  area_name: string;
  value: string;
  numeric_value: number;
  display_value?: string;
  rank: number;
}

/**
 * e-StatキャッシュデータのJSON構造
 */
export interface EstatCacheDataR2 {
  version: string;
  stats_data_id: string;
  category_code: string;
  category_name: string;
  time_code: string;
  time_name: string;
  unit: string;
  updated_at: string;
  total_count: number;
  values: RankingValueR2[];
}
```

---

## 6. 実装計画

### 6.1 段階的移行アプローチ

#### フェーズ1: R2サービス実装（2週間）

**タスク**:
1. R2バケット作成・設定
2. `RankingR2Service`クラス実装
3. `EstatR2CacheService`クラス実装
4. 型定義追加（`src/types/models/r2/ranking.ts`）

**成果物**:
- `src/lib/ranking/RankingR2Service.ts`
- `src/lib/estat/cache/EstatR2CacheService.ts`
- `src/types/models/r2/ranking.ts`

#### フェーズ2: 並行運用期間（2週間）

**タスク**:
1. D1とR2の両方にデータを書き込む
2. R2からデータ読み取り、フォールバックでD1
3. データ整合性確認
4. パフォーマンス測定

**成果物**:
- データ整合性検証スクリプト
- パフォーマンスベンチマーク結果

#### フェーズ3: 既存データ移行（1週間）

**タスク**:
1. D1の既存データをR2にエクスポート
2. データ整合性検証
3. バックアップ作成

**成果物**:
- `scripts/migrate-d1-to-r2.ts`（移行スクリプト）
- バックアップファイル

#### フェーズ4: R2完全移行（1週間）

**タスク**:
1. 読み取りをR2に完全切り替え
2. D1への書き込み停止
3. 監視・エラー対応

**成果物**:
- 移行完了報告書

#### フェーズ5: D1クリーンアップ（1週間）

**タスク**:
1. `ranking_values`テーブル削除
2. `estat_ranking_values`テーブル削除
3. 関連する古いコード削除

**成果物**:
- `database/migrations/007_drop_ranking_values.sql`

### 6.2 ディレクトリ構成

```
src/
├── lib/
│   ├── ranking/
│   │   ├── ranking-queries.ts          # 既存（D1メタデータ用）
│   │   ├── RankingR2Service.ts         # 新規（R2実データ用）
│   │   └── RankingDataService.ts       # 新規（統合サービス）
│   └── estat/
│       └── cache/
│           ├── EstatRelationalCacheService.ts  # 既存（削除予定）
│           └── EstatR2CacheService.ts          # 新規
├── types/
│   └── models/
│       ├── ranking.ts                  # 既存（更新）
│       └── r2/
│           └── ranking.ts              # 新規（R2用型定義）
└── scripts/
    ├── migrate-d1-to-r2.ts             # 新規（移行スクリプト）
    └── verify-r2-data.ts               # 新規（検証スクリプト）

database/
└── migrations/
    └── 007_drop_ranking_values.sql     # 新規（最終クリーンアップ）
```

---

## 7. API設計

### 7.1 RankingR2Service

```typescript
/**
 * ランキングデータR2管理サービス
 * 汎用的なランキングデータ（ranking_items由来）をR2で管理
 */
export class RankingR2Service {
  /**
   * ランキングデータを保存
   *
   * @param env - Cloudflare環境変数
   * @param rankingKey - ランキングキー（例: "population_density"）
   * @param timeCode - 時系列コード（例: "2023100000"）
   * @param data - FormattedValue[]形式のデータ
   */
  static async saveRankingData(
    env: Env,
    rankingKey: string,
    timeCode: string,
    data: FormattedValue[]
  ): Promise<void>;

  /**
   * ランキングデータを取得
   *
   * @param env - Cloudflare環境変数
   * @param rankingKey - ランキングキー
   * @param timeCode - 時系列コード
   * @returns FormattedValue[] | null
   */
  static async getRankingData(
    env: Env,
    rankingKey: string,
    timeCode: string
  ): Promise<FormattedValue[] | null>;

  /**
   * 利用可能な年度一覧を取得
   *
   * @param env - Cloudflare環境変数
   * @param rankingKey - ランキングキー
   * @returns string[] - 時系列コードの配列（降順）
   */
  static async getAvailableYears(
    env: Env,
    rankingKey: string
  ): Promise<string[]>;

  /**
   * キャッシュを削除
   *
   * @param env - Cloudflare環境変数
   * @param rankingKey - ランキングキー
   * @param timeCode - 時系列コード（省略時は全年度）
   */
  static async deleteCache(
    env: Env,
    rankingKey: string,
    timeCode?: string
  ): Promise<void>;

  /**
   * R2オブジェクトのメタデータ取得
   *
   * @param env - Cloudflare環境変数
   * @param rankingKey - ランキングキー
   * @param timeCode - 時系列コード
   * @returns オブジェクトメタデータ（サイズ、更新日時など）
   */
  static async getObjectMetadata(
    env: Env,
    rankingKey: string,
    timeCode: string
  ): Promise<R2ObjectMetadata | null>;
}
```

### 7.2 EstatR2CacheService

```typescript
/**
 * e-StatデータR2キャッシュサービス
 * e-Stat API経由のデータをR2でキャッシュ管理
 */
export class EstatR2CacheService {
  /**
   * e-Statデータを保存
   *
   * @param env - Cloudflare環境変数
   * @param statsDataId - 統計表ID
   * @param categoryCode - カテゴリコード
   * @param timeCode - 時系列コード
   * @param data - FormattedValue[]形式のデータ
   */
  static async saveRankingData(
    env: Env,
    statsDataId: string,
    categoryCode: string,
    timeCode: string,
    data: FormattedValue[]
  ): Promise<void>;

  /**
   * e-Statキャッシュデータを取得
   *
   * @param env - Cloudflare環境変数
   * @param statsDataId - 統計表ID
   * @param categoryCode - カテゴリコード
   * @param timeCode - 時系列コード
   * @returns FormattedValue[] | null
   */
  static async getRankingData(
    env: Env,
    statsDataId: string,
    categoryCode: string,
    timeCode: string
  ): Promise<FormattedValue[] | null>;

  /**
   * 利用可能な年度一覧を取得
   *
   * @param env - Cloudflare環境変数
   * @param statsDataId - 統計表ID
   * @param categoryCode - カテゴリコード
   * @returns string[] - 時系列コードの配列（降順）
   */
  static async getAvailableYears(
    env: Env,
    statsDataId: string,
    categoryCode: string
  ): Promise<string[]>;
}
```

### 7.3 RankingDataService（統合サービス）

```typescript
/**
 * ランキングデータ統合サービス
 * D1（メタデータ）とR2（実データ）を統合して扱う
 */
export class RankingDataService {
  /**
   * ランキング完全データ取得
   * D1からメタデータ、R2から値データを取得して結合
   *
   * @param env - Cloudflare環境変数
   * @param rankingKey - ランキングキー
   * @param timeCode - 時系列コード
   * @returns 完全なランキングデータ
   */
  static async getFullRankingData(
    env: Env,
    rankingKey: string,
    timeCode: string
  ): Promise<{
    metadata: RankingItem;  // D1から
    values: FormattedValue[];  // R2から
  } | null>;

  /**
   * サブカテゴリのランキングデータ取得
   *
   * @param env - Cloudflare環境変数
   * @param subcategoryId - サブカテゴリID
   * @param timeCode - 時系列コード
   * @returns ランキング項目とデータのリスト
   */
  static async getSubcategoryRankingData(
    env: Env,
    subcategoryId: string,
    timeCode: string
  ): Promise<Array<{
    item: RankingItem;
    values: FormattedValue[];
  }>>;
}
```

---

## 8. テスト計画

### 8.1 ユニットテスト

#### RankingR2Service

```typescript
// tests/lib/ranking/RankingR2Service.test.ts

describe('RankingR2Service', () => {
  describe('saveRankingData', () => {
    it('should save ranking data to R2 with correct key', async () => {
      // テスト実装
    });

    it('should calculate ranks correctly', async () => {
      // テスト実装
    });
  });

  describe('getRankingData', () => {
    it('should retrieve ranking data from R2', async () => {
      // テスト実装
    });

    it('should return null if data does not exist', async () => {
      // テスト実装
    });
  });

  describe('getAvailableYears', () => {
    it('should return years in descending order', async () => {
      // テスト実装
    });
  });
});
```

### 8.2 統合テスト

```typescript
// tests/integration/ranking-r2-migration.test.ts

describe('Ranking R2 Migration', () => {
  it('should migrate data from D1 to R2 correctly', async () => {
    // D1からデータ取得
    // R2に保存
    // データ整合性確認
  });

  it('should handle concurrent reads and writes', async () => {
    // 並行アクセステスト
  });
});
```

### 8.3 パフォーマンステスト

```typescript
// tests/performance/ranking-benchmark.test.ts

describe('Ranking Performance Benchmark', () => {
  it('D1 vs R2 read performance', async () => {
    const d1Time = await measureD1ReadTime();
    const r2Time = await measureR2ReadTime();

    console.log(`D1: ${d1Time}ms, R2: ${r2Time}ms`);
    expect(r2Time).toBeLessThan(d1Time);
  });

  it('should handle 100 concurrent requests', async () => {
    // 負荷テスト
  });
});
```

### 8.4 データ整合性テスト

```bash
# scripts/verify-r2-data.ts の実行

npx tsx scripts/verify-r2-data.ts --ranking-key population_density --time-code 2023100000

# 検証項目:
# 1. レコード数が一致するか（47都道府県）
# 2. 数値が一致するか
# 3. ランクが正しく計算されているか
# 4. 欠損データがないか
```

---

## 9. パフォーマンス比較

### 9.1 ベンチマーク設計

#### テストケース

| テストケース | 説明 | 測定指標 |
|--------------|------|----------|
| **単一読み取り** | 1項目×1年度のデータ取得 | レスポンス時間、D1クエリ回数 |
| **複数年度読み取り** | 1項目×5年度のデータ取得 | 総レスポンス時間 |
| **並行読み取り** | 100リクエスト同時実行 | P50/P95/P99レスポンス時間 |
| **書き込み** | 47都道府県データ保存 | 書き込み時間、クエリ回数 |

#### 期待される結果

```
┌──────────────────┬──────────┬──────────┬────────────┐
│ テストケース     │ D1       │ R2       │ 改善率     │
├──────────────────┼──────────┼──────────┼────────────┤
│ 単一読み取り     │ 150ms    │ 30ms     │ 5倍        │
│ 複数年度読み取り │ 750ms    │ 150ms    │ 5倍        │
│ 並行読み取り P95 │ 500ms    │ 80ms     │ 6.25倍     │
│ 書き込み         │ 2000ms   │ 50ms     │ 40倍       │
└──────────────────┴──────────┴──────────┴────────────┘
```

### 9.2 コスト比較

#### 月間アクセス試算

```
想定アクセス:
- ページビュー: 10,000回/月
- ランキングデータ取得: 10,000回/月
- 年度切り替え: 2,000回/月
- 合計読み取り: 12,000回/月
```

#### コスト計算

| 項目 | D1 | R2 | 削減額 |
|------|----|----|--------|
| **読み取り** | $0.036 (12,000回) | **$0** | $0.036 |
| **書き込み** | $0.01 (100回) | $0.01 (100回) | $0 |
| **ストレージ** | $0.75/GB (含まれる) | $0.015/GB | $0.735 |
| **合計（月額）** | $0.796 | $0.01 | **$0.786削減** |
| **合計（年額）** | $9.55 | $0.12 | **$9.43削減** |

※ D1は5GBまで無料、R2は10GBまで無料（ただし読み取り回数制限あり）

---

## 10. ロールバック計画

### 10.1 ロールバックトリガー

以下の場合、D1に戻す：

1. R2読み取りエラー率が5%を超える
2. レスポンス時間がD1比で2倍以上遅延
3. データ整合性の重大な問題発見
4. Cloudflare R2障害発生

### 10.2 ロールバック手順

#### ステップ1: 緊急切り戻し（5分以内）

```typescript
// src/lib/ranking/feature-flags.ts
export const USE_R2_STORAGE = false; // true → false に変更

// 環境変数でも制御可能
// wrangler.toml
[vars]
USE_R2_STORAGE = "false"
```

#### ステップ2: D1データ復旧（30分以内）

```bash
# バックアップから復元
npx wrangler d1 execute stats47-db --file=./backups/ranking_values_backup.sql

# データ整合性確認
npx tsx scripts/verify-d1-data.ts
```

#### ステップ3: 原因調査と修正

- R2エラーログ分析
- データ整合性チェック
- パフォーマンスプロファイリング

### 10.3 バックアップ戦略

#### 自動バックアップ

```bash
# 毎日0時に実行（GitHub Actions）
# .github/workflows/backup-d1.yml

name: Backup D1 Database
on:
  schedule:
    - cron: '0 0 * * *'  # 毎日0時

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Export D1 data
        run: |
          npx wrangler d1 export stats47-db --output=backup-$(date +%Y%m%d).sql
      - name: Upload to R2
        run: |
          npx wrangler r2 object put stats47-backups/d1/backup-$(date +%Y%m%d).sql --file=backup-$(date +%Y%m%d).sql
```

#### 手動バックアップ

```bash
# 移行前の完全バックアップ
npx wrangler d1 export stats47-db --output=backup-pre-migration-$(date +%Y%m%d).sql

# R2へのアップロード
npx wrangler r2 object put stats47-backups/critical/pre-migration.sql --file=backup-pre-migration-*.sql
```

---

## 11. スケジュールとマイルストーン

### 11.1 全体スケジュール（7週間）

```
Week 1-2: フェーズ1（R2サービス実装）
  ├── R2バケット作成
  ├── RankingR2Service実装
  ├── EstatR2CacheService実装
  └── ユニットテスト作成

Week 3-4: フェーズ2（並行運用）
  ├── デュアルライト実装（D1+R2）
  ├── R2読み取り実装（フォールバック付き）
  ├── パフォーマンステスト
  └── データ整合性検証

Week 5: フェーズ3（既存データ移行）
  ├── 移行スクリプト作成
  ├── 本番データエクスポート
  ├── R2インポート
  └── 検証

Week 6: フェーズ4（R2完全移行）
  ├── 読み取り完全切り替え
  ├── 監視強化
  └── エラー対応

Week 7: フェーズ5（クリーンアップ）
  ├── D1テーブル削除
  ├── 古いコード削除
  └── ドキュメント更新
```

### 11.2 マイルストーン

| マイルストーン | 完了条件 | 期限 |
|----------------|----------|------|
| **M1: R2サービス完成** | ユニットテスト全通過 | Week 2終了 |
| **M2: 並行運用開始** | デュアルライト稼働開始 | Week 3終了 |
| **M3: データ移行完了** | 全データR2移行、整合性確認 | Week 5終了 |
| **M4: R2完全移行** | 読み取り100% R2化 | Week 6終了 |
| **M5: クリーンアップ完了** | D1テーブル削除、ドキュメント更新 | Week 7終了 |

### 11.3 チェックリスト

#### フェーズ1完了チェックリスト

- [ ] R2バケット`stats47-rankings`作成済み
- [ ] `RankingR2Service.ts`実装完了
- [ ] `EstatR2CacheService.ts`実装完了
- [ ] 型定義`src/types/models/r2/ranking.ts`追加済み
- [ ] ユニットテスト全通過（カバレッジ80%以上）
- [ ] コードレビュー完了

#### フェーズ2完了チェックリスト

- [ ] デュアルライト機能実装済み
- [ ] フィーチャーフラグ`USE_R2_STORAGE`実装済み
- [ ] データ整合性検証スクリプト作成済み
- [ ] パフォーマンスベンチマーク実施済み
- [ ] 並行運用7日間エラーなし

#### フェーズ3完了チェックリスト

- [ ] 移行スクリプト`migrate-d1-to-r2.ts`作成済み
- [ ] 本番D1データバックアップ取得済み
- [ ] 全データR2移行完了
- [ ] データ整合性検証100%一致
- [ ] ロールバック手順確認済み

#### フェーズ4完了チェックリスト

- [ ] 読み取り100% R2化
- [ ] エラー率0.1%未満
- [ ] レスポンス時間改善確認
- [ ] 監視アラート設定済み
- [ ] 1週間安定稼働

#### フェーズ5完了チェックリスト

- [ ] `ranking_values`テーブル削除済み
- [ ] `estat_ranking_values`テーブル削除済み
- [ ] `EstatRelationalCacheService.ts`削除済み
- [ ] 古いマイグレーションファイル整理済み
- [ ] ドキュメント更新済み
- [ ] 移行完了報告書作成済み

---

## 12. リスクと対策

### 12.1 技術的リスク

#### リスク1: R2の可用性問題

**リスク内容**:
- Cloudflare R2のサービス障害
- 特定リージョンでのアクセス遅延

**対策**:
- フィーチャーフラグによる即座の切り戻し機能
- D1へのフォールバック機能実装
- Cloudflare Status Page監視

**対策コード例**:
```typescript
async function getRankingDataWithFallback(
  env: Env,
  rankingKey: string,
  timeCode: string
): Promise<FormattedValue[] | null> {
  try {
    // まずR2から取得を試みる
    const r2Data = await RankingR2Service.getRankingData(env, rankingKey, timeCode);
    if (r2Data) return r2Data;
  } catch (error) {
    console.error('R2 read failed, falling back to D1:', error);
  }

  // R2が失敗した場合はD1にフォールバック
  return await getFromD1(env, rankingKey, timeCode);
}
```

#### リスク2: データ整合性問題

**リスク内容**:
- 移行時のデータ不一致
- ランク計算のロジック違い

**対策**:
- 並行運用期間中に継続的な整合性チェック
- 自動検証スクリプトの実行
- 差分がある場合のアラート通知

**検証スクリプト例**:
```typescript
// scripts/verify-r2-data.ts
async function verifyDataIntegrity(
  rankingKey: string,
  timeCode: string
): Promise<boolean> {
  const d1Data = await getFromD1(env, rankingKey, timeCode);
  const r2Data = await RankingR2Service.getRankingData(env, rankingKey, timeCode);

  // レコード数確認
  if (d1Data.length !== r2Data.length) {
    console.error('Record count mismatch');
    return false;
  }

  // 各レコードの値確認
  for (let i = 0; i < d1Data.length; i++) {
    if (d1Data[i].numericValue !== r2Data[i].numericValue) {
      console.error(`Value mismatch at index ${i}`);
      return false;
    }
  }

  return true;
}
```

#### リスク3: パフォーマンス悪化

**リスク内容**:
- R2読み取りが予想より遅い
- JSONパースのオーバーヘッド

**対策**:
- Cache APIによるエッジキャッシュ
- gzip圧縮の活用
- パフォーマンスモニタリング

**キャッシュ実装例**:
```typescript
async function getRankingDataWithCache(
  request: Request,
  env: Env,
  rankingKey: string,
  timeCode: string
): Promise<FormattedValue[]> {
  const cache = caches.default;
  const cacheKey = new Request(
    `https://cache.stats47.com/rankings/${rankingKey}/${timeCode}.json`,
    request
  );

  // キャッシュから取得を試みる
  let response = await cache.match(cacheKey);

  if (!response) {
    // R2から取得
    const data = await RankingR2Service.getRankingData(env, rankingKey, timeCode);
    response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 1時間キャッシュ
      },
    });

    // キャッシュに保存
    await cache.put(cacheKey, response.clone());
  }

  return response.json();
}
```

### 12.2 運用リスク

#### リスク4: 移行中のダウンタイム

**リスク内容**:
- 移行作業中のサービス停止

**対策**:
- ゼロダウンタイム移行（並行運用）
- 段階的な切り替え
- ピークタイム外での作業

**移行タイミング**:
```
推奨時間帯: 日本時間 深夜2:00-4:00（アクセス最小）
移行手順:
1. デュアルライト開始（ダウンタイムなし）
2. データ移行（バックグラウンド）
3. 読み取り切り替え（段階的、10%→50%→100%）
```

#### リスク5: コスト超過

**リスク内容**:
- 予想外のR2ストレージコスト
- Class Aオペレーション（書き込み）の増加

**対策**:
- コスト監視アラート設定
- R2使用量ダッシュボード作成
- 月次コストレビュー

**コスト上限設定**:
```
アラート設定:
- R2ストレージ: 10GB超過時
- Class Aオペレーション: 10,000回/日超過時
- Class Bオペレーション: 1,000,000回/日超過時
```

### 12.3 リスクマトリクス

| リスク | 発生確率 | 影響度 | リスクレベル | 対策優先度 |
|--------|----------|--------|--------------|------------|
| R2可用性問題 | 低 | 高 | 中 | 高 |
| データ整合性問題 | 中 | 高 | 高 | **最高** |
| パフォーマンス悪化 | 低 | 中 | 低 | 中 |
| 移行中ダウンタイム | 低 | 中 | 低 | 中 |
| コスト超過 | 低 | 低 | 低 | 低 |

---

## 付録

### 付録A: 参考資料

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

### 付録B: 関連ファイル一覧

#### 既存ファイル（要更新）

- `src/lib/estat/cache/EstatRelationalCacheService.ts` - R2版に置き換え
- `src/lib/ranking/ranking-queries.ts` - メタデータクエリのみ残す
- `src/types/models/ranking.ts` - R2型定義追加
- `database/schemas/ranking_items.sql` - 変更なし（メタデータ）

#### 新規作成ファイル

- `src/lib/ranking/RankingR2Service.ts`
- `src/lib/estat/cache/EstatR2CacheService.ts`
- `src/lib/ranking/RankingDataService.ts`
- `src/types/models/r2/ranking.ts`
- `scripts/migrate-d1-to-r2.ts`
- `scripts/verify-r2-data.ts`
- `database/migrations/007_drop_ranking_values.sql`

#### 削除予定ファイル

- `src/lib/estat/cache/EstatRelationalCacheService.ts`（フェーズ5で削除）

### 付録C: 環境変数設定

#### wrangler.toml

```toml
name = "stats47"
compatibility_date = "2025-01-01"

# R2バケット設定
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "stats47-rankings"
preview_bucket_name = "stats47-rankings-preview"

# D1データベース設定（既存）
[[d1_databases]]
binding = "DB"
database_name = "stats47-db"
database_id = "your-database-id"

# フィーチャーフラグ
[vars]
USE_R2_STORAGE = "true"  # R2使用フラグ
R2_CACHE_TTL = "86400"   # 24時間
```

### 付録D: 用語集

| 用語 | 説明 |
|------|------|
| **D1** | CloudflareのマネージドSQLiteデータベース |
| **R2** | Cloudflareのオブジェクトストレージ（S3互換） |
| **ランキングキー** | ランキング項目を一意に識別するキー（例: `population_density`） |
| **時系列コード** | 統計データの年度・期間を識別するコード（例: `2023100000`） |
| **FormattedValue** | アプリケーション内で使用するランキング値の型 |
| **デュアルライト** | D1とR2の両方にデータを書き込む並行運用方式 |
| **エッジキャッシュ** | CDNエッジサーバーでのキャッシュ（Cache API） |

---

## 承認

| 役割 | 氏名 | 承認日 | 署名 |
|------|------|--------|------|
| プロジェクトオーナー | | | |
| 技術リード | | | |
| インフラ担当 | | | |

---

**文書バージョン**: 1.0
**最終更新日**: 2025-10-13
**次回レビュー予定**: 2025-10-20
