-- idカラムの削除と複合主キーへの変更
-- 作成日: 2025-01-31
-- 説明: articlesテーブルからidカラムを削除し、複合主キー(slug, time)に変更

-- ============================================================================
-- idカラムの削除と複合主キーへの変更
-- ============================================================================

-- 注意: SQLiteでは既存の主キーを直接変更できないため、
-- 一時テーブルを使用して再構築する必要があります

-- 1. 一時テーブルを作成（新しい構造）
CREATE TABLE IF NOT EXISTS articles_new (
  category TEXT NOT NULL,
  slug TEXT NOT NULL,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT,
  file_path TEXT NOT NULL,
  file_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (slug, time)
);

-- 2. 既存データをコピー（idカラムを除く）
INSERT INTO articles_new (
  category, slug, time, title, description, tags,
  file_path, file_hash, created_at, updated_at
)
SELECT 
  category, slug, time, title, description, tags,
  file_path, file_hash, created_at, updated_at
FROM articles;

-- 3. 古いテーブルを削除
DROP TABLE articles;

-- 4. 新しいテーブルをリネーム
ALTER TABLE articles_new RENAME TO articles;

-- ============================================================================
-- インデックスの再作成
-- ============================================================================

-- 主キー(slug, time)は既にインデックスが作成されているため、
-- 他のインデックスを再作成
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_time ON articles(time DESC);
CREATE INDEX IF NOT EXISTS idx_articles_file_path ON articles(file_path);

