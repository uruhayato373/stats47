-- PR-6 Commit 2: port_statistics を DROP
--
-- データは PR-3 の backfill で observations(entity_type='port') に既に COPY 済み
-- (41,733 行 / 14 metric_keys、行数 100% 一致確認済み)。
-- ローカル D1 では既に 2026-05-04 に DROP 済み。本マイグレーションは fresh setup 用。

PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS port_statistics;
PRAGMA foreign_keys = ON;
