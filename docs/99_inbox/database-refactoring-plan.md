# データベーススキーマ リファクタリング計画

## 概要

本ドキュメントは、現在のe-Stat専用データベーススキーマを、複数のデータソースに対応可能な汎用的なスキーマへリファクタリングする計画を定義します。

**作成日**: 2025-01-13
**対象**: ranking_items, estat_ranking_values, subcategory_configs

---

## 1. 現状分析

### 1.1 現在のテーブル構造

#### `subcategory_configs` テーブル
```sql
CREATE TABLE subcategory_configs (
  id TEXT PRIMARY KEY,              -- 'land-area', 'land-use'
  category_id TEXT NOT NULL,        -- 'landweather'
  name TEXT NOT NULL,               -- '土地面積'
  description TEXT,
  default_ranking_key TEXT,
  created_at DATETIME,
  updated_at DATETIME
);
```

#### `ranking_items` テーブル
```sql
CREATE TABLE ranking_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT NOT NULL,     -- 'land-area'
  ranking_key TEXT NOT NULL,        -- 'totalAreaExcluding'
  label TEXT NOT NULL,              -- '総面積（除く）'
  stats_data_id TEXT NOT NULL,      -- '0000010102' (e-Stat専用)
  cd_cat01 TEXT NOT NULL,           -- 'B1101' (e-Stat専用)
  unit TEXT NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER,
  is_active BOOLEAN,
  -- 可視化設定
  map_color_scheme TEXT,
  map_diverging_midpoint TEXT,
  ranking_direction TEXT,
  conversion_factor REAL,
  decimal_places INTEGER,
  created_at DATETIME,
  updated_at DATETIME,
  UNIQUE(subcategory_id, ranking_key)  -- ⚠️ 一つのランキングは一つのサブカテゴリのみ
);
```

#### `estat_ranking_values` テーブル
```sql
CREATE TABLE estat_ranking_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,      -- '0000010102' (e-Stat専用)
  area_code TEXT NOT NULL,          -- '01000' (都道府県コード)
  category_code TEXT NOT NULL,      -- 'B1101' (e-Stat専用)
  time_code TEXT NOT NULL,          -- '2020000000'
  value TEXT NOT NULL,
  numeric_value REAL,
  display_value TEXT,
  rank INTEGER,
  unit TEXT,
  area_name TEXT,
  category_name TEXT,
  time_name TEXT,
  created_at DATETIME,
  updated_at DATETIME,
  UNIQUE(stats_data_id, category_code, time_code, area_code)
);
```

### 1.2 現在のデータフロー

```
┌─────────────────────┐
│ ranking_items       │
│                     │
│ ranking_key         │───┐
│ stats_data_id       │   │ 間接的な参照
│ cd_cat01           │   │ (ranking_keyを使わない)
│ subcategory_id     │   │
└─────────────────────┘   │
                          │
                          ▼
                ┌─────────────────────┐
                │ estat_ranking_values│
                │                     │
                │ stats_data_id       │◄── e-Stat APIから取得
                │ category_code       │
                │ time_code          │
                │ area_code          │
                │ numeric_value      │
                └─────────────────────┘

【データアクセスパターン】
1. ranking_items から stats_data_id + cd_cat01 を取得
2. その値を使って estat_ranking_values をクエリ
3. ranking_key は estat_ranking_values には保存されない
```

### 1.3 主要な問題点

#### 問題1: データソース固有性（汎用性の欠如）

**現状**: `estat_ranking_values` は完全にe-Stat API専用
- `stats_data_id`: e-Stat統計表ID
- `category_code`: e-Stat カテゴリコード（cdCat01）
- テーブル名が `estat_` プレフィックス

**問題**:
- 気象庁API、国土地理院API、独自データなどを追加する場合、新しいテーブル（`weather_ranking_values`, `gsi_ranking_values`）が必要
- 各データソースごとに別のコード実装が必要
- データソース横断的なランキングが困難

**例**: 「人口密度」ランキングをe-Stat、「降水量」ランキングを気象庁APIから取得したい場合、完全に別のテーブルとコードが必要になる

#### 問題2: ranking_key の未活用

**現状**: `ranking_items` に `ranking_key` があるが、`estat_ranking_values` では使用されない
```typescript
// RankingDataContainer.tsx (現在)
const { data } = useRankingData(statsDataId, cdCat01, selectedYear);
//                              ^^^^^^^^^^  ^^^^^^  ← e-Stat専用パラメータ
```

**問題**:
- `ranking_key` が設計されているのに、実際のデータ参照では `stats_data_id` + `category_code` を使用
- `ranking_key` は `ranking_items` 内でのみ意味を持ち、データ値との直接的な紐付けがない
- コード可読性が低い（`statsDataId="0000010102"` より `rankingKey="totalArea"` の方が明確）

#### 問題3: 多対多関係の制約

**現状**: UNIQUE制約 `(subcategory_id, ranking_key)` により、一つの `ranking_key` は一つのサブカテゴリにのみ属する

**問題**:
- 同じランキング項目（例: 「総面積」）を複数のサブカテゴリで使用できない
- 例: 「総面積」を「土地面積」カテゴリと「地理統計」カテゴリの両方に表示したい場合、別々の `ranking_key` を作成する必要がある

**具体例**:
```sql
-- 現在: エラーになる（UNIQUE制約違反）
INSERT INTO ranking_items (subcategory_id, ranking_key, ...)
VALUES ('land-area', 'totalArea', ...);

INSERT INTO ranking_items (subcategory_id, ranking_key, ...)
VALUES ('geography', 'totalArea', ...);  -- ❌ UNIQUE制約エラー
```

#### 問題4: データの重複と整合性

**現状**: `ranking_items` と `estat_ranking_values` に重複する情報
- `unit`: 両方のテーブルに存在
- `category_name`: `estat_ranking_values` に保存、`ranking_items.name` と重複

**問題**:
- データ整合性の維持が困難
- ストレージの無駄

#### 問題5: 拡張性の制約

**将来の要件**:
- 複数データソースの統合表示
- ユーザー定義ランキング（CSVアップロード）
- リアルタイムデータソース（APIストリーミング）

**現状**: これらの要件に対応するには大規模な設計変更が必要

---

## 2. リファクタリング目標

### 2.1 主要目標

1. **データソース非依存性**: e-Stat以外のデータソースにも対応可能な汎用的なスキーマ
2. **ranking_key の活用**: データ値の参照に `ranking_key` を使用
3. **多対多関係のサポート**: 一つのランキング項目を複数のサブカテゴリで使用可能
4. **データの正規化**: 重複データの削除と整合性の向上
5. **拡張性**: 新しいデータソースの追加が容易

### 2.2 非目標（このリファクタリングの範囲外）

- データソースの実際の追加（設計のみ、実装は将来）
- パフォーマンスチューニング（現状維持）
- UI/UXの変更（透過的なリファクタリング）

---

## 3. 新しいデータベース設計

### 3.1 設計方針

1. **データソースの抽象化**: データソース固有情報を分離
2. **ranking_key 中心設計**: ranking_key を主キーとしてデータを管理
3. **中間テーブルによる多対多**: `subcategory_ranking_items` 導入
4. **後方互換性**: 既存データの移行と既存APIの継続サポート

### 3.2 新しいテーブル構造

#### 3.2.1 `data_sources` テーブル（新規）

データソースのメタデータを管理

```sql
CREATE TABLE data_sources (
  id TEXT PRIMARY KEY,              -- 'estat', 'jma', 'gsi', 'custom'
  name TEXT NOT NULL,               -- 'e-Stat', '気象庁', '国土地理院'
  description TEXT,
  base_url TEXT,                    -- APIのベースURL
  api_version TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初期データ
INSERT INTO data_sources (id, name, description, base_url, api_version) VALUES
  ('estat', 'e-Stat', '政府統計の総合窓口', 'https://api.e-stat.go.jp', 'v3'),
  ('custom', 'カスタムデータ', 'ユーザー定義データソース', NULL, NULL);
```

#### 3.2.2 `ranking_items` テーブル（改訂版）

ランキング項目の定義（データソース非依存）

```sql
CREATE TABLE ranking_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT UNIQUE NOT NULL,   -- ✅ UNIQUE制約を変更（subcategory_idとの組み合わせから単独に）
  label TEXT NOT NULL,                -- '総面積（除く）'
  name TEXT NOT NULL,                 -- '総面積（北方地域及び竹島を除く）'
  description TEXT,                   -- 説明文
  unit TEXT NOT NULL,                 -- 'ha', '人', '℃'

  -- データソース情報（分離）
  data_source_id TEXT NOT NULL,      -- 'estat', 'jma', etc.

  -- 可視化設定（ranking_items に保持）
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',
  ranking_direction TEXT DEFAULT 'desc',
  conversion_factor REAL DEFAULT 1,
  decimal_places INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
);

CREATE INDEX idx_ranking_items_data_source ON ranking_items(data_source_id);
CREATE INDEX idx_ranking_items_active ON ranking_items(is_active);
```

**主要変更点**:
- ❌ 削除: `subcategory_id`（中間テーブルに移動）
- ❌ 削除: `stats_data_id`, `cd_cat01`（data_source_metadata に移動）
- ❌ 削除: `display_order`（中間テーブルに移動）
- ✅ 追加: `data_source_id`（データソースの抽象化）
- ✅ 変更: UNIQUE制約を `ranking_key` 単独に変更

#### 3.2.3 `subcategory_ranking_items` テーブル（新規）

サブカテゴリとランキング項目の多対多関係

```sql
CREATE TABLE subcategory_ranking_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT NOT NULL,
  ranking_item_id INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,   -- サブカテゴリ内での表示順
  is_default BOOLEAN DEFAULT 0,      -- デフォルト選択
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(subcategory_id, ranking_item_id),
  FOREIGN KEY (subcategory_id) REFERENCES subcategory_configs(id) ON DELETE CASCADE,
  FOREIGN KEY (ranking_item_id) REFERENCES ranking_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_subcategory_ranking_subcategory ON subcategory_ranking_items(subcategory_id);
CREATE INDEX idx_subcategory_ranking_item ON subcategory_ranking_items(ranking_item_id);
CREATE INDEX idx_subcategory_ranking_order ON subcategory_ranking_items(subcategory_id, display_order);
```

**役割**:
- 一つの `ranking_item` を複数のサブカテゴリに紐付け可能
- サブカテゴリごとに異なる `display_order` を設定可能

#### 3.2.4 `data_source_metadata` テーブル（新規）

データソース固有のメタデータ（e-Stat の stats_data_id など）

```sql
CREATE TABLE data_source_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_item_id INTEGER NOT NULL,
  data_source_id TEXT NOT NULL,

  -- データソース固有のキー・バリューペア（JSON）
  metadata JSON NOT NULL,
  -- 例（e-Stat）: {"stats_data_id": "0000010102", "cd_cat01": "B1101"}
  -- 例（気象庁）: {"station_id": "47662", "element_id": "temperature"}

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(ranking_item_id, data_source_id),
  FOREIGN KEY (ranking_item_id) REFERENCES ranking_items(id) ON DELETE CASCADE,
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
);

CREATE INDEX idx_data_source_metadata_ranking ON data_source_metadata(ranking_item_id);
CREATE INDEX idx_data_source_metadata_source ON data_source_metadata(data_source_id);
```

**役割**:
- e-Stat の `stats_data_id`, `cd_cat01` などの固有情報を保存
- 他のデータソースの固有情報も同様に保存可能
- JSON形式で柔軟に拡張可能

#### 3.2.5 `ranking_values` テーブル（新規、汎用版）

すべてのデータソースのランキング値を統一管理

```sql
CREATE TABLE ranking_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- ✅ ranking_key を使用（データソース非依存）
  ranking_key TEXT NOT NULL,

  -- 地域情報
  area_code TEXT NOT NULL,          -- '01000' (都道府県コード)
  area_name TEXT,                   -- '北海道'

  -- 時間情報
  time_code TEXT NOT NULL,          -- '2020000000', '2023-01-01'
  time_name TEXT,                   -- '2020年', '2023年1月'

  -- データ値
  value TEXT NOT NULL,              -- 元の値（文字列）
  numeric_value REAL,               -- 数値変換後
  display_value TEXT,               -- 表示用（フォーマット済み）
  rank INTEGER,                     -- ランキング順位

  -- システム情報
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- ✅ ranking_key ベースの UNIQUE 制約
  UNIQUE(ranking_key, time_code, area_code),
  FOREIGN KEY (ranking_key) REFERENCES ranking_items(ranking_key) ON DELETE CASCADE
);

CREATE INDEX idx_ranking_values_lookup ON ranking_values(ranking_key, time_code);
CREATE INDEX idx_ranking_values_area ON ranking_values(area_code);
CREATE INDEX idx_ranking_values_time ON ranking_values(time_code);
```

**主要変更点**:
- ✅ `ranking_key` を外部キーとして使用（`stats_data_id` + `category_code` の代わり）
- ❌ 削除: `stats_data_id`, `category_code`（データソース固有情報）
- ✅ 変更: UNIQUE制約を `(ranking_key, time_code, area_code)` に変更
- ❌ 削除: `category_name`（`ranking_items.name` から取得）
- ✅ 保持: `unit` は削除（`ranking_items.unit` から取得）

#### 3.2.6 `subcategory_configs` テーブル（小修正）

```sql
-- 変更点: default_ranking_key を default_ranking_item_id に変更
ALTER TABLE subcategory_configs
  DROP COLUMN default_ranking_key;

ALTER TABLE subcategory_configs
  ADD COLUMN default_ranking_item_id INTEGER REFERENCES ranking_items(id);
```

### 3.3 新しいER図（テキスト表記）

```
┌─────────────────────┐
│ data_sources        │
│ ─────────────────── │
│ id (PK)            │
│ name               │
│ base_url           │
└─────────────────────┘
         △
         │
         │ (FK: data_source_id)
         │
┌─────────────────────┐       ┌──────────────────────────┐
│ ranking_items       │       │ data_source_metadata     │
│ ─────────────────── │       │ ──────────────────────── │
│ id (PK)            │◄──────│ ranking_item_id (FK)     │
│ ranking_key (UK)   │       │ data_source_id (FK)      │
│ label              │       │ metadata (JSON)          │
│ name               │       │ - stats_data_id          │
│ unit               │       │ - cd_cat01               │
│ data_source_id (FK)│       │ - station_id, etc.       │
│ map_color_scheme   │       └──────────────────────────┘
└─────────────────────┘
         △
         │
         │ (FK: ranking_item_id)
         │
┌─────────────────────────────┐
│ subcategory_ranking_items   │ ◄─┐
│ ─────────────────────────── │   │
│ id (PK)                    │   │ (FK: subcategory_id)
│ subcategory_id (FK)        │   │
│ ranking_item_id (FK)       │   │
│ display_order              │   │
│ is_default                 │   │
└─────────────────────────────┘   │
                                  │
                    ┌─────────────────────┐
                    │ subcategory_configs │
                    │ ─────────────────── │
                    │ id (PK)            │
                    │ category_id        │
                    │ name               │
                    └─────────────────────┘

┌─────────────────────┐
│ ranking_values      │
│ ─────────────────── │
│ id (PK)            │
│ ranking_key (FK)   │◄────────────────┐
│ area_code          │                 │
│ time_code          │                 │ (参照)
│ numeric_value      │                 │
│ rank               │                 │
└─────────────────────┘                 │
                                        │
                        ┌───────────────┘
                        │
                ranking_items.ranking_key
```

### 3.4 データアクセスパターンの変更

#### 変更前（現在）

```typescript
// RankingDataContainer.tsx
const { data } = useRankingData(statsDataId, cdCat01, selectedYear);
//                              ^^^^^^^^^^  ^^^^^^  ← e-Stat専用

// EstatRelationalCacheService.ts
const result = await db
  .prepare(`
    SELECT * FROM estat_ranking_values
    WHERE stats_data_id = ? AND category_code = ? AND time_code = ?
  `)
  .bind(statsDataId, categoryCode, timeCode)
  .all();
```

#### 変更後（新設計）

```typescript
// RankingDataContainer.tsx
const { data } = useRankingData(rankingKey, selectedYear);
//                              ^^^^^^^^^^  ← データソース非依存

// RankingCacheService.ts（汎用版）
const result = await db
  .prepare(`
    SELECT * FROM ranking_values
    WHERE ranking_key = ? AND time_code = ?
  `)
  .bind(rankingKey, timeCode)
  .all();
```

**利点**:
- コードがシンプルで読みやすい
- データソースを意識しない統一的なAPI
- `rankingKey="totalArea"` のように意味のある識別子を使用

---

## 4. マイグレーション戦略

### 4.1 基本方針

1. **段階的移行**: 一度にすべてを変更せず、段階的にリファクタリング
2. **並行運用**: 新旧テーブルを並行運用し、徐々に移行
3. **ロールバック可能**: 各フェーズでロールバック可能な設計
4. **ゼロダウンタイム**: ユーザーへの影響を最小化

### 4.2 マイグレーションフェーズ

#### フェーズ1: 新テーブルの作成（影響なし）

**期間**: 1-2日
**リスク**: 低

**作業内容**:
1. 新テーブルの作成
   - `data_sources`
   - `ranking_items`（新版）
   - `subcategory_ranking_items`
   - `data_source_metadata`
   - `ranking_values`

2. インデックスの作成

**SQLマイグレーション**:
```sql
-- database/migrations/004_create_new_ranking_schema.sql

-- 1. データソーステーブル
CREATE TABLE IF NOT EXISTS data_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_url TEXT,
  api_version TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO data_sources (id, name, description, base_url, api_version) VALUES
  ('estat', 'e-Stat', '政府統計の総合窓口', 'https://api.e-stat.go.jp', 'v3'),
  ('custom', 'カスタムデータ', 'ユーザー定義データソース', NULL, NULL);

-- 2. 新しいranking_itemsテーブル
CREATE TABLE IF NOT EXISTS ranking_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  data_source_id TEXT NOT NULL,
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',
  ranking_direction TEXT DEFAULT 'desc',
  conversion_factor REAL DEFAULT 1,
  decimal_places INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
);

CREATE INDEX idx_ranking_items_new_data_source ON ranking_items_new(data_source_id);
CREATE INDEX idx_ranking_items_new_active ON ranking_items_new(is_active);

-- 3. 多対多中間テーブル
CREATE TABLE IF NOT EXISTS subcategory_ranking_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT NOT NULL,
  ranking_item_id INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subcategory_id, ranking_item_id),
  FOREIGN KEY (subcategory_id) REFERENCES subcategory_configs(id) ON DELETE CASCADE,
  FOREIGN KEY (ranking_item_id) REFERENCES ranking_items_new(id) ON DELETE CASCADE
);

CREATE INDEX idx_subcategory_ranking_subcategory ON subcategory_ranking_items(subcategory_id);
CREATE INDEX idx_subcategory_ranking_item ON subcategory_ranking_items(ranking_item_id);

-- 4. データソースメタデータテーブル
CREATE TABLE IF NOT EXISTS data_source_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_item_id INTEGER NOT NULL,
  data_source_id TEXT NOT NULL,
  metadata TEXT NOT NULL, -- JSON形式
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ranking_item_id, data_source_id),
  FOREIGN KEY (ranking_item_id) REFERENCES ranking_items_new(id) ON DELETE CASCADE,
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
);

CREATE INDEX idx_data_source_metadata_ranking ON data_source_metadata(ranking_item_id);

-- 5. 新しいranking_valuesテーブル
CREATE TABLE IF NOT EXISTS ranking_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  area_code TEXT NOT NULL,
  area_name TEXT,
  time_code TEXT NOT NULL,
  time_name TEXT,
  value TEXT NOT NULL,
  numeric_value REAL,
  display_value TEXT,
  rank INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ranking_key, time_code, area_code)
);

CREATE INDEX idx_ranking_values_lookup ON ranking_values(ranking_key, time_code);
CREATE INDEX idx_ranking_values_area ON ranking_values(area_code);
```

**確認方法**:
```bash
# D1データベースで確認
npx wrangler d1 execute stats47-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

---

#### フェーズ2: データ移行（読み取り専用）

**期間**: 1-2日
**リスク**: 中

**作業内容**:
1. 既存データを新テーブルに移行
   - `ranking_items` → `ranking_items_new` + `data_source_metadata` + `subcategory_ranking_items`
   - `estat_ranking_values` → `ranking_values`

2. データ整合性の検証

**SQLマイグレーション**:
```sql
-- database/migrations/005_migrate_data_to_new_schema.sql

-- 1. ranking_items のデータ移行
INSERT INTO ranking_items_new (
  ranking_key, label, name, description, unit, data_source_id,
  map_color_scheme, map_diverging_midpoint, ranking_direction,
  conversion_factor, decimal_places, is_active, created_at, updated_at
)
SELECT
  ranking_key,
  label,
  name,
  NULL as description, -- 既存データにはないため
  unit,
  'estat' as data_source_id, -- すべてe-Stat由来
  map_color_scheme,
  map_diverging_midpoint,
  ranking_direction,
  conversion_factor,
  decimal_places,
  is_active,
  created_at,
  updated_at
FROM ranking_items;

-- 2. data_source_metadata にe-Stat固有情報を移行
INSERT INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
SELECT
  ri_new.id,
  'estat',
  json_object(
    'stats_data_id', ri_old.stats_data_id,
    'cd_cat01', ri_old.cd_cat01
  )
FROM ranking_items ri_old
JOIN ranking_items_new ri_new ON ri_old.ranking_key = ri_new.ranking_key;

-- 3. subcategory_ranking_items に多対多関係を移行
INSERT INTO subcategory_ranking_items (
  subcategory_id, ranking_item_id, display_order, is_default
)
SELECT
  ri_old.subcategory_id,
  ri_new.id,
  ri_old.display_order,
  CASE WHEN sc.default_ranking_key = ri_old.ranking_key THEN 1 ELSE 0 END
FROM ranking_items ri_old
JOIN ranking_items_new ri_new ON ri_old.ranking_key = ri_new.ranking_key
JOIN subcategory_configs sc ON ri_old.subcategory_id = sc.id;

-- 4. estat_ranking_values を ranking_values に移行
INSERT INTO ranking_values (
  ranking_key, area_code, area_name, time_code, time_name,
  value, numeric_value, display_value, rank, created_at, updated_at
)
SELECT
  ri_new.ranking_key,
  erv.area_code,
  erv.area_name,
  erv.time_code,
  erv.time_name,
  erv.value,
  erv.numeric_value,
  erv.display_value,
  erv.rank,
  erv.created_at,
  erv.updated_at
FROM estat_ranking_values erv
JOIN data_source_metadata dsm ON
  json_extract(dsm.metadata, '$.stats_data_id') = erv.stats_data_id
  AND json_extract(dsm.metadata, '$.cd_cat01') = erv.category_code
JOIN ranking_items_new ri_new ON dsm.ranking_item_id = ri_new.id;

-- 5. データ整合性チェック
-- 旧テーブルと新テーブルの件数比較
SELECT
  'ranking_items' as table_name,
  (SELECT COUNT(*) FROM ranking_items) as old_count,
  (SELECT COUNT(*) FROM ranking_items_new) as new_count;

SELECT
  'ranking_values' as table_name,
  (SELECT COUNT(*) FROM estat_ranking_values) as old_count,
  (SELECT COUNT(*) FROM ranking_values) as new_count;
```

**検証スクリプト**:
```typescript
// scripts/verify-migration.ts
import { createD1Database } from "@/lib/d1-client";

async function verifyMigration() {
  const db = await createD1Database();

  // 1. 件数チェック
  const oldCount = await db.prepare("SELECT COUNT(*) as count FROM ranking_items").first();
  const newCount = await db.prepare("SELECT COUNT(*) as count FROM ranking_items_new").first();

  console.log("✓ ranking_items:", oldCount.count, "→", newCount.count);

  // 2. ランダムサンプルで内容チェック
  const samples = await db.prepare(`
    SELECT ranking_key FROM ranking_items ORDER BY RANDOM() LIMIT 5
  `).all();

  for (const sample of samples.results) {
    const oldData = await db.prepare(`
      SELECT * FROM ranking_items WHERE ranking_key = ?
    `).bind(sample.ranking_key).first();

    const newData = await db.prepare(`
      SELECT * FROM ranking_items_new WHERE ranking_key = ?
    `).bind(sample.ranking_key).first();

    console.log("✓", sample.ranking_key, ":", oldData.label === newData.label);
  }
}
```

---

#### フェーズ3: アダプターレイヤーの実装（後方互換性）

**期間**: 2-3日
**リスク**: 中

**作業内容**:
1. 既存APIを新テーブルにマッピングするアダプターを実装
2. 既存コンポーネントは変更せず、アダプターで吸収

**実装例**:
```typescript
// lib/ranking/adapters/RankingDataAdapter.ts

/**
 * 旧API（stats_data_id + category_code）を新API（ranking_key）に変換
 */
export class RankingDataAdapter {
  /**
   * stats_data_id + cd_cat01 から ranking_key を取得
   */
  static async getRankingKeyFromLegacy(
    statsDataId: string,
    cdCat01: string
  ): Promise<string | null> {
    const db = await createD1Database();

    const result = await db
      .prepare(`
        SELECT ri.ranking_key
        FROM ranking_items_new ri
        JOIN data_source_metadata dsm ON ri.id = dsm.ranking_item_id
        WHERE json_extract(dsm.metadata, '$.stats_data_id') = ?
          AND json_extract(dsm.metadata, '$.cd_cat01') = ?
      `)
      .bind(statsDataId, cdCat01)
      .first();

    return result?.ranking_key || null;
  }

  /**
   * 旧形式のデータ取得（内部で新テーブルを使用）
   */
  static async getRankingDataLegacy(
    statsDataId: string,
    categoryCode: string,
    timeCode: string
  ): Promise<FormattedValue[]> {
    // 1. ranking_key を取得
    const rankingKey = await this.getRankingKeyFromLegacy(statsDataId, categoryCode);

    if (!rankingKey) {
      throw new Error(`No ranking_key found for ${statsDataId}/${categoryCode}`);
    }

    // 2. 新テーブルからデータ取得
    return await RankingCacheService.getRankingData(rankingKey, timeCode);
  }
}

// lib/ranking/RankingCacheService.ts（新版）

/**
 * 汎用ランキングキャッシュサービス
 */
export class RankingCacheService {
  /**
   * ranking_key でデータ取得（データソース非依存）
   */
  static async getRankingData(
    rankingKey: string,
    timeCode: string
  ): Promise<FormattedValue[]> {
    const db = await createD1Database();

    const result = await db
      .prepare(`
        SELECT
          rv.value,
          rv.numeric_value,
          rv.display_value,
          rv.rank,
          rv.area_code,
          rv.area_name,
          rv.time_code,
          rv.time_name,
          ri.unit,
          ri.name as category_name
        FROM ranking_values rv
        JOIN ranking_items_new ri ON rv.ranking_key = ri.ranking_key
        WHERE rv.ranking_key = ? AND rv.time_code = ?
        ORDER BY rv.rank ASC
      `)
      .bind(rankingKey, timeCode)
      .all();

    return result.results.map((row: any) => ({
      value: row.value,
      numericValue: row.numeric_value,
      displayValue: row.display_value,
      rank: row.rank,
      areaCode: row.area_code,
      areaName: row.area_name,
      timeCode: row.time_code,
      timeName: row.time_name,
      unit: row.unit,
      categoryName: row.category_name,
    }));
  }
}
```

**既存APIの修正**:
```typescript
// app/api/estat-api/ranking/data/route.ts

// ❌ 変更前
export async function GET(request: Request) {
  const { statsDataId, categoryCode, timeCode } = parseQuery(request);

  // 旧テーブルから直接取得
  const data = await EstatRelationalCacheService.getRankingData(
    statsDataId,
    categoryCode,
    timeCode
  );

  return Response.json({ data });
}

// ✅ 変更後（アダプター使用）
export async function GET(request: Request) {
  const { statsDataId, categoryCode, timeCode } = parseQuery(request);

  // アダプターで新テーブルにマッピング
  const data = await RankingDataAdapter.getRankingDataLegacy(
    statsDataId,
    categoryCode,
    timeCode
  );

  return Response.json({ data });
}
```

---

#### フェーズ4: 新APIの実装と移行

**期間**: 3-4日
**リスク**: 中

**作業内容**:
1. 新しいranking_key ベースのAPIエンドポイント作成
2. コンポーネントを新APIに段階的に移行
3. 既存APIは当面維持（非推奨マーク）

**新APIエンドポイント**:
```typescript
// app/api/ranking/data/route.ts（新版）

/**
 * 新API: ranking_key ベースのデータ取得
 *
 * GET /api/ranking/data?rankingKey=totalArea&timeCode=2020000000
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rankingKey = searchParams.get("rankingKey");
  const timeCode = searchParams.get("timeCode");

  if (!rankingKey || !timeCode) {
    return Response.json(
      { error: "rankingKey and timeCode are required" },
      { status: 400 }
    );
  }

  try {
    const data = await RankingCacheService.getRankingData(rankingKey, timeCode);
    return Response.json({ data });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// app/api/ranking/years/route.ts（新版）

/**
 * 新API: ranking_key の利用可能年度取得
 *
 * GET /api/ranking/years?rankingKey=totalArea
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rankingKey = searchParams.get("rankingKey");

  if (!rankingKey) {
    return Response.json(
      { error: "rankingKey is required" },
      { status: 400 }
    );
  }

  try {
    const years = await RankingCacheService.getAvailableYears(rankingKey);
    return Response.json({ years });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**コンポーネントの移行**:
```typescript
// components/ranking/containers/RankingDataContainer.tsx

// ❌ 変更前
export const RankingDataContainer: React.FC<Props> = ({
  statsDataId,
  cdCat01,
  subcategory,
  ...
}) => {
  const { data } = useRankingData(statsDataId, cdCat01, selectedYear);
  // ...
};

// ✅ 変更後
export const RankingDataContainer: React.FC<Props> = ({
  rankingKey,  // ← 変更
  subcategory,
  ...
}) => {
  const { data } = useRankingData(rankingKey, selectedYear);  // ← シンプル
  // ...
};
```

**カスタムフックの更新**:
```typescript
// hooks/ranking/useRankingData.ts

// ✅ 新版
export function useRankingData(rankingKey: string, timeCode: string) {
  return useSWR(
    rankingKey && timeCode
      ? `/api/ranking/data?rankingKey=${rankingKey}&timeCode=${timeCode}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1分間は同じリクエストを重複排除
    }
  );
}

export function useRankingYears(rankingKey: string) {
  const { data, error, isLoading } = useSWR(
    rankingKey ? `/api/ranking/years?rankingKey=${rankingKey}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5分間キャッシュ
    }
  );

  return {
    years: data?.years || [],
    isLoading,
    error,
  };
}
```

---

#### フェーズ5: 旧テーブルの削除

**期間**: 1日
**リスク**: 高（不可逆）

**前提条件**:
- すべてのコンポーネントが新APIに移行済み
- 旧APIのアクセスログがゼロ（1週間以上）
- 本番環境で新スキーマが安定稼働（2週間以上）

**作業内容**:
1. 旧テーブルのリネーム（バックアップ）
2. 2週間の猶予期間
3. 問題なければ完全削除

**SQLマイグレーション**:
```sql
-- database/migrations/006_remove_old_schema.sql

-- ステップ1: 旧テーブルをバックアップ用にリネーム
ALTER TABLE ranking_items RENAME TO ranking_items_old_backup;
ALTER TABLE estat_ranking_values RENAME TO estat_ranking_values_old_backup;

-- ステップ2: 新テーブルを正式名称に変更
ALTER TABLE ranking_items_new RENAME TO ranking_items;

-- ステップ3: 2週間後、問題なければバックアップを削除
-- DROP TABLE ranking_items_old_backup;
-- DROP TABLE estat_ranking_values_old_backup;
```

---

### 4.3 ロールバック戦略

各フェーズでのロールバック手順

#### フェーズ1のロールバック

```sql
-- 新テーブルを削除するだけ（既存データに影響なし）
DROP TABLE IF EXISTS ranking_values;
DROP TABLE IF EXISTS data_source_metadata;
DROP TABLE IF EXISTS subcategory_ranking_items;
DROP TABLE IF EXISTS ranking_items_new;
DROP TABLE IF EXISTS data_sources;
```

#### フェーズ2-4のロールバック

```sql
-- 新テーブルのデータを削除
DELETE FROM ranking_values;
DELETE FROM data_source_metadata;
DELETE FROM subcategory_ranking_items;
DELETE FROM ranking_items_new;

-- アプリケーションコードを前のバージョンにロールバック
git revert <commit-hash>
```

#### フェーズ5のロールバック

```sql
-- バックアップから復元
ALTER TABLE ranking_items_old_backup RENAME TO ranking_items;
ALTER TABLE estat_ranking_values_old_backup RENAME TO estat_ranking_values;

-- 新テーブルを削除
DROP TABLE ranking_items;  -- (旧名: ranking_items_new)
DROP TABLE ranking_values;
```

---

## 5. 実装への影響

### 5.1 APIの変更

#### 影響を受けるAPIエンドポイント

| エンドポイント | 変更内容 | 後方互換性 |
|---|---|---|
| `/api/estat-api/ranking/data` | アダプター経由で新テーブル使用 | ✅ 維持（非推奨） |
| `/api/estat-api/ranking/years` | アダプター経由で新テーブル使用 | ✅ 維持（非推奨） |
| `/api/ranking/data` | 新規作成（ranking_key ベース） | - |
| `/api/ranking/years` | 新規作成（ranking_key ベース） | - |
| `/api/ranking-items/*` | ranking_items_new を参照 | ⚠️ 要修正 |

### 5.2 コンポーネントの変更

#### 影響を受けるコンポーネント

| コンポーネント | 変更内容 | 優先度 |
|---|---|---|
| `RankingDataContainer` | propsを `statsDataId`+`cdCat01` から `rankingKey` に変更 | 高 |
| `EstatRankingClient` | 同上 | 高 |
| `RankingItemSettings` | ranking_items_new を参照 | 中 |
| `useRankingData` | 新APIを使用 | 高 |
| `useRankingYears` | 新APIを使用 | 高 |

#### 変更例（RankingDataContainer）

```typescript
// ❌ 変更前
interface RankingDataContainerProps {
  statsDataId: string;  // '0000010102'
  cdCat01: string;      // 'B1101'
  subcategory: SubcategoryData;
}

// ✅ 変更後
interface RankingDataContainerProps {
  rankingKey: string;   // 'totalAreaExcluding'
  subcategory: SubcategoryData;
}

// 親コンポーネントでの呼び出し
// ❌ 変更前
<RankingDataContainer
  statsDataId="0000010102"
  cdCat01="B1101"
  subcategory={subcategory}
/>

// ✅ 変更後
<RankingDataContainer
  rankingKey="totalAreaExcluding"
  subcategory={subcategory}
/>
```

### 5.3 型定義の変更

```typescript
// types/models/ranking.ts

// ❌ 削除される型
export interface RankingItemLegacy {
  id: number;
  subcategory_id: string;
  ranking_key: string;
  stats_data_id: string;  // ← 削除
  cd_cat01: string;        // ← 削除
  // ...
}

// ✅ 新しい型
export interface RankingItem {
  id: number;
  ranking_key: string;     // ← 一意の識別子
  label: string;
  name: string;
  unit: string;
  data_source_id: string;  // ← 追加
  // 可視化設定
  map_color_scheme: string;
  ranking_direction: "asc" | "desc";
  conversion_factor: number;
  decimal_places: number;
  // ...
}

export interface DataSourceMetadata {
  id: number;
  ranking_item_id: number;
  data_source_id: string;
  metadata: {
    stats_data_id?: string;  // e-Statの場合
    cd_cat01?: string;       // e-Statの場合
    station_id?: string;     // 気象庁APIの場合
    element_id?: string;     // 気象庁APIの場合
    // データソースごとに異なる
  };
}

export interface SubcategoryRankingItem {
  id: number;
  subcategory_id: string;
  ranking_item_id: number;
  display_order: number;
  is_default: boolean;
}
```

---

## 6. テスト戦略

### 6.1 テストカテゴリ

#### 1. マイグレーションテスト

**目的**: データが正確に移行されたか検証

```typescript
// tests/migration/data-integrity.test.ts

describe("データ移行の整合性", () => {
  it("ranking_items の件数が一致する", async () => {
    const oldCount = await db.prepare("SELECT COUNT(*) FROM ranking_items_old_backup").first();
    const newCount = await db.prepare("SELECT COUNT(*) FROM ranking_items").first();
    expect(newCount).toBe(oldCount);
  });

  it("ranking_key がすべて移行されている", async () => {
    const oldKeys = await db.prepare("SELECT ranking_key FROM ranking_items_old_backup").all();
    const newKeys = await db.prepare("SELECT ranking_key FROM ranking_items").all();
    expect(newKeys).toEqual(expect.arrayContaining(oldKeys));
  });

  it("data_source_metadata に e-Stat 情報が保存されている", async () => {
    const result = await db.prepare(`
      SELECT dsm.metadata
      FROM data_source_metadata dsm
      JOIN ranking_items ri ON dsm.ranking_item_id = ri.id
      WHERE ri.ranking_key = 'totalAreaExcluding'
    `).first();

    const metadata = JSON.parse(result.metadata);
    expect(metadata.stats_data_id).toBe("0000010102");
    expect(metadata.cd_cat01).toBe("B1101");
  });

  it("ranking_values に全データが移行されている", async () => {
    const oldCount = await db.prepare("SELECT COUNT(*) FROM estat_ranking_values_old_backup").first();
    const newCount = await db.prepare("SELECT COUNT(*) FROM ranking_values").first();
    expect(newCount).toBe(oldCount);
  });
});
```

#### 2. APIテスト

**目的**: 新旧APIが同じ結果を返すか検証

```typescript
// tests/api/ranking-api.test.ts

describe("ランキングAPI", () => {
  describe("後方互換性", () => {
    it("旧API（statsDataId+cdCat01）が正常に動作する", async () => {
      const response = await fetch(
        "/api/estat-api/ranking/data?statsDataId=0000010102&categoryCode=B1101&timeCode=2020000000"
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(47); // 47都道府県
    });
  });

  describe("新API", () => {
    it("ranking_key でデータ取得できる", async () => {
      const response = await fetch(
        "/api/ranking/data?rankingKey=totalAreaExcluding&timeCode=2020000000"
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(47);
    });

    it("旧APIと新APIの結果が一致する", async () => {
      const oldResponse = await fetch(
        "/api/estat-api/ranking/data?statsDataId=0000010102&categoryCode=B1101&timeCode=2020000000"
      );
      const newResponse = await fetch(
        "/api/ranking/data?rankingKey=totalAreaExcluding&timeCode=2020000000"
      );

      const oldData = await oldResponse.json();
      const newData = await newResponse.json();

      expect(newData.data).toEqual(oldData.data);
    });
  });
});
```

#### 3. コンポーネントテスト

**目的**: UIコンポーネントが正常に動作するか検証

```typescript
// tests/components/RankingDataContainer.test.tsx

describe("RankingDataContainer", () => {
  it("ranking_key でデータを取得・表示する", async () => {
    render(
      <RankingDataContainer
        rankingKey="totalAreaExcluding"
        subcategory={mockSubcategory}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("北海道")).toBeInTheDocument();
      expect(screen.getByText("1位")).toBeInTheDocument();
    });
  });

  it("データ取得エラー時にエラー表示する", async () => {
    // APIをモック（エラー）
    server.use(
      rest.get("/api/ranking/data", (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: "Internal Server Error" }));
      })
    );

    render(<RankingDataContainer rankingKey="invalid" subcategory={mockSubcategory} />);

    await waitFor(() => {
      expect(screen.getByText(/エラーが発生しました/i)).toBeInTheDocument();
    });
  });
});
```

#### 4. 統合テスト

**目的**: エンドツーエンドでの動作検証

```typescript
// tests/e2e/ranking-flow.test.ts

describe("ランキング機能のE2Eテスト", () => {
  it("サブカテゴリ選択 → ランキング項目選択 → データ表示", async () => {
    await page.goto("/landweather/land-area");

    // ランキング項目を選択
    await page.click('[data-testid="ranking-select"]');
    await page.click('text=総面積（除く）');

    // データが表示されることを確認
    await expect(page.locator("text=北海道")).toBeVisible();
    await expect(page.locator("text=1位")).toBeVisible();

    // 年度変更
    await page.selectOption('[data-testid="year-select"]', '2019000000');

    // データが更新されることを確認
    await expect(page.locator('[data-testid="data-year"]')).toHaveText("2019年");
  });
});
```

### 6.2 テスト実行計画

| フェーズ | テストタイプ | タイミング |
|---|---|---|
| フェーズ1 | スキーマテスト | テーブル作成後 |
| フェーズ2 | マイグレーションテスト | データ移行後 |
| フェーズ3 | APIテスト（後方互換性） | アダプター実装後 |
| フェーズ4 | APIテスト（新API）、コンポーネントテスト | 新API実装後 |
| フェーズ5 | 統合テスト、E2Eテスト | 旧テーブル削除前 |

---

## 7. 実装スケジュール

### 7.1 推奨スケジュール（3-4週間）

| 週 | フェーズ | 作業内容 | 期間 | リスク |
|---|---|---|---|---|
| 1週目 | フェーズ1 | 新テーブル作成 | 1-2日 | 低 |
| 1週目 | フェーズ2 | データ移行・検証 | 2-3日 | 中 |
| 2週目 | フェーズ3 | アダプター実装 | 3-4日 | 中 |
| 3週目 | フェーズ4 | 新API実装・コンポーネント移行 | 4-5日 | 中 |
| 4週目 | - | テスト・検証期間 | 3-5日 | - |
| 5週目以降 | フェーズ5 | 旧テーブル削除（慎重に） | 1日 | 高 |

### 7.2 クリティカルパス

```
新テーブル作成 → データ移行 → アダプター実装 → 新API実装 → コンポーネント移行 → テスト → 旧テーブル削除
     ↓              ↓              ↓              ↓              ↓           ↓          ↓
   1-2日         2-3日          3-4日          4-5日          2-3日       3-5日      1日
   (低)          (中)           (中)           (中)           (中)        (低)       (高)
```

**合計期間**: 約 16-23 日（3-4週間）

### 7.3 並行作業の可能性

以下の作業は並行実行可能:
- フェーズ1（新テーブル作成）とテストコードの作成
- フェーズ3（アダプター実装）とドキュメント更新
- フェーズ4（新API実装）と型定義の更新

**並行作業時の最短期間**: 約 12-15 日（2-3週間）

---

## 8. リスク管理

### 8.1 リスク一覧

| リスク | 影響 | 確率 | 対策 |
|---|---|---|---|
| データ移行の不整合 | 高 | 中 | 詳細な検証スクリプト、バックアップ |
| 既存APIの互換性破壊 | 高 | 低 | アダプターレイヤー、段階的移行 |
| パフォーマンス劣化 | 中 | 低 | インデックス最適化、キャッシング |
| 予期しないバグ | 中 | 中 | 包括的なテスト、段階的ロールアウト |
| スケジュール遅延 | 中 | 中 | バッファを含むスケジュール |

### 8.2 緊急時の対応

#### データ不整合が発見された場合
1. 即座にロールバック（フェーズ別のロールバック手順に従う）
2. 原因調査（SQLログ、アプリケーションログ）
3. 修正後、再度マイグレーション実行

#### パフォーマンス問題が発生した場合
1. スロークエリログの分析
2. インデックスの追加（`EXPLAIN QUERY PLAN` で確認）
3. キャッシュ戦略の見直し

#### 本番環境での障害
1. 旧テーブルにフォールバック（バックアップから復元）
2. 障害原因の特定
3. ステージング環境で再検証後、再度デプロイ

---

## 9. 成功基準

### 9.1 技術的成功基準

- [ ] すべてのテストがパス（ユニット、統合、E2E）
- [ ] データ移行の整合性100%（旧データと新データが完全一致）
- [ ] APIレスポンスタイムが現状より遅くならない（±10%以内）
- [ ] 新APIで100%のカバレッジ（すべてのコンポーネントが移行済み）
- [ ] ゼロダウンタイム（ユーザーへの影響なし）

### 9.2 ビジネス的成功基準

- [ ] 新しいデータソース（例: 気象庁API）の追加が容易（1日以内）
- [ ] 一つのランキング項目を複数サブカテゴリで使用可能
- [ ] コード可読性の向上（`rankingKey="totalArea"` のような意味のある識別子）
- [ ] 開発速度の向上（新機能追加が20-30%高速化）

---

## 10. 今後の拡張性

### 10.1 新しいデータソースの追加（例: 気象庁API）

**手順**:
1. `data_sources` にレコード追加
```sql
INSERT INTO data_sources (id, name, description, base_url)
VALUES ('jma', '気象庁', '気象データAPI', 'https://www.jma.go.jp/bosai/');
```

2. `ranking_items` に新しい項目追加
```sql
INSERT INTO ranking_items (ranking_key, label, name, unit, data_source_id)
VALUES ('annualPrecipitation', '年間降水量', '年間降水量（平年値）', 'mm', 'jma');
```

3. `data_source_metadata` に気象庁API固有情報を保存
```sql
INSERT INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (
  (SELECT id FROM ranking_items WHERE ranking_key = 'annualPrecipitation'),
  'jma',
  json_object('station_type', 'amedas', 'element', 'precipitation')
);
```

4. データ取得サービスを実装
```typescript
// lib/jma/JmaDataService.ts
export class JmaDataService {
  static async fetchPrecipitationData(stationType: string, element: string) {
    // 気象庁APIからデータ取得
    // ...

    // ranking_values に保存
    await RankingCacheService.saveRankingData('annualPrecipitation', data);
  }
}
```

**所要時間**: 約1日（データソースAPI連携を除く）

### 10.2 ユーザー定義ランキング

CSVアップロードによるカスタムランキング

```sql
-- ユーザーがCSVアップロード
INSERT INTO ranking_items (ranking_key, label, name, unit, data_source_id)
VALUES ('customPopulationDensity', '人口密度（独自）', 'ユーザー定義人口密度', '人/km²', 'custom');

-- CSVデータをranking_valuesに保存
INSERT INTO ranking_values (ranking_key, area_code, time_code, numeric_value, ...)
SELECT 'customPopulationDensity', area_code, '2023', value, ...
FROM csv_upload_temp;
```

### 10.3 リアルタイムデータソース

WebSocket/SSEによるリアルタイム更新

```typescript
// lib/realtime/RealtimeRankingService.ts
export class RealtimeRankingService {
  static subscribeToRanking(rankingKey: string, callback: (data: FormattedValue[]) => void) {
    const ws = new WebSocket(`wss://api.example.com/ranking/${rankingKey}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // ranking_values を更新
      RankingCacheService.saveRankingData(rankingKey, data);

      callback(data);
    };
  }
}
```

---

## 11. 参考資料

### 11.1 関連ドキュメント

- [認証機能の分析と改善](./authentication-analysis-and-improvement.md)
- [ランキングコンポーネントのリファクタリング](./ranking-components-refactoring.md)
- [useSWRリファクタリング分析](./useswr-refactoring-analysis.md)

### 11.2 データベース設計の参考文献

- [Database Normalization (正規化)](https://en.wikipedia.org/wiki/Database_normalization)
- [Multi-tenant Data Architecture](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/data-partitioning)
- [SQLite JSON Functions](https://www.sqlite.org/json1.html)

### 11.3 マイグレーション戦略の参考

- [Zero-Downtime Database Migrations](https://stripe.com/blog/online-migrations)
- [Evolutionary Database Design](https://martinfowler.com/articles/evodb.html)

---

## 12. まとめ

本リファクタリング計画により、以下の目標を達成します：

### 達成される改善

1. **汎用性の向上**
   - e-Stat専用からマルチデータソース対応へ
   - 新しいデータソースの追加が容易（1日以内）

2. **設計の明確化**
   - `ranking_key` を中心としたシンプルなデータフロー
   - データソース固有情報の分離

3. **柔軟性の向上**
   - 一つのランキング項目を複数サブカテゴリで使用可能
   - ユーザー定義ランキングのサポート

4. **保守性の向上**
   - コード可読性の向上（意味のある識別子）
   - データの正規化による整合性向上

### 実装の要点

- **段階的移行**: 一度に変更せず、5フェーズに分けて慎重に実施
- **後方互換性**: アダプターレイヤーで既存APIを維持
- **ゼロダウンタイム**: ユーザーへの影響を最小化
- **ロールバック可能**: 各フェーズで元に戻せる設計

### 推奨アクション

1. **即座に開始可能**: フェーズ1（新テーブル作成）はリスクゼロで開始可能
2. **段階的実施**: 3-4週間かけて慎重に実施
3. **テストの徹底**: 各フェーズで包括的なテストを実施
4. **ドキュメント更新**: 実装と並行してドキュメントを更新

---

**作成者**: Claude Code
**レビュー**: 未実施
**承認**: 未実施
**最終更新**: 2025-01-13
