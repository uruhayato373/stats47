-- UNIQUE制約の追加
-- estat_metainfo テーブルに (stats_data_id, cat01) のUNIQUE制約を追加
-- SQLiteでは既存テーブルに制約を追加できないため、テーブルを再作成

-- ステップ1: 新しいテーブルを作成（UNIQUE制約付き）
CREATE TABLE IF NOT EXISTS estat_metainfo_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  cat01 TEXT,
  item_name TEXT,
  unit TEXT,
  ranking_key TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- ✅ UNIQUE制約を追加
  UNIQUE(stats_data_id, cat01)
);

-- ステップ2: データをコピー
INSERT INTO estat_metainfo_new
  (id, stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at, created_at)
SELECT
  id, stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at, created_at
FROM estat_metainfo;

-- ステップ3: コピー結果の確認
SELECT
  'データコピー確認' as check_name,
  (SELECT COUNT(*) FROM estat_metainfo) as old_count,
  (SELECT COUNT(*) FROM estat_metainfo_new) as new_count,
  CASE
    WHEN (SELECT COUNT(*) FROM estat_metainfo) = (SELECT COUNT(*) FROM estat_metainfo_new)
    THEN '✅ 一致'
    ELSE '❌ 不一致'
  END as status;

-- ステップ4: 古いテーブルを削除
DROP TABLE estat_metainfo;

-- ステップ5: 新しいテーブルをリネーム
ALTER TABLE estat_metainfo_new RENAME TO estat_metainfo;

-- ステップ6: インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_stats_data_id ON estat_metainfo(stats_data_id);
CREATE INDEX IF NOT EXISTS idx_stat_name ON estat_metainfo(stat_name);
CREATE INDEX IF NOT EXISTS idx_cat01 ON estat_metainfo(cat01);
CREATE INDEX IF NOT EXISTS idx_updated_at ON estat_metainfo(updated_at);
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_ranking_key ON estat_metainfo(ranking_key);

-- ✅ 複合インデックス（検索高速化）
CREATE INDEX IF NOT EXISTS idx_estat_metainfo_stats_cat
  ON estat_metainfo(stats_data_id, cat01);

-- ステップ7: 制約とインデックスの確認
SELECT
  'テーブル制約とインデックス' as info,
  name,
  sql
FROM sqlite_master
WHERE (type = 'table' OR type = 'index')
  AND tbl_name = 'estat_metainfo'
ORDER BY type, name;

-- ステップ8: UNIQUE制約のテスト（重複挿入を試みる）
-- エラーが発生すればUNIQUE制約が正しく機能している
INSERT INTO estat_metainfo
(stats_data_id, stat_name, title, cat01, item_name, unit)
VALUES ('TEST_UNIQUE', 'テスト', 'UNIQUE制約テスト', 'TEST01', 'テスト項目', 'unit');

-- 同じデータを再度挿入（UNIQUE制約エラーが発生する）
-- このSQLは手動テスト用（マイグレーション実行時はコメントアウト）
-- INSERT INTO estat_metainfo
-- (stats_data_id, stat_name, title, cat01, item_name, unit)
-- VALUES ('TEST_UNIQUE', 'テスト', 'UNIQUE制約テスト', 'TEST01', 'テスト項目', 'unit');
-- 期待結果: UNIQUE constraint failed: estat_metainfo.stats_data_id, estat_metainfo.cat01

-- ステップ9: テストデータの削除
DELETE FROM estat_metainfo WHERE stats_data_id = 'TEST_UNIQUE';

-- 完了メッセージ
SELECT '✅ UNIQUE制約の追加が完了しました' as message;
