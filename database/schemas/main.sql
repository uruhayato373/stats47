-- e-Stat メタデータ用のD1データベーススキーマ
-- 作成日: 2024-12-19

-- estat_metadata テーブル
-- e-Stat APIから取得したメタデータを保存
CREATE TABLE IF NOT EXISTS estat_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,           -- 統計表ID
  stat_name TEXT NOT NULL,               -- 統計名
  title TEXT NOT NULL,                   -- タイトル
  cat01 TEXT,                            -- カテゴリ1
  item_name TEXT,                        -- 項目名
  unit TEXT,                             -- 単位
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 更新日時
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- 作成日時
);

-- インデックスの作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_stats_data_id ON estat_metadata(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_stat_name ON estat_metadata(stat_name);
CREATE INDEX IF NOT EXISTS idx_cat01 ON estat_metadata(cat01);
CREATE INDEX IF NOT EXISTS idx_updated_at ON estat_metadata(updated_at);

-- サンプルデータの挿入（開発・テスト用）
INSERT OR IGNORE INTO estat_metadata (stats_data_id, stat_name, title, cat01, item_name, unit) VALUES
('0003448237', '人口推計', '人口推計（2020年）', '総人口', '総人口', '人'),
('0003448237', '人口推計', '人口推計（2020年）', '男性人口', '男性人口', '人'),
('0003448237', '人口推計', '人口推計（2020年）', '女性人口', '女性人口', '人'),
('0003448238', '世帯数調査', '世帯数調査（2020年）', '総世帯数', '総世帯数', '世帯'),
('0003448238', '世帯数調査', '世帯数調査（2020年）', '単身世帯', '単身世帯', '世帯'),
('0003448238', '世帯数調査', '世帯数調査（2020年）', '核家族世帯', '核家族世帯', '世帯');

-- テーブル情報の確認用ビュー
CREATE VIEW IF NOT EXISTS v_estat_metadata_summary AS
SELECT 
  stats_data_id,
  stat_name,
  title,
  COUNT(*) as item_count,
  MAX(updated_at) as last_updated
FROM estat_metadata 
GROUP BY stats_data_id, stat_name, title
ORDER BY last_updated DESC;

-- カテゴリ別統計情報のビュー
CREATE VIEW IF NOT EXISTS v_category_summary AS
SELECT 
  cat01 as category,
  COUNT(*) as count,
  COUNT(DISTINCT stats_data_id) as unique_stats_count
FROM estat_metadata 
WHERE cat01 IS NOT NULL
GROUP BY cat01 
ORDER BY count DESC;
