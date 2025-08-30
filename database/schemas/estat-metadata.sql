-- e-Statメタ情報保存用テーブル
-- 作成日: 2024-12-19
-- 説明: e-Stat APIから取得したメタ情報をCSV形式で保存するテーブル

CREATE TABLE IF NOT EXISTS estat_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,           -- 統計表ID
  stat_name TEXT NOT NULL,               -- 政府統計名
  title TEXT NOT NULL,                   -- 統計表題名
  cat01 TEXT,                            -- 分類01（カテゴリ）
  item_name TEXT,                        -- 項目名
  unit TEXT,                             -- 単位
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 検索性能向上のためのインデックス
CREATE INDEX IF NOT EXISTS idx_estat_metadata_stats_id ON estat_metadata(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_estat_metadata_stat_name ON estat_metadata(stat_name);
CREATE INDEX IF NOT EXISTS idx_estat_metadata_cat01 ON estat_metadata(cat01);
CREATE INDEX IF NOT EXISTS idx_estat_metadata_item_name ON estat_metadata(item_name);

-- 複合インデックス（よく使われる検索パターン）
CREATE INDEX IF NOT EXISTS idx_estat_metadata_search ON estat_metadata(stat_name, cat01, item_name);

-- 統計表IDとカテゴリの組み合わせでユニーク制約
CREATE UNIQUE INDEX IF NOT EXISTS idx_estat_metadata_unique ON estat_metadata(stats_data_id, cat01, item_name);
