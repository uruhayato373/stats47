-- stats47 統合データベーススキーマ
-- 認証、e-Statメタデータ、ランキングを統合
-- 作成日: 2024-12-19
-- 最終更新: 2025-01-31
-- 備考: マイグレーション履歴（025-038）を統合した完全版スキーマ
-- 注意: ダッシュボードはコンポーネントベースのアプローチに移行したため、データベーステーブルは使用しません

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

-- estat_ranking_mappings: e-Stat APIパラメータとランキング項目のマッピングテーブル
-- CSVファイル（mapping.csv）からインポートするデータを保存
-- isRankingフラグでランキング変換対象を指定
CREATE TABLE IF NOT EXISTS estat_ranking_mappings (
  stats_data_id TEXT NOT NULL,
  cat01 TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  unit TEXT,
  area_type TEXT NOT NULL DEFAULT 'prefecture',  -- 'prefecture' | 'city' | 'national'
  is_ranking BOOLEAN DEFAULT 0,  -- ランキング変換対象フラグ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (stats_data_id, cat01),
  CHECK (area_type IN ('prefecture', 'city', 'national'))
);

-- ============================================================================
-- 4. ランキング関連テーブル
-- ============================================================================

-- ranking_items: ランキング項目設定テーブル
-- 注意: このテーブルはe-Stat API専用です
CREATE TABLE IF NOT EXISTS ranking_items (
  ranking_key TEXT NOT NULL,
  area_type TEXT NOT NULL,  -- 'prefecture' | 'city' | 'national'
  label TEXT NOT NULL,
  ranking_name TEXT NOT NULL,
  annotation TEXT,
  unit TEXT NOT NULL,
  group_key TEXT,
  display_order_in_group INTEGER DEFAULT 0,
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',
  ranking_direction TEXT DEFAULT 'desc',
  conversion_factor REAL DEFAULT 1,
  decimal_places INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ranking_key, area_type),
  CHECK (area_type IN ('prefecture', 'city', 'national')),
  FOREIGN KEY (group_key) REFERENCES ranking_groups(group_key)
);

-- 注意: ranking_values テーブルは使用しません（設計により R2 ストレージを使用）
-- 注意: estat_api_metadata テーブルも使用しません（estat_ranking_mappings で十分）
-- ランキング値データは R2 Storage に JSON 形式で保存されます
-- パス: ranking/{ranking_key}/{area_type}/{time_code}.json

-- ranking_groups: ランキンググループ定義テーブル
CREATE TABLE IF NOT EXISTS ranking_groups (
  group_key TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  label TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ranking_group_subcategories: ランキンググループとサブカテゴリの多対多リレーション（中間テーブル）
CREATE TABLE IF NOT EXISTS ranking_group_subcategories (
  group_key TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_key, subcategory_id),
  FOREIGN KEY (group_key) REFERENCES ranking_groups(group_key) ON DELETE CASCADE,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(subcategory_key) ON DELETE CASCADE
);

-- ============================================================================
-- 5. ダッシュボード関連テーブル
-- ============================================================================
-- 注意: ダッシュボードはコンポーネントベースのアプローチに移行したため、
-- データベーステーブルは使用しません。
-- 各サブカテゴリのダッシュボードコンポーネントは以下の場所に配置されています：
-- src/features/dashboard/components/[category]/[subcategory]/[ComponentName]Dashboard.tsx

-- ============================================================================
-- 6. ブログ記事関連テーブル
-- ============================================================================

-- articles: MDXファイルのfrontmatter管理テーブル
-- contents内のMDXファイルのfrontmatterをデータベースで管理
CREATE TABLE IF NOT EXISTS articles (
  category TEXT NOT NULL,  -- 実際のディレクトリ名（actualCategory）
  slug TEXT NOT NULL,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,  -- frontmatter.descriptionまたはコンテンツから生成した抜粋
  tags TEXT,  -- JSON配列として保存
  file_path TEXT NOT NULL,  -- 元のファイルパス
  file_hash TEXT,  -- ファイル内容のハッシュ（変更検知用、SHA-256）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (slug, time)
);

-- ============================================================================
-- 7. インデックス作成
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
CREATE INDEX IF NOT EXISTS idx_estat_ranking_mappings_stats_data_id ON estat_ranking_mappings(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_estat_ranking_mappings_is_ranking ON estat_ranking_mappings(is_ranking);
CREATE INDEX IF NOT EXISTS idx_estat_ranking_mappings_item_code ON estat_ranking_mappings(item_code);
CREATE INDEX IF NOT EXISTS idx_estat_ranking_mappings_area_type ON estat_ranking_mappings(area_type);

-- ランキング関連インデックス
-- (ranking_key, area_type) は PRIMARY KEY なので追加インデックス不要
CREATE INDEX IF NOT EXISTS idx_ranking_items_active ON ranking_items(is_active);
CREATE INDEX IF NOT EXISTS idx_ranking_items_group_key ON ranking_items(group_key);
CREATE INDEX IF NOT EXISTS idx_ranking_items_area_type ON ranking_items(area_type);
-- 注意: ranking_values のインデックスは使用しません（R2 ストレージを使用）
-- 注意: estat_api_metadata のインデックスも使用しません（テーブルを削除したため）
CREATE INDEX IF NOT EXISTS idx_ranking_group_subcategories_group ON ranking_group_subcategories(group_key);
CREATE INDEX IF NOT EXISTS idx_ranking_group_subcategories_subcategory ON ranking_group_subcategories(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_ranking_group_subcategories_display_order ON ranking_group_subcategories(subcategory_id, display_order);

-- ダッシュボード関連インデックス
-- 注意: ダッシュボードはコンポーネントベースのアプローチに移行したため、
-- データベースインデックスは不要です。

-- ブログ記事関連インデックス
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_time ON articles(time DESC);
CREATE INDEX IF NOT EXISTS idx_articles_file_path ON articles(file_path);

-- ============================================================================
-- 8. ビュー作成
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
