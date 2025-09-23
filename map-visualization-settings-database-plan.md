# 都道府県ランキングサイト - 可視化設定データベース管理 実装方針

## 概要
都道府県ランキングをカテゴリ・サブカテゴリで分類し、コロプレス地図・各種グラフで表示するサイト向けの包括的な可視化設定管理システムを構築する。

## 現在のデータベース構造分析

### 既存テーブル
- `estat_metainfo`: e-STAT統計データのメタデータ管理
- `users`: ユーザー認証
- `estat_data_history`: データ変更履歴

### estat_metainfoの構造
```sql
CREATE TABLE estat_metainfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  cat01 TEXT,
  item_name TEXT,
  unit TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 実装方針の比較

### 方針A: estat_metainfoテーブル拡張
**アプローチ**: 既存テーブルに可視化設定カラムを追加

#### メリット
- シンプルな構造
- JOINが不要で高速なデータ取得
- 既存のAPIを最小限の変更で拡張可能
- データの整合性が保ちやすい

#### デメリット
- テーブルが肥大化する
- 可視化設定が不要なレコードでもカラムが存在
- 将来的な設定項目追加で頻繁なALTER TABLEが必要
- 設定の履歴管理が困難

#### 実装例
```sql
ALTER TABLE estat_metainfo ADD COLUMN visualization_settings TEXT; -- JSON形式
-- または個別カラム
ALTER TABLE estat_metainfo ADD COLUMN color_scheme TEXT DEFAULT 'interpolateBlues';
ALTER TABLE estat_metainfo ADD COLUMN diverging_midpoint TEXT DEFAULT 'zero';
```

### 方針B: 専用テーブル作成
**アプローチ**: 可視化設定専用のテーブルを新規作成

#### メリット
- 設定項目の拡張が容易
- 設定の履歴管理が可能
- ユーザー別の設定保存が可能
- テーブルの責任分離でメンテナンス性が向上
- 複数の可視化パターンを同一データに適用可能

#### デメリット
- JOINによるクエリコストが発生
- データ取得が複雑になる
- 初期実装コストが高い

#### 実装例
```sql
CREATE TABLE map_visualization_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metainfo_id INTEGER NOT NULL,
  user_id INTEGER,
  setting_name TEXT,
  color_scheme TEXT DEFAULT 'interpolateBlues',
  diverging_midpoint TEXT DEFAULT 'zero',
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (metainfo_id) REFERENCES estat_metainfo(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 方針C: ハイブリッド方式
**アプローチ**: デフォルト設定はmetainfoに、カスタム設定は専用テーブルに

#### メリット
- デフォルト設定の高速取得
- カスタム設定の柔軟性
- 段階的な実装が可能

#### デメリット
- 複雑なロジックが必要
- データの重複リスク

## 推奨方針: 方針B（専用テーブル作成）

### 理由
1. **拡張性**: 将来的な設定項目追加に対応しやすい
2. **ユーザビリティ**: ユーザー別設定、複数パターンの保存が可能
3. **保守性**: 責任分離により、各テーブルの役割が明確
4. **履歴管理**: 設定変更の追跡が容易

## サイト要件分析

### 想定されるカテゴリ分類
- **人口・世帯**: 人口密度、高齢化率、世帯数、出生率
- **経済・産業**: GDP、製造業、農業、観光収入、失業率
- **教育・文化**: 大学進学率、図書館数、文化施設数
- **健康・医療**: 平均寿命、医師数、病院数、健康指標
- **環境・インフラ**: 公園面積、道路整備率、上下水道普及率
- **安全・治安**: 犯罪率、交通事故率、消防施設数
- **行政・財政**: 財政力指数、税収、公共投資

### 可視化タイプ
- **コロプレス地図**: 都道府県の色分け表示
- **棒グラフ**: ランキング表示
- **散布図**: 2つの指標の相関
- **時系列グラフ**: 経年変化
- **レーダーチャート**: 多次元比較

## 詳細設計

### メインテーブル: ranking_visualizations

```sql
CREATE TABLE IF NOT EXISTS ranking_visualizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- データ識別（複合キー）
  stats_data_id TEXT NOT NULL,         -- 統計表ID
  cat01 TEXT NOT NULL,                 -- カテゴリコード（estat_metainfoのcat01と対応）

  -- 地図可視化設定
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',

  -- ランキング設定
  ranking_direction TEXT DEFAULT 'desc', -- 'asc', 'desc'

  -- 単位変換設定
  conversion_factor REAL DEFAULT 1,    -- 変換係数（元データ × 係数 = 表示値）
  decimal_places INTEGER DEFAULT 0,    -- 小数点以下桁数

  -- システム情報
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 一意制約
  UNIQUE(stats_data_id, cat01)
);
```

### 単位変換設定例

#### 例1: 百万円データを億円で表示
```sql
-- 元データ: GDP（百万円単位）→ 表示: GDP（億円単位）
INSERT INTO ranking_visualizations (stats_data_id, cat01, conversion_factor, decimal_places)
VALUES ('0003448368', 'A110101', 0.01, 1);
-- 変換: 百万円 × 0.01 = 億円（小数点以下1桁）
```

#### 例2: 千人データを万人で表示
```sql
-- 元データ: 人口（千人単位）→ 表示: 人口（万人単位）
INSERT INTO ranking_visualizations (stats_data_id, cat01, conversion_factor, decimal_places)
VALUES ('0003448368', 'A110102', 0.1, 1);
-- 変換: 千人 × 0.1 = 万人（小数点以下1桁）
```

#### 例3: 比率データをパーセント表示
```sql
-- 元データ: 高齢化率（0-1の比率）→ 表示: 高齢化率（パーセント）
INSERT INTO ranking_visualizations (stats_data_id, cat01, conversion_factor, decimal_places)
VALUES ('0003448368', 'A110103', 100, 1);
-- 変換: 比率 × 100 = パーセント（小数点以下1桁）
```

## 設定取得の実装例

### SQL取得クエリ
```sql
-- stats_data_id と cat01 で設定を取得
SELECT
  map_color_scheme,
  map_diverging_midpoint,
  ranking_direction,
  conversion_factor,
  decimal_places
FROM ranking_visualizations
WHERE stats_data_id = ? AND cat01 = ?;

-- 設定が存在しない場合はデフォルト値を使用
SELECT
  COALESCE(rv.map_color_scheme, 'interpolateBlues') as map_color_scheme,
  COALESCE(rv.map_diverging_midpoint, 'zero') as map_diverging_midpoint,
  COALESCE(rv.ranking_direction, 'desc') as ranking_direction,
  COALESCE(rv.conversion_factor, 1) as conversion_factor,
  COALESCE(rv.decimal_places, 0) as decimal_places
FROM (SELECT ? as stats_data_id, ? as cat01) as input
LEFT JOIN ranking_visualizations rv
  ON input.stats_data_id = rv.stats_data_id
  AND input.cat01 = rv.cat01;
```

## 単位変換の実装ロジック

### TypeScript実装例
```typescript
interface RankingSettings {
  mapColorScheme: string;
  mapDivergingMidpoint: string;
  rankingDirection: 'asc' | 'desc';
  conversionFactor: number;
  decimalPlaces: number;
}

function convertAndFormatValue(
  rawValue: number,
  conversionFactor: number,
  decimalPlaces: number
): number {
  const convertedValue = rawValue * conversionFactor;
  return Number(convertedValue.toFixed(decimalPlaces));
}

// 使用例
const settings: RankingSettings = {
  mapColorScheme: 'interpolateBlues',
  mapDivergingMidpoint: 'zero',
  rankingDirection: 'desc',
  conversionFactor: 0.01,  // 百万円 → 億円
  decimalPlaces: 1
};

const rawGdp = 5420000; // 5,420,000百万円
const displayValue = convertAndFormatValue(
  rawGdp,
  settings.conversionFactor,
  settings.decimalPlaces
);
console.log(displayValue); // 54200.0（億円）

// 表示形式は別途フロントエンドで処理
const formatted = displayValue.toLocaleString('ja-JP') + '億円';
console.log(formatted); // "54,200.0億円"
```

### インデックス
```sql
-- ranking_visualizations用インデックス
CREATE INDEX IF NOT EXISTS idx_ranking_viz_stats_id ON ranking_visualizations(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_ranking_viz_cat01 ON ranking_visualizations(cat01);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ranking_viz_composite ON ranking_visualizations(stats_data_id, cat01);
```

### ビュー: メタデータ付きランキング設定
```sql
CREATE VIEW IF NOT EXISTS v_ranking_with_metadata AS
SELECT
  rv.*,
  m.stat_name,
  m.title,
  m.unit as original_unit,
  m.item_name
FROM ranking_visualizations rv
LEFT JOIN estat_metainfo m ON rv.stats_data_id = m.stats_data_id AND rv.cat01 = m.cat01;
```

## API設計

### ランキング取得API
```typescript
// カテゴリ一覧取得
GET /api/rankings/categories
GET /api/rankings/categories/{mainCategory}

// ランキング一覧取得
GET /api/rankings?category={category}&limit={limit}&offset={offset}
GET /api/rankings/featured
GET /api/rankings/popular

// 特定ランキング取得
GET /api/rankings/{id}
GET /api/rankings/{id}/data

// 検索
GET /api/rankings/search?q={query}&category={category}&dataType={type}
```

### 可視化設定API
```typescript
// 設定取得
GET /api/visualizations/{id}/settings
GET /api/visualizations/templates
GET /api/visualizations/templates/{type}

// 設定保存（管理者用）
POST /api/visualizations
PUT /api/visualizations/{id}
DELETE /api/visualizations/{id}

// アクセス統計更新
POST /api/visualizations/{id}/view
```

### データ取得API
```typescript
// ランキングデータ取得
GET /api/rankings/{id}/data?year={year}&format={format}

// 比較データ取得
GET /api/rankings/compare?ids={id1,id2,id3}&year={year}

// 時系列データ取得
GET /api/rankings/{id}/timeseries?startYear={start}&endYear={end}
```

## データ型定義

### TypeScript インターフェース
```typescript
interface RankingCategory {
  id: number;
  categoryCode: string;
  mainCategory: string;
  subCategory?: string;
  displayName: string;
  description?: string;
  iconName?: string;
  colorTheme?: string;
  displayOrder: number;
  isActive: boolean;
}

interface PrefectureRankingVisualization {
  id: number;
  statsDataId: string;
  categoryCode?: string;
  userId?: number;

  // カテゴリ情報
  mainCategory: string;
  subCategory?: string;
  dataType: string;
  unitType?: string;

  // メタデータ
  settingName: string;
  description?: string;
  tags?: string[];
  isDefault: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  displayOrder: number;

  // 地図設定
  mapColorScheme: string;
  mapDivergingMidpoint: string;
  mapLegendPosition: string;
  mapLegendFormat: string;

  // グラフ設定
  chartTypes?: string[];
  defaultChartType: string;
  barChartColor: string;
  lineChartColor: string;

  // ランキング設定
  rankingDirection: 'asc' | 'desc';
  rankingHighlightTop: number;
  rankingShowChange: boolean;

  // データ処理
  dataProcessing?: Record<string, any>;
  comparisonSettings?: Record<string, any>;
  timeSeriesConfig?: Record<string, any>;

  // 表示オプション
  showDataTable: boolean;
  showStatistics: boolean;
  showDownloadOptions: boolean;
  showShareOptions: boolean;

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;

  // 統計
  viewCount: number;
  lastViewedAt?: string;

  createdAt: string;
  updatedAt: string;
}

interface VisualizationTemplate {
  id: number;
  templateName: string;
  templateType: 'choropleth' | 'bar' | 'line' | 'scatter' | 'radar';
  categoryTypes?: string[];
  defaultSettings: Record<string, any>;
  previewImageUrl?: string;
  description?: string;
  isSystemTemplate: boolean;
}

interface RankingDataPoint {
  prefectureCode: string;
  prefectureName: string;
  value: number;
  displayValue: string;
  rank: number;
  change?: number; // 前回比
}

interface RankingResponse {
  visualization: PrefectureRankingVisualization;
  category: RankingCategory;
  data: RankingDataPoint[];
  statistics: {
    totalCount: number;
    validCount: number;
    min: number;
    max: number;
    average: number;
    median: number;
  };
  metadata: {
    year: string;
    dataSource: string;
    lastUpdated: string;
  };
}
```

## 実装戦略

### Phase 1: 基盤構築
1. **データベース設計**
   - 新テーブル作成とインデックス設定
   - 基本的なビューの作成
   - サンプルデータの投入

2. **基本API実装**
   - カテゴリ管理API
   - 可視化設定CRUD API
   - ランキングデータ取得API

### Phase 2: コア機能実装
1. **カテゴリ別ランキングページ**
   - カテゴリナビゲーション
   - ランキング一覧表示
   - 詳細ページ

2. **可視化機能拡張**
   - 複数グラフタイプ対応
   - 設定の動的切り替え
   - テンプレート機能

### Phase 3: 高度な機能
1. **比較・分析機能**
   - 複数ランキング比較
   - 時系列分析
   - 相関分析

2. **ユーザー体験向上**
   - 検索・フィルタ機能
   - お気に入り機能
   - 共有機能

### Phase 4: 運用・最適化
1. **SEO・パフォーマンス**
   - 静的生成対応
   - キャッシュ戦略
   - 画像最適化

2. **分析・改善**
   - アクセス解析
   - A/Bテスト
   - ユーザーフィードバック

## 実装上の考慮事項

### パフォーマンス
- 頻繁にアクセスされるデフォルト設定のキャッシュ化
- インデックスの適切な設計
- N+1問題の回避（適切なJOIN設計）

### セキュリティ
- ユーザー設定の適切な権限管理
- SQLインジェクション対策
- 設定データのバリデーション

### 運用
- 設定データのバックアップ戦略
- 不要な設定データの定期削除
- 設定データの分析とモニタリング

## 期待される効果

1. **ユーザビリティ向上**: 個人の好みに合わせた可視化設定の保存・再利用
2. **効率化**: よく使用する設定パターンの簡単適用
3. **共有・協働**: チーム内での設定共有による分析の標準化
4. **メンテナンス性**: 設定とデータの分離による保守性向上

この設計により、柔軟で拡張性の高い地図可視化設定管理システムを構築できる。