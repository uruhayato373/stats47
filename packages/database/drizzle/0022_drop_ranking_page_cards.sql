-- PR-7 Commit 2: ranking_page_cards を DROP
--
-- データは PR-7 commit 1 で page_components + page_component_assignments(page_type='ranking') に
-- migration 済み (20 行 / componentType='stats-line-chart')。
-- ローカル D1 では既に 2026-05-04 に DROP 済み。本マイグレーションは fresh setup 用。

PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS ranking_page_cards;
PRAGMA foreign_keys = ON;
