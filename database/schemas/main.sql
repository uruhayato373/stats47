-- メインスキーマファイル
-- 作成日: 2024-12-19
-- 説明: プロジェクト全体のデータベーススキーマを統合

-- 認証関連スキーマ
.read database/schemas/auth.sql

-- e-Stat関連スキーマ
.read database/schemas/estat-metadata.sql

-- スキーマバージョン管理テーブル
CREATE TABLE IF NOT EXISTS schema_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- 初期バージョンを記録
INSERT OR IGNORE INTO schema_versions (version, description) 
VALUES ('1.0.0', '初期スキーマ作成');
