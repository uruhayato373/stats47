-- articlesテーブル: MDXファイルのfrontmatter管理テーブル
-- 作成日: 2025-01-31
-- 説明: contents内のMDXファイルのfrontmatterをデータベースで管理するためのテーブル

-- ============================================================================
-- articlesテーブル作成
-- ============================================================================

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,  -- {category}/{slug}/{year}形式の一意ID
  category TEXT NOT NULL,  -- 実際のディレクトリ名（actualCategory）
  slug TEXT NOT NULL,
  year TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,  -- frontmatter.descriptionまたはコンテンツから生成した抜粋
  frontmatter_category TEXT NOT NULL,  -- frontmatter.category
  tags TEXT,  -- JSON配列として保存
  date TEXT NOT NULL,
  stats_data_id TEXT,
  file_path TEXT NOT NULL,  -- 元のファイルパス
  file_hash TEXT,  -- ファイル内容のハッシュ（変更検知用、SHA-256）
  content_length INTEGER,  -- MDXコンテンツの長さ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, slug, year)
);

-- ============================================================================
-- インデックス作成
-- ============================================================================

-- カテゴリ検索用インデックス
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

-- スラッグ検索用インデックス
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- 日付ソート用インデックス（降順）
CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(date DESC);

-- frontmatter_category検索用インデックス
CREATE INDEX IF NOT EXISTS idx_articles_frontmatter_category ON articles(frontmatter_category);

-- 統計データID検索用インデックス
CREATE INDEX IF NOT EXISTS idx_articles_stats_data_id ON articles(stats_data_id);

-- ファイルパス検索用インデックス
CREATE INDEX IF NOT EXISTS idx_articles_file_path ON articles(file_path);

