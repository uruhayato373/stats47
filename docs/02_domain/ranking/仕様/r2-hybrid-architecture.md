# ランキングデータR2ハイブリッドアーキテクチャ設計書

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: 都道府県・市区町村ランキングデータ管理

---

## 目次

1. [エグゼクティブサマリー](#エグゼクティブサマリー)
2. [アーキテクチャ概要](#アーキテクチャ概要)
3. [データ分離戦略](#データ分離戦略)
4. [R2ストレージ設計](#r2ストレージ設計)
5. [D1データベース設計](#d1データベース設計)
6. [データアクセスレイヤー](#データアクセスレイヤー)
7. [API設計](#api設計)
8. [パフォーマンス最適化](#パフォーマンス最適化)
9. [コスト分析](#コスト分析)
10. [実装ロードマップ](#実装ロードマップ)

---

## エグゼクティブサマリー

### 課題

ランキングデータは膨大な量になる見込み：
- **都道府県**: 47件/年度/指標
- **市区町村**: 約1,700件/年度/指標
- **時系列**: 10年分程度
- **指標数**: 100〜200指標を想定

→ **合計**: 最大 **340万レコード** (1,700 × 10年 × 200指標)

### 解決策

**ハイブリッドアーキテクチャ**を採用：
- **D1データベース**: メタデータ・インデックス情報のみ（軽量）
- **R2ストレージ**: 実際のランキング値データ（JSON形式）

### 主要メリット

| 項目 | 現状（D1のみ） | 提案（R2ハイブリッド） | 改善効果 |
|------|---------------|---------------------|---------|
| **読み取りコスト** | 47〜1,700回のSELECT | 1回のR2 GET | **47〜1,700倍高速** |
| **書き込みコスト** | 47〜1,700回のINSERT | 1回のR2 PUT | **47〜1,700倍高速** |
| **ストレージコスト** | D1制限（5GB無料枠） | R2 10GB無料枠 | **コスト削減** |
| **読み取り回数** | 10万回/日制限 | 無制限（R2は無料） | **スケール可能** |
| **エッジキャッシュ** | 不可 | Cache API利用可 | **超高速化** |
| **データサイズ** | テーブル肥大化 | 単一JSONファイル | **管理容易** |

---

## アーキテクチャ概要

### 全体構成図

```
┌──────────────────────────────────────────────────────┐
│                    Client (Browser)                    │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│              Cloudflare Workers (Edge)                │
│  ┌────────────────────────────────────────────────┐  │
│  │           RankingDataService                   │  │
│  │  - メタデータクエリ（D1）                        │  │
│  │  - 値データ取得（R2）                            │  │
│  │  - キャッシュ管理（Cache API）                   │  │
│  └────────────────────────────────────────────────┘  │
└────────────┬─────────────────────────┬────────────────┘
             │                         │
             ▼                         ▼
    ┌──────────────┐          ┌──────────────┐
    │      D1      │          │      R2      │
    │  Database    │          │   Storage    │
    └──────────────┘          └──────────────┘
    
    【軽量メタデータ】        【大量値データ】
    - ranking_items          - ranking_values/
    - ranking_index              prefecture/
    - data_quality               {key}/{year}.json
                                 municipality/
                                 {key}/{year}.json
```

### データフロー

#### 1. ランキングデータ取得フロー

```
1. Client → API Request
   GET /api/ranking/data?level=prefecture&rankingKey=population&timeCode=2023

2. Worker → D1クエリ（メタデータ）
   SELECT * FROM ranking_index 
   WHERE ranking_key = 'population' AND time_code = '2023'
   
3. Worker → R2読み取り（値データ）
   GET ranking_values/prefecture/population/2023.json
   
4. Worker → Cache API（エッジキャッシュ）
   cache.put(request, response, { expirationTtl: 86400 })
   
5. Worker → Client レスポンス
   { metadata: {...}, values: [...] }
```

#### 2. ランキングデータ保存フロー

```
1. Client → API Request
   POST /api/ranking/save
   
2. Worker → データ変換・検証
   - アダプターでUnifiedRankingDataに変換
   - データ品質チェック
   - ランキング計算
   
3. Worker → R2保存（値データ）
   PUT ranking_values/prefecture/population/2023.json
   
4. Worker → D1保存（メタデータ）
   INSERT INTO ranking_index (...)
   INSERT INTO data_quality (...)
   
5. Worker → キャッシュ無効化
   cache.delete(request)
```

---

## データ分離戦略

### D1に保存するデータ（軽量・検索用）

```sql
-- ランキング項目マスタ（変更少ない）
CREATE TABLE ranking_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  data_source_id TEXT NOT NULL,
  target_area_level TEXT NOT NULL,     -- 'prefecture', 'municipality', 'both'
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- 可視化設定（JSON）
  visualization_config TEXT NOT NULL,  -- JSON形式
  
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ランキングデータインデックス（軽量・検索用）
CREATE TABLE ranking_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  time_code TEXT NOT NULL,
  time_name TEXT NOT NULL,
  area_level TEXT NOT NULL,            -- 'prefecture', 'municipality'
  
  -- R2ファイルパス
  r2_key TEXT NOT NULL,                -- 例: "ranking_values/prefecture/population/2023.json"
  
  -- メタ情報
  data_count INTEGER NOT NULL,         -- データ件数（47 or 1700）
  file_size INTEGER NOT NULL,          -- ファイルサイズ（bytes）
  last_updated DATETIME NOT NULL,
  
  -- 統計サマリー（検索・フィルタ用）
  min_value REAL,
  max_value REAL,
  mean_value REAL,
  median_value REAL,
  
  -- データ品質
  completeness REAL,                   -- 0.0〜1.0
  
  UNIQUE(ranking_key, time_code, area_level),
  FOREIGN KEY (ranking_key) REFERENCES ranking_items(ranking_key)
);

-- データ品質情報（軽量）
CREATE TABLE data_quality (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  time_code TEXT NOT NULL,
  area_level TEXT NOT NULL,
  
  completeness REAL NOT NULL,
  missing_areas TEXT,                  -- JSON配列: ["01000", "13000"]
  estimated_areas TEXT,                -- JSON配列
  data_reliability TEXT NOT NULL,      -- 'high', 'medium', 'low'
  notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ranking_key, time_code, area_level) 
    REFERENCES ranking_index(ranking_key, time_code, area_level)
);

-- インデックス
CREATE INDEX idx_ranking_index_key_time ON ranking_index(ranking_key, time_code);
CREATE INDEX idx_ranking_index_level ON ranking_index(area_level);
CREATE INDEX idx_ranking_index_updated ON ranking_index(last_updated);
```

### R2に保存するデータ（大量・値データ）

#### ファイル構造

```
ranking_values/
├── prefecture/
│   ├── population/
│   │   ├── 2023.json         # 都道府県別人口（2023年）
│   │   ├── 2022.json
│   │   └── ...
│   ├── gdp/
│   │   ├── 2023.json
│   │   └── ...
│   └── ...
│
└── municipality/
    ├── population/
    │   ├── 2023.json         # 市区町村別人口（2023年）
    │   ├── 2023_01.json      # 北海道内の市区町村（分割可能）
    │   ├── 2023_13.json      # 東京都内の市区町村
    │   └── ...
    └── ...
```

#### JSONフォーマット

```json
{
  "version": "1.0",
  "ranking_key": "population",
  "time_code": "2023100000",
  "time_name": "2023年",
  "area_level": "prefecture",
  "unit": "人",
  "saved_at": "2025-10-16T12:00:00Z",
  "data_source": {
    "id": "estat",
    "name": "e-Stat（政府統計）"
  },
  "statistics": {
    "count": 47,
    "min": 550000,
    "max": 14000000,
    "mean": 2700000,
    "median": 2000000,
    "std_dev": 2500000
  },
  "values": [
    {
      "area_code": "01000",
      "area_name": "北海道",
      "area_type": "prefecture",
      "value": 5224614,
      "rank": 8,
      "percentile": 83.0
    },
    {
      "area_code": "13000",
      "area_name": "東京都",
      "area_type": "prefecture",
      "value": 14047594,
      "rank": 1,
      "percentile": 100.0
    }
    // ... 残り45都道府県
  ]
}
```

#### 市区町村データ（分割版）

市区町村データは大きいため、都道府県ごとに分割可能：

```json
// ranking_values/municipality/population/2023_13.json
{
  "version": "1.0",
  "ranking_key": "population",
  "time_code": "2023100000",
  "area_level": "municipality",
  "parent_area_code": "13000",
  "parent_area_name": "東京都",
  "values": [
    {
      "area_code": "13101",
      "area_name": "千代田区",
      "area_type": "municipality",
      "parent_area_code": "13000",
      "value": 66680,
      "rank": 1450,              // 全国ランク
      "rank_in_parent": 23       // 東京都内ランク
    }
    // ... 東京都内の他の市区町村
  ]
}
```

---

## R2ストレージ設計

### R2バケット設定

```toml
# wrangler.toml

[[r2_buckets]]
binding = "RANKING_BUCKET"
bucket_name = "stats47-rankings"
preview_bucket_name = "stats47-rankings-preview"

# 環境変数
[vars]
R2_CACHE_TTL = "86400"        # 24時間
R2_MAX_FILE_SIZE = "10485760"  # 10MB
```

### R2キー命名規則

```typescript
/**
 * R2キー生成ユーティリティ
 */
export class RankingR2KeyGenerator {
  /**
   * ランキング値データのR2キーを生成
   */
  static generateValueKey(
    level: TargetAreaLevel,
    rankingKey: string,
    timeCode: string,
    parentCode?: string
  ): string {
    const basePath = `ranking_values/${level}/${rankingKey}`;
    
    if (level === "municipality" && parentCode) {
      // 都道府県ごとに分割
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
}
```

### R2操作サービス

```typescript
// src/lib/ranking/services/RankingR2Service.ts

export class RankingR2Service {
  constructor(
    private r2Bucket: R2Bucket,
    private cacheApi: Cache
  ) {}
  
  /**
   * ランキングデータをR2に保存
   */
  async saveRankingData(
    data: UnifiedRankingData,
    level: TargetAreaLevel,
    parentCode?: string
  ): Promise<void> {
    const r2Key = RankingR2KeyGenerator.generateValueKey(
      level,
      data.metadata.rankingKey,
      data.timeSeries?.currentYear || "",
      parentCode
    );
    
    const r2Data = this.transformToR2Format(data);
    const jsonString = JSON.stringify(r2Data, null, 2);
    
    await this.r2Bucket.put(r2Key, jsonString, {
      httpMetadata: {
        contentType: "application/json",
      },
      customMetadata: {
        rankingKey: data.metadata.rankingKey,
        timeCode: data.timeSeries?.currentYear || "",
        areaLevel: level,
        savedAt: new Date().toISOString(),
      },
    });
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
    const cacheKey = `r2:${r2Key}`;
    const cached = await this.cacheApi.match(cacheKey);
    if (cached) {
      return cached.json();
    }
    
    // 2. R2から取得
    const object = await this.r2Bucket.get(r2Key);
    if (!object) {
      return null;
    }
    
    const data = await object.json() as RankingDataR2;
    const unified = this.transformFromR2Format(data);
    
    // 3. Cache APIに保存
    await this.cacheApi.put(
      cacheKey,
      new Response(JSON.stringify(unified), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
        },
      })
    );
    
    return unified;
  }
  
  /**
   * 統一フォーマットをR2フォーマットに変換
   */
  private transformToR2Format(data: UnifiedRankingData): RankingDataR2 {
    return {
      version: "1.0",
      ranking_key: data.metadata.rankingKey,
      time_code: data.timeSeries?.currentYear || "",
      time_name: data.timeSeries?.currentYear || "",
      area_level: data.metadata.targetAreaLevel,
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
      values: data.values.map(v => ({
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
   * R2フォーマットを統一フォーマットに変換
   */
  private transformFromR2Format(data: RankingDataR2): UnifiedRankingData {
    // 実装省略（逆変換）
  }
}
```

---

## D1データベース設計

### マイグレーション戦略

既存の`ranking_values`テーブルは削除し、軽量な`ranking_index`テーブルに置き換え：

```sql
-- database/migrations/020_migrate_to_r2_hybrid.sql

-- 既存データをR2に移行（スクリプトで実行）
-- このマイグレーションの前に、scripts/migrate-ranking-values-to-r2.ts を実行すること

-- 旧テーブルをバックアップ
CREATE TABLE ranking_values_backup AS SELECT * FROM ranking_values;

-- 旧テーブルを削除
DROP TABLE ranking_values;

-- 新しい軽量テーブルを作成
CREATE TABLE ranking_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  time_code TEXT NOT NULL,
  time_name TEXT NOT NULL,
  area_level TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  data_count INTEGER NOT NULL,
  file_size INTEGER NOT NULL,
  last_updated DATETIME NOT NULL,
  min_value REAL,
  max_value REAL,
  mean_value REAL,
  median_value REAL,
  completeness REAL,
  UNIQUE(ranking_key, time_code, area_level),
  FOREIGN KEY (ranking_key) REFERENCES ranking_items(ranking_key)
);

CREATE INDEX idx_ranking_index_key_time ON ranking_index(ranking_key, time_code);
CREATE INDEX idx_ranking_index_level ON ranking_index(area_level);
CREATE INDEX idx_ranking_index_updated ON ranking_index(last_updated);

-- データ品質テーブル
CREATE TABLE data_quality (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  time_code TEXT NOT NULL,
  area_level TEXT NOT NULL,
  completeness REAL NOT NULL,
  missing_areas TEXT,
  estimated_areas TEXT,
  data_reliability TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ranking_key, time_code, area_level) 
    REFERENCES ranking_index(ranking_key, time_code, area_level)
);
```

---

## データアクセスレイヤー

### 統一サービスクラス

```typescript
// src/lib/ranking/services/RankingDataService.ts

export class RankingDataService {
  constructor(
    private db: D1Database,
    private r2Service: RankingR2Service
  ) {}
  
  /**
   * ランキングデータを取得（D1 + R2）
   */
  async getRankingData(
    rankingKey: string,
    timeCode: string,
    level: TargetAreaLevel,
    parentCode?: string
  ): Promise<UnifiedRankingData | null> {
    // 1. D1からメタデータ・インデックス取得
    const index = await this.db
      .prepare(
        `SELECT * FROM ranking_index 
         WHERE ranking_key = ? AND time_code = ? AND area_level = ?`
      )
      .bind(rankingKey, timeCode, level)
      .first();
    
    if (!index) {
      return null;
    }
    
    // 2. R2から値データ取得
    const valuesData = await this.r2Service.getRankingData(
      rankingKey,
      timeCode,
      level,
      parentCode
    );
    
    if (!valuesData) {
      return null;
    }
    
    // 3. データ品質情報取得（D1）
    const quality = await this.getDataQuality(rankingKey, timeCode, level);
    
    return {
      ...valuesData,
      quality,
    };
  }
  
  /**
   * ランキングデータを保存（D1 + R2）
   */
  async saveRankingData(
    data: UnifiedRankingData,
    level: TargetAreaLevel,
    parentCode?: string
  ): Promise<void> {
    const timeCode = data.timeSeries?.currentYear || "";
    
    // 1. R2に値データを保存
    await this.r2Service.saveRankingData(data, level, parentCode);
    
    // 2. D1にインデックスを保存
    const r2Key = RankingR2KeyGenerator.generateValueKey(
      level,
      data.metadata.rankingKey,
      timeCode,
      parentCode
    );
    
    await this.db
      .prepare(
        `INSERT OR REPLACE INTO ranking_index 
         (ranking_key, time_code, time_name, area_level, r2_key, 
          data_count, file_size, last_updated, min_value, max_value, 
          mean_value, median_value, completeness)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.metadata.rankingKey,
        timeCode,
        data.timeSeries?.currentYear || "",
        level,
        r2Key,
        data.values.length,
        JSON.stringify(data).length,
        new Date().toISOString(),
        data.statistics?.min,
        data.statistics?.max,
        data.statistics?.mean,
        data.statistics?.median,
        data.quality?.completeness
      )
      .run();
    
    // 3. D1にデータ品質情報を保存
    await this.saveDataQuality(data, level);
  }
  
  /**
   * 利用可能な年度リストを取得（D1のみ）
   */
  async getAvailableYears(
    rankingKey: string,
    level: TargetAreaLevel
  ): Promise<string[]> {
    const results = await this.db
      .prepare(
        `SELECT DISTINCT time_code FROM ranking_index 
         WHERE ranking_key = ? AND area_level = ?
         ORDER BY time_code DESC`
      )
      .bind(rankingKey, level)
      .all();
    
    return results.results.map(r => r.time_code as string);
  }
}
```

---

## API設計

### エンドポイント実装

```typescript
// src/app/api/ranking/data/route.ts

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const level = searchParams.get("level") as TargetAreaLevel;
  const rankingKey = searchParams.get("rankingKey");
  const timeCode = searchParams.get("timeCode");
  const parentCode = searchParams.get("parentCode");
  
  if (!level || !rankingKey || !timeCode) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }
  
  const env = getCloudflareEnv();
  const rankingService = new RankingDataService(
    env.DB,
    new RankingR2Service(env.RANKING_BUCKET, caches.default)
  );
  
  try {
    const data = await rankingService.getRankingData(
      rankingKey,
      timeCode,
      level,
      parentCode
    );
    
    if (!data) {
      return NextResponse.json(
        { error: "Ranking data not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=86400", // 24時間キャッシュ
      },
    });
  } catch (error) {
    console.error("Failed to fetch ranking data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## パフォーマンス最適化

### 1. エッジキャッシュ戦略

```typescript
// Cache API利用
const cacheKey = `ranking:${level}:${rankingKey}:${timeCode}`;
const cached = await caches.default.match(cacheKey);

if (cached) {
  return cached; // キャッシュヒット（超高速）
}

// R2から取得
const data = await r2Service.getRankingData(...);

// キャッシュに保存
await caches.default.put(
  cacheKey,
  new Response(JSON.stringify(data), {
    headers: {
      "Cache-Control": "public, max-age=86400",
    },
  })
);
```

### 2. プリフェッチ戦略

```typescript
/**
 * よく使われるランキングデータを事前にキャッシュ
 */
async function prefetchPopularRankings() {
  const popular = [
    { key: "population", level: "prefecture" },
    { key: "gdp", level: "prefecture" },
    { key: "income", level: "prefecture" },
  ];
  
  for (const item of popular) {
    const years = await service.getAvailableYears(item.key, item.level);
    const latestYear = years[0];
    
    // バックグラウンドでキャッシュウォーミング
    await service.getRankingData(item.key, latestYear, item.level);
  }
}
```

### 3. 分割読み込み（市区町村）

市区町村データは都道府県ごとに分割し、必要な部分のみ取得：

```typescript
// 東京都内の市区町村のみ取得
const tokyoMunicipalities = await service.getRankingData(
  "population",
  "2023",
  "municipality",
  "13000" // 東京都コード
);
```

---

## コスト分析

### 現状（D1のみ）vs 提案（R2ハイブリッド）

#### ストレージコスト（月額）

| 項目 | データ量 | D1のみ | R2ハイブリッド | 削減額 |
|------|---------|--------|---------------|--------|
| 都道府県データ | 47件 × 200指標 × 10年 = 94,000件 | 約10MB | D1: 1MB<br>R2: 9MB | - |
| 市区町村データ | 1,700件 × 200指標 × 10年 = 3,400,000件 | 約3.4GB | D1: 50MB<br>R2: 3.35GB | - |
| **合計** | 3,494,000件 | **3.41GB** | **D1: 51MB<br>R2: 3.36GB** | - |

#### 読み取りコスト（月額・10万アクセス想定）

| 項目 | D1のみ | R2ハイブリッド | 削減率 |
|------|--------|---------------|--------|
| D1読み取り | 100,000回 × 47件 = 470万回<br>（無料枠超過） | 100,000回（メタデータのみ）<br>（無料枠内） | **47倍削減** |
| R2読み取り | - | 100,000回（完全無料） | - |
| **月額コスト** | **約$30〜50** | **$0** | **100%削減** |

#### 書き込みコスト

| 操作 | D1のみ | R2ハイブリッド | 改善 |
|------|--------|---------------|------|
| 都道府県ランキング保存 | 47回INSERT | 1回PUT + 1回INSERT | **47倍高速** |
| 市区町村ランキング保存 | 1,700回INSERT | 1回PUT + 1回INSERT | **1,700倍高速** |

---

## 実装ロードマップ

### Phase 1: 基盤構築（1週間）

#### Week 1: Day 1-2
- [ ] R2バケット作成・設定
- [ ] データベーススキーマ変更（`ranking_index`, `data_quality`）
- [ ] 型定義作成（`RankingDataR2`, `RankingR2Service`）

#### Week 1: Day 3-4
- [ ] `RankingR2Service`実装
- [ ] `RankingDataService`実装
- [ ] R2キー生成ユーティリティ実装

#### Week 1: Day 5-7
- [ ] APIエンドポイント実装
- [ ] Cache API統合
- [ ] エラーハンドリング

### Phase 2: データ移行（1週間）

#### Week 2: Day 1-3
- [ ] 既存データのバックアップ
- [ ] 移行スクリプト作成（D1 → R2）
- [ ] データ検証スクリプト作成

#### Week 2: Day 4-5
- [ ] 本番データ移行実行
- [ ] データ整合性確認
- [ ] パフォーマンステスト

#### Week 2: Day 6-7
- [ ] 旧テーブル削除
- [ ] クリーンアップ
- [ ] ドキュメント更新

### Phase 3: 最適化・監視（1週間）

#### Week 3: Day 1-3
- [ ] キャッシュ戦略最適化
- [ ] プリフェッチ実装
- [ ] 分割読み込み実装（市区町村）

#### Week 3: Day 4-5
- [ ] 監視ダッシュボード構築
- [ ] アラート設定
- [ ] ログ分析

#### Week 3: Day 6-7
- [ ] 負荷テスト
- [ ] コスト検証
- [ ] 運用マニュアル作成

---

## リスク管理

### 主要リスクと対策

| リスク | 発生確率 | 影響度 | 対策 |
|--------|----------|--------|------|
| R2障害 | 低 | 高 | フィーチャーフラグでD1に切り替え可能 |
| データ整合性問題 | 中 | 高 | 移行前の完全バックアップ |
| パフォーマンス悪化 | 低 | 中 | Cache APIで緩和 |
| コスト超過 | 低 | 低 | R2は読み取り無料 |

### ロールバック計画

```typescript
// フィーチャーフラグで即座に切り替え可能
// wrangler.toml
[vars]
USE_R2_STORAGE = "false"  # true → false に変更

// コード内でフラグチェック
if (env.USE_R2_STORAGE === "true") {
  // R2から取得
} else {
  // D1から取得（レガシー）
}
```

---

## e-Stat APIパラメータマッピング

### 概要

`ranking_key`とe-Stat APIパラメータを紐付けるマッピング機能。同じ`ranking_key`でも年度によって異なるパラメータに対応し、JSON形式で柔軟に管理します。

### 課題

e-Stat APIをデータソースとして使用する際の課題：

1. **パラメータの複雑性**: `statsDataId`, `cdCat01`, `cdTab`, `cdArea`, `cdTime`など多数のパラメータ
2. **年度ごとの変更**: 同じ統計でも年度によってパラメータが変わる可能性
3. **地域レベルの違い**: 都道府県と市区町村で異なるパラメータが必要
4. **管理の複雑さ**: ハードコードされたパラメータでは保守が困難

### 解決策

**D1データベース + JSON形式**による柔軟なマッピング管理：

#### テーブル設計

```sql
-- e-Stat APIパラメータマッピングテーブル
CREATE TABLE estat_api_params (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  time_code TEXT,  -- NULLの場合は全年度共通
  area_level TEXT NOT NULL,  -- 'prefecture', 'municipality'
  
  -- e-Stat APIパラメータ (JSON形式)
  api_params TEXT NOT NULL,  -- JSON: { statsDataId, cdCat01, cdTab, cdArea, cdTime, ... }
  
  -- メタ情報
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 複合ユニーク制約 (ranking_key + time_code + area_level)
  UNIQUE(ranking_key, time_code, area_level)
);
```

#### JSONパラメータ例

```json
{
  "statsDataId": "0000010101",
  "cdCat01": "A1101",
  "cdTab": "001",
  "cdArea": "00000",
  "cdTime": "2023000000",
  "lvCat01": "1",
  "lvTab": "1"
}
```

### 取得優先順位

1. **完全一致**: `ranking_key` + `time_code` + `area_level`
2. **フォールバック**: `ranking_key` + `NULL` + `area_level` (全年度共通)

### アダプターレイヤー統合

#### EstatApiParamsService

```typescript
export class EstatApiParamsService {
  /**
   * ranking_keyとtime_codeからe-Stat APIパラメータを取得
   */
  async getApiParams(
    rankingKey: string,
    timeCode: string,
    areaLevel: TargetAreaLevel
  ): Promise<EstatApiParams | null> {
    // 1. 完全一致を探す
    const exactMatch = await this.db
      .prepare(
        `SELECT * FROM estat_api_params 
         WHERE ranking_key = ? AND time_code = ? AND area_level = ? AND is_active = 1`
      )
      .bind(rankingKey, timeCode, areaLevel)
      .first();

    if (exactMatch) {
      return JSON.parse(exactMatch.api_params);
    }

    // 2. フォールバック: 全年度共通設定を探す
    const fallback = await this.db
      .prepare(
        `SELECT * FROM estat_api_params 
         WHERE ranking_key = ? AND time_code IS NULL AND area_level = ? AND is_active = 1`
      )
      .bind(rankingKey, areaLevel)
      .first();

    if (fallback) {
      return JSON.parse(fallback.api_params);
    }

    return null;
  }
}
```

#### EstatRankingAdapter

```typescript
export class EstatRankingAdapter implements RankingDataAdapter {
  async fetchAndTransform(params: AdapterFetchParams): Promise<UnifiedRankingData> {
    // 1. e-Stat APIパラメータを取得
    const apiParams = await this.apiParamsService.getApiParams(
      params.rankingKey,
      params.timeCode,
      params.level
    );

    if (!apiParams) {
      throw new Error(`e-Stat APIパラメータが見つかりません: ${params.rankingKey}`);
    }

    // 2. e-Stat APIからデータ取得
    const estatData = await EstatStatsDataFetcher.fetchAndFormat(
      apiParams.statsDataId,
      {
        categoryFilter: apiParams.cdCat01,
        yearFilter: apiParams.cdTime || params.timeCode,
        areaFilter: apiParams.cdArea,
        limit: 10000,
      }
    );

    // 3. 統一フォーマットに変換
    return this.transformToUnifiedFormat(estatData, params);
  }
}
```

### R2ハイブリッドアーキテクチャとの統合

#### データフロー

```
1. Client Request
   GET /api/ranking/data?rankingKey=population&timeCode=2023&level=prefecture

2. RankingDataService
   - R2キャッシュチェック
   - キャッシュミス時: アダプターレイヤー呼び出し

3. EstatRankingAdapter
   - EstatApiParamsServiceでパラメータ取得
   - e-Stat API呼び出し
   - UnifiedRankingDataに変換

4. R2保存
   - 変換されたデータをR2に保存
   - D1にメタデータ保存

5. Client Response
   - 統一フォーマットでデータ返却
```

#### RankingDataService更新

```typescript
export class RankingDataService {
  async getRankingData(
    rankingKey: string,
    timeCode: string,
    level: TargetAreaLevel,
    parentCode?: string
  ): Promise<UnifiedRankingData | null> {
    // 1. R2キャッシュチェック
    const cached = await this.r2Service.getRankingData(
      rankingKey, timeCode, level, parentCode
    );

    if (cached) {
      return cached;
    }

    // 2. D1からranking_itemsを取得してdata_source_idを確認
    const rankingItem = await this.db
      .prepare(`SELECT data_source_id FROM ranking_items WHERE ranking_key = ?`)
      .bind(rankingKey)
      .first();

    // 3. アダプターを取得
    const adapter = await RankingAdapterRegistry.getAdapter(
      rankingItem.data_source_id,
      this.db
    );

    // 4. アダプターでデータ取得・変換
    const data = await adapter.fetchAndTransform({
      rankingKey, timeCode, level, parentCode,
    });

    // 5. R2に保存
    await this.saveRankingData(data, level, parentCode);

    return data;
  }
}
```

### メリット

| 項目 | 従来 | 提案 | 改善効果 |
|------|------|------|---------|
| **パラメータ管理** | ハードコード | JSON設定 | **柔軟性向上** |
| **年度対応** | 手動更新 | 自動フォールバック | **保守性向上** |
| **地域レベル** | 個別実装 | 統一インターフェース | **一貫性向上** |
| **エラー対応** | 実行時エラー | 事前検証 | **信頼性向上** |
| **拡張性** | コード変更 | 設定追加 | **スケーラビリティ向上** |

### サンプルデータ

```sql
-- 人口データ (全年度共通)
INSERT INTO estat_api_params (ranking_key, time_code, area_level, api_params, description)
VALUES (
  'population',
  NULL,  -- 全年度共通
  'prefecture',
  json_object(
    'statsDataId', '0000010101',
    'cdCat01', 'A1101',
    'cdTab', '001'
  ),
  '都道府県別人口'
);

-- GDPデータ (年度ごとに異なる)
INSERT INTO estat_api_params (ranking_key, time_code, area_level, api_params, description)
VALUES (
  'gdp',
  '2023',
  'prefecture',
  json_object(
    'statsDataId', '0000020202',
    'cdCat01', 'B2201',
    'cdTab', '002',
    'cdTime', '2023000000'
  ),
  '都道府県別GDP (2023年度)'
);
```

---

## まとめ

### 採用すべき理由

1. **圧倒的なパフォーマンス向上**: 47〜1,700倍の高速化
2. **コスト削減**: 月額$30〜50 → $0
3. **スケーラビリティ**: データ量無制限
4. **エッジキャッシュ**: 超高速レスポンス
5. **リスク管理**: フィーチャーフラグで即座にロールバック可能
6. **e-Stat API統合**: 柔軟なパラメータマッピングで保守性向上

### 推奨事項

✅ **即座に実装開始**することを強く推奨します。

---

## 関連ドキュメント

- [統一ランキングシステム設計書](./unified-ranking-design.md)
- [ランキングデータR2移行計画書](../../../99_inbox/ranking-values-r2-migration-plan.md)
- [e-Stat R2保存実装ガイド](../../estat-api/リファクタリング/estat-ranking-data-r2-save-implementation.md)
- [アダプターレイヤー設計書](./adapter-layer-design.md)

---

**更新履歴**:
- 2025-10-16: 初版作成
- 2025-10-16: e-Stat APIパラメータマッピング機能を追加

