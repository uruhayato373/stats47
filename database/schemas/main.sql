-- stats47 統合データベーススキーマ
-- 認証、e-Statメタデータ、ランキング、ダッシュボードを統合
-- 作成日: 2024-12-19
-- 最終更新: 2025-10-28
-- 備考: マイグレーション履歴を統合した完全版スキーマ

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

-- estat_data_history: e-Statデータ履歴
CREATE TABLE IF NOT EXISTS estat_data_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id TEXT,
  metadata_snapshot TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================================
-- 2. e-Statメタデータテーブル
-- ============================================================================

-- estat_metainfo: e-Stat APIから取得した統計表メタデータを保存
CREATE TABLE IF NOT EXISTS estat_metainfo (
  stats_data_id TEXT PRIMARY KEY,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  area_type TEXT NOT NULL DEFAULT 'country',
  cycle TEXT,
  survey_date TEXT,
  description TEXT,
  last_fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (area_type IN ('country', 'prefecture', 'municipality'))
);

-- ============================================================================
-- 3. ランキング関連テーブル
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
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  data_source_id TEXT NOT NULL,
  group_id INTEGER,
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
  FOREIGN KEY (group_id) REFERENCES ranking_groups(id)
);

-- data_source_metadata: データソース固有メタデータテーブル（拡張版）
-- metadata JSON構造:
--   直接: {"stats_data_id":"xxx","cd_cat01":"yyy","cd_area":"zzz"}
--   比率: {"numerator":{...},"denominator":{...},"multiplier":1000}
CREATE TABLE IF NOT EXISTS data_source_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,
  data_source_id TEXT NOT NULL,
  area_type TEXT NOT NULL,  -- 'prefecture' | 'city' | 'national'
  calculation_type TEXT NOT NULL DEFAULT 'direct',  -- 'direct' | 'ratio' | 'aggregate'
  metadata TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ranking_key, data_source_id, area_type),
  FOREIGN KEY (ranking_key) REFERENCES ranking_items(ranking_key) ON DELETE CASCADE,
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id),
  CHECK (area_type IN ('prefecture', 'city', 'national')),
  CHECK (calculation_type IN ('direct', 'ratio', 'aggregate'))
);

-- ranking_values: ランキング値データテーブル
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
  UNIQUE(ranking_key, time_code, area_code),
  FOREIGN KEY (ranking_key) REFERENCES ranking_items(ranking_key) ON DELETE CASCADE
);

-- ranking_groups: ランキンググループ定義テーブル
CREATE TABLE IF NOT EXISTS ranking_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_key TEXT UNIQUE NOT NULL,
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
-- 4. ダッシュボード関連テーブル
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
-- 5. インデックス作成
-- ============================================================================

-- 認証関連インデックス
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider, providerAccountId);
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_sessionToken ON sessions(sessionToken);
CREATE INDEX IF NOT EXISTS idx_history_stats_id ON estat_data_history(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON estat_data_history(user_id);

-- e-Stat関連インデックス
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_stat_name ON estat_metainfo(stat_name);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_title ON estat_metainfo(title);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_area_type ON estat_metainfo(area_type);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_updated_at ON estat_metainfo(updated_at);

-- ランキング関連インデックス
CREATE INDEX IF NOT EXISTS idx_ranking_items_data_source ON ranking_items(data_source_id);
CREATE INDEX IF NOT EXISTS idx_ranking_items_key ON ranking_items(ranking_key);
CREATE INDEX IF NOT EXISTS idx_ranking_items_active ON ranking_items(is_active);
CREATE INDEX IF NOT EXISTS idx_data_source_metadata_ranking ON data_source_metadata(ranking_key);
CREATE INDEX IF NOT EXISTS idx_data_source_metadata_source ON data_source_metadata(data_source_id);
CREATE INDEX IF NOT EXISTS idx_data_source_metadata_area ON data_source_metadata(area_type);
CREATE INDEX IF NOT EXISTS idx_ranking_values_lookup ON ranking_values(ranking_key, time_code);
CREATE INDEX IF NOT EXISTS idx_ranking_values_area ON ranking_values(area_code);
CREATE INDEX IF NOT EXISTS idx_ranking_values_time ON ranking_values(time_code);
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
-- 6. ビュー作成
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
