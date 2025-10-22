---
title: ランキングデータR2ハイブリッドアーキテクチャ実装計画
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/ranking
  - implementation
---

# ランキングデータR2ハイブリッドアーキテクチャ実装計画

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**実装期間**: 3週間（15営業日）  
**優先度**: 高

---

## 目次

1. [実装概要](#実装概要)
2. [前提条件](#前提条件)
3. [Phase 1: 基盤構築](#phase-1-基盤構築)
4. [Phase 2: データ移行](#phase-2-データ移行)
5. [Phase 3: 最適化・監視](#phase-3-最適化監視)
6. [テスト計画](#テスト計画)
7. [リスク管理](#リスク管理)
8. [チェックリスト](#チェックリスト)

---

## 実装概要

### 目的

膨大なランキングデータ（最大340万レコード）を効率的に管理するため、D1データベースとR2ストレージのハイブリッドアーキテクチャを実装する。

### スコープ

- **対象**: 都道府県・市区町村ランキングデータ
- **データ量**: 47〜1,700件/年度/指標
- **時系列**: 10年分
- **指標数**: 100〜200指標

### 期待効果

| 指標 | 現状（D1のみ） | 目標（R2ハイブリッド） | 改善率 |
|------|---------------|---------------------|--------|
| 読み取り速度 | 47〜1,700回のSELECT | 1回のR2 GET | **47〜1,700倍** |
| 月額コスト | $30〜50 | $0 | **100%削減** |
| スケーラビリティ | 5GB制限 | 無制限 | **∞** |

---

## 前提条件

### 必要なツール

- [ ] Node.js 18.x以上
- [ ] Wrangler CLI（最新版）
- [ ] Cloudflareアカウント（Workers & R2有効）
- [ ] D1データベース（既存）

### 必要な権限

- [ ] R2バケット作成権限
- [ ] D1データベース編集権限
- [ ] Workers デプロイ権限

### 事前準備

```bash
# Wrangler CLIインストール/アップデート
npm install -g wrangler@latest

# Cloudflareログイン
wrangler login

# プロジェクト依存関係インストール
npm install
```

---

## Phase 1: 基盤構築

**期間**: Week 1（5営業日）  
**目標**: R2・D1・TypeScript基盤の構築

### Day 1: R2バケット・環境設定

#### タスク1.1: R2バケット作成（30分）

```bash
# 本番環境用バケット
wrangler r2 bucket create stats47-rankings

# プレビュー環境用バケット
wrangler r2 bucket create stats47-rankings-preview

# 開発環境用バケット
wrangler r2 bucket create stats47-rankings-dev
```

**確認**:
```bash
# バケット一覧確認
wrangler r2 bucket list
```

#### タスク1.2: wrangler.toml設定（15分）

**ファイル**: `wrangler.toml`

```toml
# 既存設定の後に追加

# R2バケット設定
[[r2_buckets]]
binding = "RANKING_BUCKET"
bucket_name = "stats47-rankings"
preview_bucket_name = "stats47-rankings-preview"

# 環境別設定
[[env.development.r2_buckets]]
binding = "RANKING_BUCKET"
bucket_name = "stats47-rankings-dev"

[[env.production.r2_buckets]]
binding = "RANKING_BUCKET"
bucket_name = "stats47-rankings"

# 環境変数
[vars]
R2_CACHE_TTL = "86400"          # 24時間
R2_MAX_FILE_SIZE = "10485760"   # 10MB
USE_R2_STORAGE = "false"        # 初期はfalse（段階的移行）
```

#### タスク1.3: 環境変数設定（15分）

**ファイル**: `.env.local`（既存ファイルに追加）

```bash
# R2設定
R2_CACHE_TTL=86400
R2_MAX_FILE_SIZE=10485760
USE_R2_STORAGE=false
```

**チェックリスト**:
- [ ] R2バケット3つ作成完了
- [ ] wrangler.toml設定追加
- [ ] .env.local設定追加
- [ ] バケット一覧で確認

---

### Day 2: データベーススキーマ変更

#### タスク2.1: マイグレーションファイル作成（45分）

**ファイル**: `database/migrations/020_create_ranking_index.sql`

```sql
-- ランキングインデックステーブル作成
-- R2ファイルへの参照と統計サマリーを保存

CREATE TABLE IF NOT EXISTS ranking_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  time_code TEXT NOT NULL,
  time_name TEXT NOT NULL,
  area_level TEXT NOT NULL,            -- 'prefecture', 'municipality'
  
  -- R2参照情報
  r2_key TEXT NOT NULL,                -- R2ファイルパス
  r2_etag TEXT,                        -- ETag（キャッシュ検証用）
  
  -- メタ情報
  data_count INTEGER NOT NULL,         -- データ件数
  file_size INTEGER NOT NULL,          -- ファイルサイズ（bytes）
  last_updated DATETIME NOT NULL,
  
  -- 統計サマリー（検索・フィルタ用）
  min_value REAL,
  max_value REAL,
  mean_value REAL,
  median_value REAL,
  std_dev REAL,
  
  -- データ品質
  completeness REAL DEFAULT 1.0,       -- 0.0〜1.0
  
  -- 制約
  UNIQUE(ranking_key, time_code, area_level),
  FOREIGN KEY (ranking_key) REFERENCES ranking_items(ranking_key)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ranking_index_key_time 
  ON ranking_index(ranking_key, time_code);
CREATE INDEX IF NOT EXISTS idx_ranking_index_level 
  ON ranking_index(area_level);
CREATE INDEX IF NOT EXISTS idx_ranking_index_updated 
  ON ranking_index(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_index_r2_key 
  ON ranking_index(r2_key);
```

**ファイル**: `database/migrations/021_create_data_quality.sql`

```sql
-- データ品質情報テーブル作成

CREATE TABLE IF NOT EXISTS data_quality (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  time_code TEXT NOT NULL,
  area_level TEXT NOT NULL,
  
  -- 品質指標
  completeness REAL NOT NULL,          -- 完全性（0.0〜1.0）
  missing_areas TEXT,                  -- 欠損地域コード（JSON配列）
  estimated_areas TEXT,                -- 推定値地域コード（JSON配列）
  data_reliability TEXT NOT NULL,      -- 'high', 'medium', 'low'
  
  -- 品質メモ
  notes TEXT,
  quality_check_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ranking_key, time_code, area_level) 
    REFERENCES ranking_index(ranking_key, time_code, area_level)
);

CREATE INDEX IF NOT EXISTS idx_data_quality_key 
  ON data_quality(ranking_key, time_code);
CREATE INDEX IF NOT EXISTS idx_data_quality_reliability 
  ON data_quality(data_reliability);
```

#### タスク2.2: マイグレーション実行（30分）

```bash
# ローカルD1でテスト
wrangler d1 execute stats47-db --local --file=database/migrations/020_create_ranking_index.sql
wrangler d1 execute stats47-db --local --file=database/migrations/021_create_data_quality.sql

# 確認
wrangler d1 execute stats47-db --local --command="SELECT name FROM sqlite_master WHERE type='table'"

# 本番D1に適用（慎重に）
wrangler d1 execute stats47-db --file=database/migrations/020_create_ranking_index.sql
wrangler d1 execute stats47-db --file=database/migrations/021_create_data_quality.sql
```

**チェックリスト**:
- [ ] マイグレーションファイル2つ作成
- [ ] ローカルD1でテスト実行
- [ ] テーブル作成確認
- [ ] インデックス作成確認
- [ ] 本番D1に適用

---

### Day 3: 型定義作成

#### タスク3.1: R2データ型定義（60分）

**ファイル**: `src/types/ranking/r2.ts`（新規作成）

```typescript
/**
 * R2ストレージ用ランキングデータ型定義
 */

/**
 * R2に保存される地域タイプ
 */
export type AreaType = "country" | "prefecture" | "municipality";

/**
 * R2に保存されるランキング値
 */
export interface RankingValueR2 {
  area_code: string;
  area_name: string;
  area_type: AreaType;
  parent_area_code?: string;        // 市区町村の場合
  value: number;
  rank: number;
  rank_in_parent?: number;          // 都道府県内ランク
  percentile?: number;
}

/**
 * R2に保存されるランキングデータ全体
 */
export interface RankingDataR2 {
  version: string;                  // "1.0"
  ranking_key: string;
  time_code: string;
  time_name: string;
  area_level: "prefecture" | "municipality";
  unit: string;
  saved_at: string;                 // ISO 8601形式
  
  data_source: {
    id: string;
    name: string;
  };
  
  statistics: {
    count: number;
    min: number;
    max: number;
    mean: number;
    median: number;
    std_dev: number;
  };
  
  values: RankingValueR2[];
}

/**
 * R2保存リクエスト
 */
export interface SaveRankingToR2Request {
  ranking_key: string;
  time_code: string;
  time_name: string;
  area_level: "prefecture" | "municipality";
  parent_code?: string;
  data: RankingDataR2;
}

/**
 * R2保存レスポンス
 */
export interface SaveRankingToR2Response {
  success: boolean;
  r2_key: string;
  file_size: number;
  message?: string;
}
```

#### タスク3.2: D1データ型定義（30分）

**ファイル**: `src/types/ranking/index-db.ts`（新規作成）

```typescript
/**
 * D1データベース用ランキングインデックス型定義
 */

/**
 * ranking_indexテーブル（スネークケース）
 */
export interface RankingIndexDB {
  id: number;
  ranking_key: string;
  time_code: string;
  time_name: string;
  area_level: string;
  r2_key: string;
  r2_etag?: string;
  data_count: number;
  file_size: number;
  last_updated: string;
  min_value?: number;
  max_value?: number;
  mean_value?: number;
  median_value?: number;
  std_dev?: number;
  completeness: number;
}

/**
 * data_qualityテーブル（スネークケース）
 */
export interface DataQualityDB {
  id: number;
  ranking_key: string;
  time_code: string;
  area_level: string;
  completeness: number;
  missing_areas?: string;         // JSON文字列
  estimated_areas?: string;       // JSON文字列
  data_reliability: string;
  notes?: string;
  quality_check_date: string;
  created_at: string;
  updated_at: string;
}

/**
 * ranking_indexテーブル（キャメルケース・アプリ用）
 */
export interface RankingIndex {
  id: number;
  rankingKey: string;
  timeCode: string;
  timeName: string;
  areaLevel: "prefecture" | "municipality";
  r2Key: string;
  r2Etag?: string;
  dataCount: number;
  fileSize: number;
  lastUpdated: Date;
  minValue?: number;
  maxValue?: number;
  meanValue?: number;
  medianValue?: number;
  stdDev?: number;
  completeness: number;
}

/**
 * data_qualityテーブル（キャメルケース・アプリ用）
 */
export interface DataQuality {
  id: number;
  rankingKey: string;
  timeCode: string;
  areaLevel: "prefecture" | "municipality";
  completeness: number;
  missingAreas: string[];
  estimatedAreas: string[];
  dataReliability: "high" | "medium" | "low";
  notes?: string;
  qualityCheckDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### タスク3.3: 型定義エクスポート（15分）

**ファイル**: `src/types/ranking/index.ts`（更新）

```typescript
// 既存のエクスポート
export * from "./base";
export * from "./unified";
export * from "./visualization";
export * from "./statistics";
export * from "./adapters";

// 新規追加
export * from "./r2";
export * from "./index-db";
```

**チェックリスト**:
- [ ] R2型定義ファイル作成
- [ ] D1型定義ファイル作成
- [ ] index.tsでエクスポート
- [ ] TypeScriptコンパイルエラーなし

---

### Day 4-5: サービスクラス実装

#### タスク4.1: R2キー生成ユーティリティ（30分）

**ファイル**: `src/lib/ranking/utils/r2-key-generator.ts`（新規作成）

```typescript
import type { TargetAreaLevel } from "@/types/ranking";

/**
 * R2キー生成ユーティリティ
 */
export class RankingR2KeyGenerator {
  /**
   * ランキング値データのR2キーを生成
   * 
   * @example
   * // 都道府県
   * generateValueKey("prefecture", "population", "2023")
   * // => "ranking_values/prefecture/population/2023.json"
   * 
   * // 市区町村（全国）
   * generateValueKey("municipality", "population", "2023")
   * // => "ranking_values/municipality/population/2023.json"
   * 
   * // 市区町村（都道府県別）
   * generateValueKey("municipality", "population", "2023", "13000")
   * // => "ranking_values/municipality/population/2023_13.json"
   */
  static generateValueKey(
    level: TargetAreaLevel,
    rankingKey: string,
    timeCode: string,
    parentCode?: string
  ): string {
    const basePath = `ranking_values/${level}/${rankingKey}`;
    
    if (level === "municipality" && parentCode) {
      // 都道府県ごとに分割（2桁の都道府県コード）
      const prefCode = parentCode.substring(0, 2);
      return `${basePath}/${timeCode}_${prefCode}.json`;
    }
    
    return `${basePath}/${timeCode}.json`;
  }
  
  /**
   * 統計サマリーのR2キーを生成
   */
  static generateSummaryKey(
    level: TargetAreaLevel,
    rankingKey: string
  ): string {
    return `ranking_summaries/${level}/${rankingKey}/summary.json`;
  }
  
  /**
   * R2キーからメタデータを抽出
   */
  static parseR2Key(r2Key: string): {
    level: TargetAreaLevel;
    rankingKey: string;
    timeCode: string;
    prefCode?: string;
  } | null {
    // ranking_values/prefecture/population/2023.json
    const match = r2Key.match(
      /^ranking_values\/(prefecture|municipality)\/([^\/]+)\/(\d+)(?:_(\d{2}))?\.json$/
    );
    
    if (!match) return null;
    
    return {
      level: match[1] as TargetAreaLevel,
      rankingKey: match[2],
      timeCode: match[3],
      prefCode: match[4],
    };
  }
}
```

#### タスク4.2: RankingR2Service実装（2時間）

**ファイル**: `src/lib/ranking/services/RankingR2Service.ts`（新規作成）

```typescript
import type { UnifiedRankingData, TargetAreaLevel } from "@/types/ranking";
import type { RankingDataR2 } from "@/types/ranking/r2";
import { RankingR2KeyGenerator } from "../utils/r2-key-generator";

/**
 * R2ストレージ操作サービス
 */
export class RankingR2Service {
  constructor(
    private r2Bucket: R2Bucket,
    private cacheApi?: Cache
  ) {}
  
  /**
   * ランキングデータをR2に保存
   */
  async saveRankingData(
    data: UnifiedRankingData,
    level: TargetAreaLevel,
    parentCode?: string
  ): Promise<{ r2Key: string; fileSize: number }> {
    const timeCode = data.timeSeries?.currentYear || "";
    const r2Key = RankingR2KeyGenerator.generateValueKey(
      level,
      data.metadata.rankingKey,
      timeCode,
      parentCode
    );
    
    // 統一フォーマットをR2フォーマットに変換
    const r2Data = this.transformToR2Format(data, level);
    const jsonString = JSON.stringify(r2Data, null, 2);
    const fileSize = new TextEncoder().encode(jsonString).length;
    
    // R2に保存
    await this.r2Bucket.put(r2Key, jsonString, {
      httpMetadata: {
        contentType: "application/json",
        cacheControl: "public, max-age=86400",
      },
      customMetadata: {
        rankingKey: data.metadata.rankingKey,
        timeCode,
        areaLevel: level,
        savedAt: new Date().toISOString(),
        version: "1.0",
      },
    });
    
    // キャッシュクリア
    if (this.cacheApi) {
      const cacheKey = this.generateCacheKey(r2Key);
      await this.cacheApi.delete(cacheKey);
    }
    
    return { r2Key, fileSize };
  }
  
  /**
   * ランキングデータをR2から取得（キャッシュ対応）
   */
  async getRankingData(
    rankingKey: string,
    timeCode: string,
    level: TargetAreaLevel,
    parentCode?: string
  ): Promise<UnifiedRankingData | null> {
    const r2Key = RankingR2KeyGenerator.generateValueKey(
      level,
      rankingKey,
      timeCode,
      parentCode
    );
    
    // 1. Cache APIチェック
    if (this.cacheApi) {
      const cacheKey = this.generateCacheKey(r2Key);
      const cached = await this.cacheApi.match(cacheKey);
      
      if (cached) {
        console.log(`Cache hit: ${r2Key}`);
        return cached.json();
      }
    }
    
    // 2. R2から取得
    console.log(`Fetching from R2: ${r2Key}`);
    const object = await this.r2Bucket.get(r2Key);
    
    if (!object) {
      console.log(`Not found in R2: ${r2Key}`);
      return null;
    }
    
    const r2Data = (await object.json()) as RankingDataR2;
    const unifiedData = this.transformFromR2Format(r2Data);
    
    // 3. Cache APIに保存
    if (this.cacheApi) {
      const cacheKey = this.generateCacheKey(r2Key);
      await this.cacheApi.put(
        cacheKey,
        new Response(JSON.stringify(unifiedData), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400",
          },
        })
      );
    }
    
    return unifiedData;
  }
  
  /**
   * R2オブジェクトを削除
   */
  async deleteRankingData(
    rankingKey: string,
    timeCode: string,
    level: TargetAreaLevel,
    parentCode?: string
  ): Promise<void> {
    const r2Key = RankingR2KeyGenerator.generateValueKey(
      level,
      rankingKey,
      timeCode,
      parentCode
    );
    
    await this.r2Bucket.delete(r2Key);
    
    // キャッシュクリア
    if (this.cacheApi) {
      const cacheKey = this.generateCacheKey(r2Key);
      await this.cacheApi.delete(cacheKey);
    }
  }
  
  /**
   * UnifiedRankingDataをR2フォーマットに変換
   */
  private transformToR2Format(
    data: UnifiedRankingData,
    level: TargetAreaLevel
  ): RankingDataR2 {
    return {
      version: "1.0",
      ranking_key: data.metadata.rankingKey,
      time_code: data.timeSeries?.currentYear || "",
      time_name: data.timeSeries?.currentYear || "",
      area_level: level,
      unit: data.metadata.unit,
      saved_at: new Date().toISOString(),
      data_source: {
        id: data.metadata.dataSourceId,
        name: data.metadata.dataSourceName,
      },
      statistics: {
        count: data.values.length,
        min: data.statistics?.min || 0,
        max: data.statistics?.max || 0,
        mean: data.statistics?.mean || 0,
        median: data.statistics?.median || 0,
        std_dev: data.statistics?.stdDev || 0,
      },
      values: data.values.map((v) => ({
        area_code: v.areaCode,
        area_name: v.areaName,
        area_type: v.areaType,
        parent_area_code: v.parentAreaCode,
        value: v.value,
        rank: v.rank,
        rank_in_parent: v.rankInParent,
        percentile: v.percentile,
      })),
    };
  }
  
  /**
   * R2フォーマットをUnifiedRankingDataに変換
   */
  private transformFromR2Format(r2Data: RankingDataR2): UnifiedRankingData {
    // 実装は省略（詳細は別途実装）
    return {} as UnifiedRankingData;
  }
  
  /**
   * Cache APIキー生成
   */
  private generateCacheKey(r2Key: string): string {
    return `https://cache.stats47.com/r2/${r2Key}`;
  }
}
```

#### タスク4.3: RankingDataService実装（2時間）

**ファイル**: `src/lib/ranking/services/RankingDataService.ts`（新規作成）

```typescript
import type { D1Database } from "@cloudflare/workers-types";
import type {
  UnifiedRankingData,
  TargetAreaLevel,
  RankingIndex,
  DataQuality,
} from "@/types/ranking";
import { RankingR2Service } from "./RankingR2Service";
import { RankingR2KeyGenerator } from "../utils/r2-key-generator";

/**
 * 統合ランキングデータサービス（D1 + R2）
 */
export class RankingDataService {
  constructor(
    private db: D1Database,
    private r2Service: RankingR2Service
  ) {}
  
  /**
   * ランキングデータを取得
   */
  async getRankingData(
    rankingKey: string,
    timeCode: string,
    level: TargetAreaLevel,
    parentCode?: string
  ): Promise<UnifiedRankingData | null> {
    // 1. D1からインデックス取得
    const index = await this.getRankingIndex(rankingKey, timeCode, level);
    
    if (!index) {
      console.log(
        `Ranking index not found: ${rankingKey}/${timeCode}/${level}`
      );
      return null;
    }
    
    // 2. R2から値データ取得
    const data = await this.r2Service.getRankingData(
      rankingKey,
      timeCode,
      level,
      parentCode
    );
    
    if (!data) {
      console.log(`Ranking data not found in R2: ${index.r2Key}`);
      return null;
    }
    
    // 3. データ品質情報を取得（オプション）
    const quality = await this.getDataQuality(rankingKey, timeCode, level);
    
    if (quality) {
      data.quality = {
        completeness: quality.completeness,
        missingAreas: quality.missingAreas,
        estimatedAreas: quality.estimatedAreas,
        dataReliability: quality.dataReliability,
        notes: quality.notes,
      };
    }
    
    return data;
  }
  
  /**
   * ランキングデータを保存
   */
  async saveRankingData(
    data: UnifiedRankingData,
    level: TargetAreaLevel,
    parentCode?: string
  ): Promise<void> {
    const timeCode = data.timeSeries?.currentYear || "";
    
    // 1. R2に値データを保存
    const { r2Key, fileSize } = await this.r2Service.saveRankingData(
      data,
      level,
      parentCode
    );
    
    // 2. D1にインデックスを保存
    await this.saveRankingIndex({
      rankingKey: data.metadata.rankingKey,
      timeCode,
      timeName: data.timeSeries?.currentYear || "",
      areaLevel: level,
      r2Key,
      dataCount: data.values.length,
      fileSize,
      lastUpdated: new Date(),
      minValue: data.statistics?.min,
      maxValue: data.statistics?.max,
      meanValue: data.statistics?.mean,
      medianValue: data.statistics?.median,
      stdDev: data.statistics?.stdDev,
      completeness: data.quality?.completeness || 1.0,
    });
    
    // 3. データ品質情報を保存
    if (data.quality) {
      await this.saveDataQuality({
        rankingKey: data.metadata.rankingKey,
        timeCode,
        areaLevel: level,
        completeness: data.quality.completeness,
        missingAreas: data.quality.missingAreas || [],
        estimatedAreas: data.quality.estimatedAreas || [],
        dataReliability: data.quality.dataReliability,
        notes: data.quality.notes,
      });
    }
  }
  
  /**
   * 利用可能な年度リストを取得（D1のみ）
   */
  async getAvailableYears(
    rankingKey: string,
    level: TargetAreaLevel
  ): Promise<string[]> {
    const query = `
      SELECT DISTINCT time_code 
      FROM ranking_index 
      WHERE ranking_key = ? AND area_level = ?
      ORDER BY time_code DESC
    `;
    
    const results = await this.db
      .prepare(query)
      .bind(rankingKey, level)
      .all();
    
    return results.results.map((r) => r.time_code as string);
  }
  
  /**
   * ランキングインデックスを取得（D1）
   */
  private async getRankingIndex(
    rankingKey: string,
    timeCode: string,
    level: TargetAreaLevel
  ): Promise<RankingIndex | null> {
    const query = `
      SELECT * FROM ranking_index 
      WHERE ranking_key = ? AND time_code = ? AND area_level = ?
    `;
    
    const result = await this.db
      .prepare(query)
      .bind(rankingKey, timeCode, level)
      .first();
    
    if (!result) return null;
    
    // スネークケースからキャメルケースに変換
    return this.convertToRankingIndex(result as any);
  }
  
  /**
   * ランキングインデックスを保存（D1）
   */
  private async saveRankingIndex(index: Omit<RankingIndex, "id">): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO ranking_index 
      (ranking_key, time_code, time_name, area_level, r2_key, 
       data_count, file_size, last_updated, min_value, max_value, 
       mean_value, median_value, std_dev, completeness)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.db
      .prepare(query)
      .bind(
        index.rankingKey,
        index.timeCode,
        index.timeName,
        index.areaLevel,
        index.r2Key,
        index.dataCount,
        index.fileSize,
        index.lastUpdated.toISOString(),
        index.minValue,
        index.maxValue,
        index.meanValue,
        index.medianValue,
        index.stdDev,
        index.completeness
      )
      .run();
  }
  
  /**
   * データ品質情報を取得（D1）
   */
  private async getDataQuality(
    rankingKey: string,
    timeCode: string,
    level: TargetAreaLevel
  ): Promise<DataQuality | null> {
    const query = `
      SELECT * FROM data_quality 
      WHERE ranking_key = ? AND time_code = ? AND area_level = ?
    `;
    
    const result = await this.db
      .prepare(query)
      .bind(rankingKey, timeCode, level)
      .first();
    
    if (!result) return null;
    
    return this.convertToDataQuality(result as any);
  }
  
  /**
   * データ品質情報を保存（D1）
   */
  private async saveDataQuality(quality: Omit<DataQuality, "id" | "qualityCheckDate" | "createdAt" | "updatedAt">): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO data_quality 
      (ranking_key, time_code, area_level, completeness, 
       missing_areas, estimated_areas, data_reliability, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.db
      .prepare(query)
      .bind(
        quality.rankingKey,
        quality.timeCode,
        quality.areaLevel,
        quality.completeness,
        JSON.stringify(quality.missingAreas),
        JSON.stringify(quality.estimatedAreas),
        quality.dataReliability,
        quality.notes
      )
      .run();
  }
  
  /**
   * スネークケースからキャメルケースに変換（RankingIndex）
   */
  private convertToRankingIndex(row: any): RankingIndex {
    return {
      id: row.id,
      rankingKey: row.ranking_key,
      timeCode: row.time_code,
      timeName: row.time_name,
      areaLevel: row.area_level,
      r2Key: row.r2_key,
      r2Etag: row.r2_etag,
      dataCount: row.data_count,
      fileSize: row.file_size,
      lastUpdated: new Date(row.last_updated),
      minValue: row.min_value,
      maxValue: row.max_value,
      meanValue: row.mean_value,
      medianValue: row.median_value,
      stdDev: row.std_dev,
      completeness: row.completeness,
    };
  }
  
  /**
   * スネークケースからキャメルケースに変換（DataQuality）
   */
  private convertToDataQuality(row: any): DataQuality {
    return {
      id: row.id,
      rankingKey: row.ranking_key,
      timeCode: row.time_code,
      areaLevel: row.area_level,
      completeness: row.completeness,
      missingAreas: row.missing_areas ? JSON.parse(row.missing_areas) : [],
      estimatedAreas: row.estimated_areas ? JSON.parse(row.estimated_areas) : [],
      dataReliability: row.data_reliability,
      notes: row.notes,
      qualityCheckDate: new Date(row.quality_check_date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
```

**チェックリスト（Day 4-5）**:
- [ ] R2キー生成ユーティリティ実装
- [ ] RankingR2Service実装
- [ ] RankingDataService実装
- [ ] ユニットテスト作成
- [ ] TypeScriptコンパイルエラーなし

---

## Phase 2: データ移行

**期間**: Week 2（5営業日）  
**目標**: 既存データのR2移行と検証

### Day 6-7: 移行スクリプト作成

#### タスク5.1: 移行スクリプト実装（3時間）

**ファイル**: `scripts/migrate-ranking-to-r2.ts`（新規作成）

```typescript
/**
 * 既存ランキングデータをD1からR2に移行するスクリプト
 * 
 * 使用法:
 *   npx tsx scripts/migrate-ranking-to-r2.ts --dry-run
 *   npx tsx scripts/migrate-ranking-to-r2.ts --execute
 */

import { RankingDataService } from "../src/lib/ranking/services/RankingDataService";
import { RankingR2Service } from "../src/lib/ranking/services/RankingR2Service";

// 実装省略（詳細は別途作成）
```

詳細な実装手順は別途ドキュメント化します。

**チェックリスト（Phase 2）**:
- [ ] 移行スクリプト作成
- [ ] ドライラン実行・確認
- [ ] データ検証スクリプト作成
- [ ] 本番移行実行
- [ ] データ整合性確認

---

## Phase 3: 最適化・監視

**期間**: Week 3（5営業日）  
**目標**: パフォーマンス最適化と監視体制構築

### Day 11-15: 最適化と監視

**チェックリスト**:
- [ ] Cache API統合
- [ ] プリフェッチ実装
- [ ] パフォーマンステスト
- [ ] 監視ダッシュボード構築
- [ ] 運用マニュアル作成

---

## テスト計画

### ユニットテスト

```bash
# サービスクラスのテスト
npm run test src/lib/ranking/services/RankingR2Service.test.ts
npm run test src/lib/ranking/services/RankingDataService.test.ts
```

### 統合テスト

```bash
# E2Eテスト
npm run test:e2e
```

---

## リスク管理

### フィーチャーフラグ

```typescript
// wrangler.toml
[vars]
USE_R2_STORAGE = "false"  # 段階的にtrueに

// コード内
if (env.USE_R2_STORAGE === "true") {
  // R2から取得
} else {
  // D1から取得（レガシー）
}
```

---

## チェックリスト

### 全体進捗

- [ ] Phase 1: 基盤構築完了
- [ ] Phase 2: データ移行完了
- [ ] Phase 3: 最適化完了
- [ ] 本番デプロイ完了
- [ ] 監視体制確立

### 品質確認

- [ ] 全ユニットテスト合格
- [ ] 統合テスト合格
- [ ] パフォーマンステスト合格
- [ ] セキュリティチェック完了
- [ ] ドキュメント更新完了

---

## 関連ドキュメント

- [統一ランキングシステム設計書](../仕様/unified-ranking-design.md)
- [R2ハイブリッドアーキテクチャ設計書](r2-hybrid-architecture.md)

---

**更新履歴**:
- 2025-10-16: 初版作成

