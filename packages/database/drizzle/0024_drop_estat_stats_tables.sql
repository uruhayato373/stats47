-- estat_stats_tables を DROP (Commit 5 of estat metainfo unification)
--
-- 0023 で registered 行 (61) を merge、migrate-estat-stats-tables-to-metainfo.ts で
-- candidate 行 (8,399) を estat_metainfo に移行済み。本テーブルは役割を終えた。
-- ローカル D1 では既に 2026-05-04 に DROP 済み。本マイグレーションは fresh setup 用。

PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS estat_stats_tables;
PRAGMA foreign_keys = ON;
