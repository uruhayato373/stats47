-- estat_metainfoテーブル簡素化マイグレーション
-- 作成日: 2025-10-17
-- 目的: stats_data_idのみを管理するシンプルな構造に変更

-- 1. 新しいテーブル作成
CREATE TABLE estat_metainfo_new (
  stats_data_id TEXT PRIMARY KEY,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  gov_org TEXT,
  cycle TEXT,
  survey_date TEXT,
  description TEXT,
  last_fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. データ移行（stats_data_idレベルで集約）
INSERT INTO estat_metainfo_new 
  (stats_data_id, stat_name, title, updated_at, created_at)
SELECT DISTINCT
  stats_data_id,
  stat_name,
  title,
  MAX(updated_at) as updated_at,
  MIN(created_at) as created_at
FROM estat_metainfo
GROUP BY stats_data_id, stat_name, title;

-- 3. 旧テーブル削除
DROP TABLE estat_metainfo;

-- 4. テーブルリネーム
ALTER TABLE estat_metainfo_new RENAME TO estat_metainfo;

-- 5. インデックス作成
CREATE INDEX idx_estat_metainfo_stat_name ON estat_metainfo(stat_name);
CREATE INDEX idx_estat_metainfo_title ON estat_metainfo(title);
CREATE INDEX idx_estat_metainfo_gov_org ON estat_metainfo(gov_org);
CREATE INDEX idx_estat_metainfo_updated_at ON estat_metainfo(updated_at);

-- 6. 既存ビューの削除（不要になったもの）
DROP VIEW IF EXISTS estat_metainfo_unique;
DROP VIEW IF EXISTS v_estat_metainfo_summary;
DROP VIEW IF EXISTS v_category_summary;

-- 7. 確認クエリ
SELECT COUNT(*) as total_records FROM estat_metainfo;
SELECT * FROM estat_metainfo LIMIT 5;
