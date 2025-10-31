-- stats47 統合データベーススキーマ
-- 認証、e-Statメタデータ、ランキング、ダッシュボードを統合
-- 作成日: 2024-12-19
-- 最終更新: 2025-01-31
-- 備考: マイグレーション履歴（025-034）を統合した完全版スキーマ

-- ============================================================================
-- 1. 認証関連テーブル（Auth.js準拠）
-- ============================================================================

-- users: ユーザー認証・管理テーブル
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  emailVerified DATETIME,
  image TEXT,
  username TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- accounts: Auth.js アカウント連携テーブル
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- sessions: Auth.js セッション管理テーブル
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL,
  expires DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- verification_tokens: 認証トークンテーブル
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires DATETIME NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ============================================================================
-- 2. カテゴリ・サブカテゴリテーブル
-- ============================================================================

-- categories: カテゴリ管理テーブル
CREATE TABLE IF NOT EXISTS categories (
  category_key TEXT PRIMARY KEY,
  category_name TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- subcategories: サブカテゴリ管理テーブル
CREATE TABLE IF NOT EXISTS subcategories (
  subcategory_key TEXT PRIMARY KEY,
  subcategory_name TEXT NOT NULL,
  category_key TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_key) REFERENCES categories(category_key) ON DELETE CASCADE
);

-- ============================================================================
-- 3. e-Statメタデータテーブル
-- ============================================================================

-- estat_metainfo: e-Stat APIから取得した統計表メタデータを保存
CREATE TABLE IF NOT EXISTS estat_metainfo (
  stats_data_id TEXT PRIMARY KEY,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  area_type TEXT NOT NULL DEFAULT 'national',
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (area_type IN ('national', 'prefecture', 'city'))
);

-- ============================================================================
-- 4. ランキング関連テーブル
-- ============================================================================

-- data_sources: データソース定義テーブル
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

-- 初期データの投入
INSERT OR IGNORE INTO data_sources (id, name, description, base_url, api_version) VALUES
  ('estat', 'e-Stat', '政府統計の総合窓口', 'https://api.e-stat.go.jp', 'v3'),
  ('custom', 'カスタムデータ', 'ユーザー定義データソース', NULL, NULL);

-- ranking_items: ランキング項目設定テーブル
CREATE TABLE IF NOT EXISTS ranking_items (
  ranking_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  data_source_id TEXT NOT NULL,
  group_key TEXT,
  display_order_in_group INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT 0,
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',
  ranking_direction TEXT DEFAULT 'desc',
  conversion_factor REAL DEFAULT 1,
  decimal_places INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id),
  FOREIGN KEY (group_key) REFERENCES ranking_groups(group_key)
);

-- estat_api_metadata: e-Stat API固有のメタデータテーブル
-- e-Stat APIのパラメータ（stats_data_id、cd_cat01等）をランキングキーと紐付けて保存
-- metadata JSON構造:
--   直接: {"stats_data_id":"xxx","cd_cat01":"yyy","cd_area":"zzz"}
--   比率: {"numerator":{...},"denominator":{...},"multiplier":1000}
-- 注意: このテーブルはe-Stat API専用である。他のデータソース用メタデータは別テーブルで管理する
CREATE TABLE IF NOT EXISTS estat_api_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  area_type TEXT NOT NULL,  -- 'prefecture' | 'city' | 'national'
  calculation_type TEXT NOT NULL DEFAULT 'direct',  -- 'direct' | 'ratio' | 'aggregate'
  metadata TEXT NOT NULL,  -- e-Stat API固有のパラメータ（JSON形式）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ranking_key, area_type),
  FOREIGN KEY (ranking_key) REFERENCES ranking_items(ranking_key) ON DELETE CASCADE,
  CHECK (area_type IN ('prefecture', 'city', 'national')),
  CHECK (calculation_type IN ('direct', 'ratio', 'aggregate'))
);

-- 注意: ranking_values テーブルは使用しません（設計により R2 ストレージを使用）
-- ランキング値データは R2 Storage に JSON 形式で保存されます
-- パス: ranking/{ranking_key}/{area_type}/{time_code}.json

-- ranking_groups: ランキンググループ定義テーブル
CREATE TABLE IF NOT EXISTS ranking_groups (
  group_key TEXT PRIMARY KEY,
  subcategory_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. ダッシュボード関連テーブル
-- ============================================================================

-- dashboard_configs: ダッシュボード設定テーブル
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT NOT NULL,
  area_type TEXT NOT NULL CHECK(area_type IN ('national', 'prefecture')),
  layout_type TEXT NOT NULL DEFAULT 'grid' CHECK(layout_type IN ('grid', 'stacked', 'custom')),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subcategory_id, area_type)
);

-- dashboard_widgets: ダッシュボードウィジェットテーブル
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_config_id INTEGER NOT NULL,
  widget_type TEXT NOT NULL CHECK(widget_type IN ('metric', 'line-chart', 'bar-chart', 'area-chart', 'table')),
  widget_key TEXT NOT NULL,
  title TEXT NOT NULL,
  config TEXT,
  data_source_type TEXT NOT NULL CHECK(data_source_type IN ('ranking', 'estat', 'mock', 'custom')),
  data_source_key TEXT NOT NULL,
  grid_col_span INTEGER NOT NULL DEFAULT 1,
  grid_row_span INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dashboard_config_id) REFERENCES dashboard_configs(id) ON DELETE CASCADE,
  UNIQUE(dashboard_config_id, widget_key)
);

-- widget_templates: ウィジェットテンプレートテーブル
CREATE TABLE IF NOT EXISTS widget_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  widget_type TEXT NOT NULL,
  default_config TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. インデックス作成
-- ============================================================================

-- カテゴリ・サブカテゴリ関連インデックス
-- category_key は PRIMARY KEY なので追加インデックス不要
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- subcategory_key は PRIMARY KEY なので追加インデックス不要
CREATE INDEX IF NOT EXISTS idx_subcategories_category_key ON subcategories(category_key);
CREATE INDEX IF NOT EXISTS idx_subcategories_display_order ON subcategories(display_order);

-- 認証関連インデックス
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider, providerAccountId);
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_sessionToken ON sessions(sessionToken);

-- e-Stat関連インデックス
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_stat_name ON estat_metainfo(stat_name);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_title ON estat_metainfo(title);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_area_type ON estat_metainfo(area_type);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_updated_at ON estat_metainfo(updated_at);

-- ランキング関連インデックス
CREATE INDEX IF NOT EXISTS idx_ranking_items_data_source ON ranking_items(data_source_id);
-- ranking_key は PRIMARY KEY なので追加インデックス不要
CREATE INDEX IF NOT EXISTS idx_ranking_items_active ON ranking_items(is_active);
CREATE INDEX IF NOT EXISTS idx_ranking_items_group_key ON ranking_items(group_key);
CREATE INDEX IF NOT EXISTS idx_estat_api_metadata_ranking ON estat_api_metadata(ranking_key);
CREATE INDEX IF NOT EXISTS idx_estat_api_metadata_area ON estat_api_metadata(area_type);
-- 注意: ranking_values のインデックスは使用しません（R2 ストレージを使用）
CREATE INDEX IF NOT EXISTS idx_ranking_groups_subcategory ON ranking_groups(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_ranking_groups_display_order ON ranking_groups(subcategory_id, display_order);

-- ダッシュボード関連インデックス
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_subcategory ON dashboard_configs(subcategory_id, area_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_active ON dashboard_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_config ON dashboard_widgets(dashboard_config_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_order ON dashboard_widgets(dashboard_config_id, display_order);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_visible ON dashboard_widgets(is_visible);
CREATE INDEX IF NOT EXISTS idx_widget_templates_key ON widget_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_widget_templates_type ON widget_templates(widget_type);

-- ============================================================================
-- 7. ビュー作成
-- ============================================================================

-- v_estat_metainfo_summary: 統計表サマリービュー
CREATE VIEW IF NOT EXISTS v_estat_metainfo_summary AS
SELECT 
  area_type,
  COUNT(*) as count,
  MAX(updated_at) as last_updated
FROM estat_metainfo
GROUP BY area_type;

-- v_user_activity: ユーザーアクティビティビュー
CREATE VIEW IF NOT EXISTS v_user_activity AS
SELECT 
  u.username,
  u.email,
  u.last_login,
  0 as action_count
FROM users u
GROUP BY u.id, u.username, u.email, u.last_login
ORDER BY u.last_login DESC;
