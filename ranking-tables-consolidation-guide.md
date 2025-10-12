# ランキングテーブル統合ガイド

**作成日:** 2025-10-13
**目的:** `ranking_visualizations`テーブルを`ranking_items`テーブルに統合
**理由:** データの分散を解消し、保守性と一貫性を向上

---

## エグゼクティブサマリー

### 統合の判断: **統合すべき ✅**

**現状の問題点:**
- 可視化設定が`ranking_visualizations`（5レコード）に分離
- ランキングアイテムが`ranking_items`（180レコード）に分離
- 2つのテーブルでJOINしても一致しない（現在は別々の目的で使用）
- データが分散し、管理が複雑

**統合のメリット:**
- ✅ データが1箇所に集約（Single Source of Truth）
- ✅ クエリが簡素化（JOIN不要）
- ✅ データの一貫性が保たれる
- ✅ 各ランキングアイテムが独自の可視化設定を持てる
- ✅ 保守性が向上
- ✅ APIが簡潔になる

**統合のデメリット:**
- ⚠️ 移行作業が必要
- ⚠️ テーブルのカラム数が増える（9カラム → 16カラム）
- ⚠️ 既存コードの修正が必要

**総合判断:** メリットがデメリットを大きく上回るため、**統合を推奨**

---

## 現状分析

### 1. テーブル構造の比較

#### `ranking_visualizations`（5レコード）

```sql
CREATE TABLE ranking_visualizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- データ識別（複合キー）
  stats_data_id TEXT NOT NULL,         -- 統計表ID
  cat01 TEXT NOT NULL,                 -- カテゴリコード

  -- 地図可視化設定
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',

  -- ランキング設定
  ranking_direction TEXT DEFAULT 'desc',

  -- 単位変換設定
  conversion_factor REAL DEFAULT 1,
  decimal_places INTEGER DEFAULT 0,

  -- システム情報
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(stats_data_id, cat01)
);
```

**使用場所:**
- `src/components/estat/prefecture-ranking/EstatPrefectureRankingDisplay/index.tsx`
- `src/lib/ranking/visualization-settings.ts`
- `/api/ranking/visualization-settings`

**データ例:**
```json
{
  "id": 1,
  "stats_data_id": "0003448368",
  "cat01": "A110101",
  "map_color_scheme": "interpolateBlues",
  "map_diverging_midpoint": "zero",
  "ranking_direction": "desc",
  "conversion_factor": 0.01,
  "decimal_places": 1
}
```

---

#### `ranking_items`（180レコード）

```sql
CREATE TABLE ranking_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT NOT NULL,     -- 'land-area', 'land-use'
  ranking_key TEXT NOT NULL,        -- 'totalAreaExcluding'など
  label TEXT NOT NULL,              -- '総面積（除く）'
  stats_data_id TEXT NOT NULL,      -- '0000010102'
  cd_cat01 TEXT NOT NULL,           -- 'B1101'
  unit TEXT NOT NULL,               -- 'ha'
  name TEXT NOT NULL,               -- '総面積（北方地域及び竹島を除く）'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subcategory_id, ranking_key)
);
```

**使用場所:**
- `src/components/ranking/SubcategoryRankingPage.tsx`
- `src/lib/ranking/ranking-items.ts`
- `/api/ranking-items/subcategory/[subcategoryId]`

**データ例:**
```json
{
  "id": 16,
  "subcategory_id": "land-area",
  "ranking_key": "totalAreaExcluding",
  "label": "総面積（除く）",
  "stats_data_id": "0000010102",
  "cd_cat01": "B1101",
  "unit": "ha",
  "name": "総面積（北方地域及び竹島を除く）",
  "display_order": 1,
  "is_active": 1
}
```

---

### 2. データの関係性分析

#### JOINクエリの結果

```sql
SELECT
  ri.*,
  rv.map_color_scheme,
  rv.conversion_factor
FROM ranking_items ri
LEFT JOIN ranking_visualizations rv
  ON ri.stats_data_id = rv.stats_data_id
  AND ri.cd_cat01 = rv.cat01
LIMIT 5;
```

**結果:** すべて`NULL`（一致するレコードなし）

**理由:**
- `ranking_visualizations`: `stats_data_id=0003448368` （人口データ）
- `ranking_items`: `stats_data_id=0000010102` （土地面積データ）
- 異なるデータセットを管理している

**問題点:**
- 現在は2つのテーブルが完全に独立
- `ranking_items`の各アイテムに可視化設定がない
- 将来的に各ランキングアイテムに可視化設定が必要になる

---

### 3. 使用パターンの分析

#### パターン1: 都道府県ランキングページ

**使用テーブル:** `ranking_visualizations`

**フロー:**
1. ユーザーが統計表ID（`stats_data_id`）とカテゴリコード（`cat01`）を指定
2. e-Stat APIからデータ取得
3. `ranking_visualizations`から可視化設定を取得
4. 設定に基づいて地図とランキングを表示

**問題:**
- `ranking_items`との連携がない
- 統計表IDを手動で入力する必要がある

---

#### パターン2: サブカテゴリページ

**使用テーブル:** `ranking_items`

**フロー:**
1. サブカテゴリID（`subcategory_id`）でランキングアイテムを取得
2. ランキングキー（`ranking_key`）を選択
3. `ranking_items`から`stats_data_id`と`cd_cat01`を取得
4. e-Stat APIからデータ取得
5. **可視化設定がないため、デフォルト設定を使用**

**問題:**
- 可視化設定がない
- 各ランキングアイテムに適切な色やスケールを設定できない

---

## 統合案

### 統合後のテーブル構造

#### `ranking_items`（統合版）

```sql
CREATE TABLE ranking_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- ランキングアイテム識別（既存）
  subcategory_id TEXT NOT NULL,
  ranking_key TEXT NOT NULL,
  label TEXT NOT NULL,
  name TEXT NOT NULL,

  -- e-Statデータ識別（既存）
  stats_data_id TEXT NOT NULL,
  cd_cat01 TEXT NOT NULL,
  unit TEXT NOT NULL,

  -- 表示設定（既存）
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,

  -- 地図可視化設定（新規追加）
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',

  -- ランキング設定（新規追加）
  ranking_direction TEXT DEFAULT 'desc',

  -- 単位変換設定（新規追加）
  conversion_factor REAL DEFAULT 1,
  decimal_places INTEGER DEFAULT 0,

  -- システム情報（既存）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 一意制約（既存）
  UNIQUE(subcategory_id, ranking_key)
);
```

**追加カラム（7個）:**
1. `map_color_scheme` - 地図の色スキーム
2. `map_diverging_midpoint` - 分岐点
3. `ranking_direction` - ランキング方向
4. `conversion_factor` - 変換係数
5. `decimal_places` - 小数点以下桁数

**カラム数:** 9個 → 16個（7個増加）

---

### 統合のメリット・デメリット詳細

#### メリット

**1. データの一貫性 ✅**
```typescript
// 統合前: 2つのテーブルから取得
const item = await fetchRankingItem(subcategoryId, rankingKey);
const settings = await fetchVisualizationSettings(item.stats_data_id, item.cd_cat01);

// 統合後: 1つのテーブルから取得
const item = await fetchRankingItem(subcategoryId, rankingKey);
// itemに可視化設定が含まれている
```

**2. クエリの簡素化 ✅**
```typescript
// 統合前: 複雑なJOIN
const result = await db.prepare(`
  SELECT ri.*, rv.*
  FROM ranking_items ri
  LEFT JOIN ranking_visualizations rv
    ON ri.stats_data_id = rv.stats_data_id
    AND ri.cd_cat01 = rv.cat01
  WHERE ri.subcategory_id = ?
`).bind(subcategoryId).all();

// 統合後: シンプルなSELECT
const result = await db.prepare(`
  SELECT * FROM ranking_items
  WHERE subcategory_id = ?
`).bind(subcategoryId).all();
```

**3. APIの簡素化 ✅**
```typescript
// 統合前: 2つのAPIエンドポイント
GET /api/ranking-items/subcategory/:id
GET /api/ranking/visualization-settings?statsDataId=xxx&cat01=yyy

// 統合後: 1つのAPIエンドポイント
GET /api/ranking-items/subcategory/:id
// 可視化設定も含まれる
```

**4. 保守性の向上 ✅**
- スキーマ変更が1箇所で済む
- データの整合性を保ちやすい
- マイグレーションが簡単

**5. 拡張性の向上 ✅**
- 新しいランキングアイテムを追加時に可視化設定も同時に設定
- カラム追加が1箇所で済む

---

#### デメリット

**1. テーブルサイズの増加 ⚠️**
- カラム数: 9個 → 16個（78%増加）
- しかし、レコード数は180個と少ないため、パフォーマンス影響は軽微

**2. 移行作業の必要性 ⚠️**
- スキーマ変更
- データ移行（可能な範囲）
- コード修正
- テスト

**3. NULL値の増加 ⚠️**
- 既存の180レコードには可視化設定がない
- デフォルト値で埋めるか、NULL許容にする

**4. 責務の混在 ⚠️**
- ランキングアイテム定義と可視化設定が同じテーブル
- しかし、常に一緒に使用されるため問題なし

---

### 代替案との比較

#### 案A: 統合（推奨）

**メリット:**
- データが1箇所に集約
- クエリが簡単
- APIが簡潔

**デメリット:**
- 移行作業が必要
- カラム数が増える

**評価:** ⭐⭐⭐⭐⭐

---

#### 案B: 現状維持（非推奨）

**メリット:**
- 変更不要

**デメリット:**
- データが分散
- JOINが必要
- APIが複雑
- 将来的に問題が拡大

**評価:** ⭐⭐

---

#### 案C: 別テーブルで1対1関連（非推奨）

**構造:**
```sql
ranking_items (id, subcategory_id, ranking_key, ...)
ranking_item_visualizations (ranking_item_id, map_color_scheme, ...)
```

**メリット:**
- 責務が明確に分離

**デメリット:**
- 常にJOINが必要
- クエリが複雑
- データの整合性を保つのが困難
- 1対1の関係なら統合すべき

**評価:** ⭐⭐⭐

---

## 統合実装手順

### フェーズ0: 準備（1時間）

#### 0-1. バックアップ作成

```bash
# 本番データベースのバックアップ
npx wrangler d1 export stats47 --remote --output backup-$(date +%Y%m%d-%H%M%S).sql

# ローカルデータベースのバックアップ
npx wrangler d1 export stats47 --local --output backup-local-$(date +%Y%m%d-%H%M%S).sql
```

#### 0-2. 現状のデータ確認

```bash
# ranking_visualizationsのレコード数
npx wrangler d1 execute stats47 --remote --command \
  "SELECT COUNT(*) as count FROM ranking_visualizations"

# ranking_itemsのレコード数
npx wrangler d1 execute stats47 --remote --command \
  "SELECT COUNT(*) as count FROM ranking_items"

# 両テーブルのJOIN結果確認
npx wrangler d1 execute stats47 --remote --command \
  "SELECT ri.subcategory_id, ri.ranking_key, ri.stats_data_id, ri.cd_cat01,
          rv.id as viz_id, rv.map_color_scheme
   FROM ranking_items ri
   LEFT JOIN ranking_visualizations rv
     ON ri.stats_data_id = rv.stats_data_id
     AND ri.cd_cat01 = rv.cat01"
```

#### 0-3. Gitブランチ作成

```bash
git checkout -b refactor/consolidate-ranking-tables
```

---

### フェーズ1: スキーマ変更（ローカル開発環境）（1-2時間）

#### 1-1. マイグレーションファイル作成

**`database/migrations/002_add_visualization_to_ranking_items.sql`:**

```sql
-- ステップ1: ranking_itemsに可視化設定カラムを追加
ALTER TABLE ranking_items ADD COLUMN map_color_scheme TEXT DEFAULT 'interpolateBlues';
ALTER TABLE ranking_items ADD COLUMN map_diverging_midpoint TEXT DEFAULT 'zero';
ALTER TABLE ranking_items ADD COLUMN ranking_direction TEXT DEFAULT 'desc';
ALTER TABLE ranking_items ADD COLUMN conversion_factor REAL DEFAULT 1;
ALTER TABLE ranking_items ADD COLUMN decimal_places INTEGER DEFAULT 0;

-- ステップ2: ranking_visualizationsからデータを移行（該当するものがあれば）
UPDATE ranking_items
SET
  map_color_scheme = (
    SELECT rv.map_color_scheme
    FROM ranking_visualizations rv
    WHERE rv.stats_data_id = ranking_items.stats_data_id
      AND rv.cat01 = ranking_items.cd_cat01
  ),
  map_diverging_midpoint = (
    SELECT rv.map_diverging_midpoint
    FROM ranking_visualizations rv
    WHERE rv.stats_data_id = ranking_items.stats_data_id
      AND rv.cat01 = ranking_items.cd_cat01
  ),
  ranking_direction = (
    SELECT rv.ranking_direction
    FROM ranking_visualizations rv
    WHERE rv.stats_data_id = ranking_items.stats_data_id
      AND rv.cat01 = ranking_items.cd_cat01
  ),
  conversion_factor = (
    SELECT rv.conversion_factor
    FROM ranking_visualizations rv
    WHERE rv.stats_data_id = ranking_items.stats_data_id
      AND rv.cat01 = ranking_items.cd_cat01
  ),
  decimal_places = (
    SELECT rv.decimal_places
    FROM ranking_visualizations rv
    WHERE rv.stats_data_id = ranking_items.stats_data_id
      AND rv.cat01 = ranking_items.cd_cat01
  )
WHERE EXISTS (
  SELECT 1 FROM ranking_visualizations rv
  WHERE rv.stats_data_id = ranking_items.stats_data_id
    AND rv.cat01 = ranking_items.cd_cat01
);

-- ステップ3: 確認クエリ（実行はしない、確認用）
-- SELECT
--   id, subcategory_id, ranking_key, stats_data_id, cd_cat01,
--   map_color_scheme, conversion_factor, decimal_places
-- FROM ranking_items
-- WHERE map_color_scheme != 'interpolateBlues'
-- LIMIT 10;
```

#### 1-2. ローカルでマイグレーション実行

```bash
# ローカルD1でマイグレーション実行
npx wrangler d1 execute stats47 --local --file=database/migrations/002_add_visualization_to_ranking_items.sql

# 確認
npx wrangler d1 execute stats47 --local --command \
  "SELECT name, type FROM pragma_table_info('ranking_items')"
```

#### 1-3. 結果確認

```bash
# 更新されたレコード数を確認
npx wrangler d1 execute stats47 --local --command \
  "SELECT COUNT(*) as updated_count
   FROM ranking_items
   WHERE map_color_scheme != 'interpolateBlues'"

# 具体的なデータを確認
npx wrangler d1 execute stats47 --local --command \
  "SELECT subcategory_id, ranking_key, stats_data_id, cd_cat01,
          map_color_scheme, conversion_factor, decimal_places
   FROM ranking_items
   LIMIT 5"
```

---

### フェーズ2: 型定義の更新（30分）

#### 2-1. RankingItem型を更新

**`src/types/models/ranking.ts`:**

```typescript
export interface RankingItem {
  id: number;
  subcategoryId: string;
  rankingKey: string;
  label: string;
  statsDataId: string;
  cdCat01: string;
  unit: string;
  name: string;
  displayOrder: number;
  isActive: boolean;

  // 可視化設定（新規追加）
  mapColorScheme: string;
  mapDivergingMidpoint: "zero" | "mean" | "median" | number;
  rankingDirection: "asc" | "desc";
  conversionFactor: number;
  decimalPlaces: number;

  createdAt: string;
  updatedAt: string;
}

// データベースの型（スネークケース）
export interface RankingItemDB {
  id: number;
  subcategory_id: string;
  ranking_key: string;
  label: string;
  stats_data_id: string;
  cd_cat01: string;
  unit: string;
  name: string;
  display_order: number;
  is_active: number;

  // 可視化設定（新規追加）
  map_color_scheme: string;
  map_diverging_midpoint: string;
  ranking_direction: string;
  conversion_factor: number;
  decimal_places: number;

  created_at: string;
  updated_at: string;
}

// 変換ヘルパー関数
export function convertRankingItemFromDB(dbItem: RankingItemDB): RankingItem {
  return {
    id: dbItem.id,
    subcategoryId: dbItem.subcategory_id,
    rankingKey: dbItem.ranking_key,
    label: dbItem.label,
    statsDataId: dbItem.stats_data_id,
    cdCat01: dbItem.cd_cat01,
    unit: dbItem.unit,
    name: dbItem.name,
    displayOrder: dbItem.display_order,
    isActive: dbItem.is_active === 1,

    // 可視化設定
    mapColorScheme: dbItem.map_color_scheme,
    mapDivergingMidpoint: dbItem.map_diverging_midpoint as "zero" | "mean" | "median",
    rankingDirection: dbItem.ranking_direction as "asc" | "desc",
    conversionFactor: dbItem.conversion_factor,
    decimalPlaces: dbItem.decimal_places,

    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at,
  };
}
```

---

### フェーズ3: APIの統合（1-2時間）

#### 3-1. ranking-items APIを拡張

**`src/app/api/ranking-items/subcategory/[subcategoryId]/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";
import { convertRankingItemFromDB, RankingItemDB } from "@/types/models/ranking";

export async function GET(
  request: NextRequest,
  { params }: { params: { subcategoryId: string } }
) {
  try {
    const subcategoryId = params.subcategoryId;
    const db = await createD1Database();

    // サブカテゴリ情報を取得
    const subcategoryResult = await db
      .prepare(
        "SELECT id, category_id, name, description, default_ranking_key FROM subcategory_configs WHERE id = ?"
      )
      .bind(subcategoryId)
      .first();

    if (!subcategoryResult) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    // ランキングアイテムを取得（可視化設定も含む）
    const itemsResult = await db
      .prepare(
        `SELECT
          id, subcategory_id, ranking_key, label,
          stats_data_id, cd_cat01, unit, name,
          display_order, is_active,
          map_color_scheme, map_diverging_midpoint,
          ranking_direction, conversion_factor, decimal_places,
          created_at, updated_at
        FROM ranking_items
        WHERE subcategory_id = ? AND is_active = 1
        ORDER BY display_order ASC`
      )
      .bind(subcategoryId)
      .all<RankingItemDB>();

    // 型変換
    const rankingItems = itemsResult.results.map(convertRankingItemFromDB);

    return NextResponse.json({
      subcategory: {
        id: subcategoryResult.id,
        categoryId: subcategoryResult.category_id,
        name: subcategoryResult.name,
        description: subcategoryResult.description,
        defaultRankingKey: subcategoryResult.default_ranking_key,
      },
      rankingItems,
    });
  } catch (error) {
    console.error("Error fetching ranking items:", error);
    return NextResponse.json(
      { error: "Failed to fetch ranking items" },
      { status: 500 }
    );
  }
}
```

#### 3-2. 可視化設定の保存APIを追加

**`src/app/api/ranking-items/[id]/visualization/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";

interface VisualizationUpdateRequest {
  mapColorScheme?: string;
  mapDivergingMidpoint?: string;
  rankingDirection?: "asc" | "desc";
  conversionFactor?: number;
  decimalPlaces?: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json() as VisualizationUpdateRequest;
    const db = await createD1Database();

    // 更新クエリを動的に構築
    const updates: string[] = [];
    const values: any[] = [];

    if (body.mapColorScheme !== undefined) {
      updates.push("map_color_scheme = ?");
      values.push(body.mapColorScheme);
    }
    if (body.mapDivergingMidpoint !== undefined) {
      updates.push("map_diverging_midpoint = ?");
      values.push(body.mapDivergingMidpoint);
    }
    if (body.rankingDirection !== undefined) {
      updates.push("ranking_direction = ?");
      values.push(body.rankingDirection);
    }
    if (body.conversionFactor !== undefined) {
      updates.push("conversion_factor = ?");
      values.push(body.conversionFactor);
    }
    if (body.decimalPlaces !== undefined) {
      updates.push("decimal_places = ?");
      values.push(body.decimalPlaces);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // updated_atも更新
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const query = `
      UPDATE ranking_items
      SET ${updates.join(", ")}
      WHERE id = ?
    `;

    await db.prepare(query).bind(...values).run();

    return NextResponse.json({
      success: true,
      message: "Visualization settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating visualization settings:", error);
    return NextResponse.json(
      { error: "Failed to update visualization settings" },
      { status: 500 }
    );
  }
}
```

---

### フェーズ4: サービスクラスの統合（1時間）

#### 4-1. ranking-items.tsを拡張

**`src/lib/ranking/ranking-items.ts`:**

```typescript
import { RankingItem } from "@/types/models/ranking";

export interface SubcategoryConfig {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  defaultRankingKey: string;
}

export interface RankingConfigResponse {
  subcategory: SubcategoryConfig;
  rankingItems: RankingItem[]; // 可視化設定も含む
}

/**
 * サブカテゴリのランキング項目をデータベースから取得
 * （可視化設定も含む）
 */
export async function fetchRankingItemsBySubcategory(
  subcategoryId: string
): Promise<RankingConfigResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/ranking-items/subcategory/${encodeURIComponent(
      subcategoryId
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.warn(
        `ランキング設定APIエラー (${subcategoryId}): ${response.status}`
      );
      return null;
    }

    const config = await response.json() as RankingConfigResponse;
    return config;
  } catch (error) {
    console.error(
      `ランキング設定の取得に失敗しました (${subcategoryId}):`,
      error
    );
    return null;
  }
}

/**
 * 可視化設定を更新
 */
export async function updateVisualizationSettings(
  itemId: number,
  settings: {
    mapColorScheme?: string;
    mapDivergingMidpoint?: string;
    rankingDirection?: "asc" | "desc";
    conversionFactor?: number;
    decimalPlaces?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/ranking-items/${itemId}/visualization`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || "Update failed" };
    }

    return { success: true };
  } catch (error) {
    console.error("可視化設定の更新に失敗しました:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

#### 4-2. visualization-settings.tsを非推奨化

**`src/lib/ranking/visualization-settings.ts`:**

```typescript
/**
 * @deprecated このファイルは非推奨です。
 * 可視化設定はranking_itemsテーブルに統合されました。
 * 代わりに src/lib/ranking/ranking-items.ts を使用してください。
 *
 * 移行ガイド: ranking-tables-consolidation-guide.md
 */

// 後方互換性のため、一時的に残す
// TODO: すべてのコードを移行後に削除

export interface VisualizationSettings {
  id?: number;
  stats_data_id: string;
  cat01: string;
  map_color_scheme: string;
  map_diverging_midpoint: "zero" | "mean" | "median" | number;
  ranking_direction: "asc" | "desc";
  conversion_factor: number;
  decimal_places: number;
  created_at?: string;
  updated_at?: string;
}

// ... 既存のコードは残す（後方互換性のため）
```

---

### フェーズ5: コンポーネントの更新（2-3時間）

#### 5-1. SubcategoryRankingPageの更新

**`src/components/ranking/SubcategoryRankingPage.tsx`:**

```typescript
// 可視化設定がranking_itemsに含まれるようになったため、
// 追加のAPI呼び出しは不要

export default function SubcategoryRankingPage({ ... }) {
  // ranking_itemsから取得したデータに可視化設定が含まれる
  const rankingConfig = await fetchRankingItemsBySubcategory(subcategoryId);

  const selectedItem = rankingConfig.rankingItems.find(
    item => item.rankingKey === rankingKey
  );

  // 可視化設定を直接使用
  const visualizationSettings = {
    mapColorScheme: selectedItem.mapColorScheme,
    mapDivergingMidpoint: selectedItem.mapDivergingMidpoint,
    rankingDirection: selectedItem.rankingDirection,
    conversionFactor: selectedItem.conversionFactor,
    decimalPlaces: selectedItem.decimalPlaces,
  };

  // ... 以降の処理
}
```

#### 5-2. RankingClientの更新

**`src/components/ranking/RankingClient/RankingClient.tsx`:**

```typescript
"use client";

import { RankingItem } from "@/types/models/ranking";

interface RankingClientProps {
  rankingItems: RankingItem[]; // 可視化設定も含む
  // ...
}

export default function RankingClient({ rankingItems, ... }: RankingClientProps) {
  // selectedItemに可視化設定が含まれている
  const selectedItem = rankingItems.find(item => item.rankingKey === selectedRankingKey);

  // 可視化設定を直接使用
  <EstatMapView
    data={estatData}
    mapColorScheme={selectedItem.mapColorScheme}
    conversionFactor={selectedItem.conversionFactor}
    decimalPlaces={selectedItem.decimalPlaces}
    // ...
  />
}
```

---

### フェーズ6: テストとデバッグ（2-3時間）

#### 6-1. ローカルでの動作確認

```bash
# 開発サーバー起動
npm run dev

# テスト対象ページ
# 1. サブカテゴリページ
open http://localhost:3000/population/basic-population

# 2. 各ランキングページ
open http://localhost:3000/population/basic-population/ranking/totalPopulation
```

**確認項目:**
- [ ] ランキングアイテムが正常に表示される
- [ ] 可視化設定がデフォルト値で表示される
- [ ] 地図の色スキームが適用される
- [ ] 単位変換が正しく動作する
- [ ] コンソールエラーがない

#### 6-2. エッジケースのテスト

```typescript
// テストケース1: 可視化設定がnullの場合
// → デフォルト値が使用されることを確認

// テストケース2: 異なる単位（ha, km², 100km²など）
// → conversion_factorが正しく適用されることを確認

// テストケース3: rankingDirection='asc'の場合
// → 順位が正しく表示されることを確認
```

#### 6-3. APIのテスト

```bash
# ranking-items APIのテスト
curl -X GET "http://localhost:3000/api/ranking-items/subcategory/land-area" | jq

# 可視化設定更新APIのテスト
curl -X PATCH "http://localhost:3000/api/ranking-items/16/visualization" \
  -H "Content-Type: application/json" \
  -d '{
    "mapColorScheme": "interpolateGreens",
    "conversionFactor": 0.01,
    "decimalPlaces": 2
  }' | jq
```

---

### フェーズ7: 本番環境への展開（30分）

#### 7-1. 本番データベースでマイグレーション実行

```bash
# 本番環境でマイグレーション実行（慎重に！）
npx wrangler d1 execute stats47 --remote --file=database/migrations/002_add_visualization_to_ranking_items.sql

# 確認
npx wrangler d1 execute stats47 --remote --command \
  "SELECT name, type FROM pragma_table_info('ranking_items')"

# 更新されたレコード数を確認
npx wrangler d1 execute stats47 --remote --command \
  "SELECT COUNT(*) as total,
          SUM(CASE WHEN map_color_scheme != 'interpolateBlues' THEN 1 ELSE 0 END) as updated
   FROM ranking_items"
```

#### 7-2. デプロイ

```bash
# Vercelにデプロイ
git add .
git commit -m "refactor: consolidate ranking_visualizations into ranking_items"
git push origin refactor/consolidate-ranking-tables

# プルリクエスト作成後、マージ
# Vercelが自動デプロイ
```

#### 7-3. 本番環境での動作確認

```bash
# 本番URLで確認
open https://your-domain.com/population/basic-population
```

**確認項目:**
- [ ] すべてのランキングページが正常に表示される
- [ ] 可視化設定が適用される
- [ ] エラーが発生しない
- [ ] パフォーマンスが劣化していない

---

### フェーズ8: ranking_visualizationsテーブルの削除（オプション、30分）

**注意:** すべての移行が完了し、十分にテストした後のみ実行

#### 8-1. 使用箇所の完全削除確認

```bash
# コードベース内でranking_visualizationsへの参照を検索
grep -r "ranking_visualizations" src/
grep -r "VisualizationSettings" src/

# APIエンドポイントの削除確認
ls -la src/app/api/ranking/visualization-settings/
```

#### 8-2. テーブル削除

```sql
-- ローカルで先にテスト
-- npx wrangler d1 execute stats47 --local --command "DROP TABLE ranking_visualizations"

-- 本番環境（慎重に！）
-- npx wrangler d1 execute stats47 --remote --command "DROP TABLE ranking_visualizations"
```

**推奨:** 完全に削除せず、テーブル名を変更して保持
```sql
ALTER TABLE ranking_visualizations RENAME TO _deprecated_ranking_visualizations;
```

---

## ロールバック手順

万が一、問題が発生した場合のロールバック手順:

### ステップ1: バックアップからの復元

```bash
# バックアップファイルを確認
ls -la backup-*.sql

# 最新のバックアップから復元
npx wrangler d1 execute stats47 --remote --file=backup-YYYYMMDD-HHMMSS.sql
```

### ステップ2: Gitでコードをロールバック

```bash
# 直前のコミットに戻す
git revert HEAD

# またはブランチを削除して元に戻す
git checkout main
git branch -D refactor/consolidate-ranking-tables
```

### ステップ3: Vercelで再デプロイ

```bash
git push origin main
# Vercelが自動的に前のバージョンをデプロイ
```

---

## チェックリスト

### 移行前の確認

- [ ] 両テーブルのバックアップ完了
- [ ] 現状のデータ量を確認
- [ ] JOINクエリで関係性を確認
- [ ] Gitブランチ作成完了
- [ ] ステージング環境で先にテスト

### 移行中の確認

- [ ] ローカルでマイグレーション成功
- [ ] 型定義を更新
- [ ] API更新完了
- [ ] サービスクラス更新完了
- [ ] コンポーネント更新完了
- [ ] ローカルでの動作確認完了
- [ ] エッジケーステスト完了

### 移行後の確認

- [ ] 本番環境でマイグレーション成功
- [ ] デプロイ完了
- [ ] 本番環境での動作確認完了
- [ ] パフォーマンス確認完了
- [ ] エラーログ確認
- [ ] ユーザーフィードバック収集

### クリーンアップ

- [ ] 非推奨コードの削除
- [ ] 未使用APIエンドポイントの削除
- [ ] ドキュメント更新
- [ ] テスト追加
- [ ] ranking_visualizationsテーブル削除（または名前変更）

---

## 期待される効果

### データ管理

- ✅ データが1箇所に集約され、Single Source of Truthを実現
- ✅ JOIN不要でクエリが高速化
- ✅ データの整合性が保たれやすい

### 開発効率

- ✅ APIが1つに統合され、コードが簡潔に
- ✅ 新しいランキングアイテム追加時の作業が減る
- ✅ テストが書きやすくなる

### 保守性

- ✅ スキーマ変更が1箇所で済む
- ✅ マイグレーションが簡単
- ✅ バグが減る

### パフォーマンス

- ✅ JOIN不要で処理が軽量化
- ✅ APIレスポンスが高速化（2回 → 1回）
- ⚠️ テーブルサイズは若干増加（影響は軽微）

---

## FAQ

### Q1: 既存の180レコードの可視化設定はどうなる？

**A:** デフォルト値（`interpolateBlues`, `conversion_factor=1`など）が設定されます。必要に応じて個別に更新できます。

### Q2: ranking_visualizationsの5レコードはどうなる？

**A:** マイグレーションスクリプトで、該当するranking_itemsレコードがあれば自動的に移行されます。該当しない場合は手動で設定が必要です。

### Q3: パフォーマンスへの影響は？

**A:** テーブルサイズは増えますが、レコード数が180個と少ないため、影響は軽微です。むしろJOINが不要になるため、高速化が期待できます。

### Q4: ロールバックは可能？

**A:** はい。バックアップから復元し、Gitで前のバージョンに戻せばロールバック可能です。

### Q5: 段階的な移行は可能？

**A:** はい。フェーズごとに進めることができます。特に、新しいAPIを追加してから、古いAPIを削除する2段階アプローチが推奨されます。

---

## 関連ドキュメント

- `prefecture-ranking-component-analysis.md` - コンポーネント構造分析
- `metainfo-component-analysis.md` - metainfoコンポーネント分析
- `d1-save-optimization-guide.md` - D1最適化ガイド

---

**作成日:** 2025-10-13
**バージョン:** 1.0
**最終更新:** 2025-10-13
**レビュー:** 移行完了後
