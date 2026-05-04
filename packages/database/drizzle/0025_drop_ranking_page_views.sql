-- ranking_page_views を DROP (2026-05-04)
--
-- GA4 PV データの D1 キャッシュとして 2026-03 に作成したが、
-- - production app は同テーブルを読まない (R2 snapshot 経由のみ)
-- - GA4 履歴は `.claude/skills/analytics/ga4-improvement/reference/snapshots/<week>/pages.csv` に集約済み
-- - update-featured-rankings は in-memory 集計に変更
-- - lighthouse-check --top-pv は pages.csv 直読みに変更
--
-- 上記により役割が消失。CLAUDE.md「記録先の統一原則」に揃える形で D1 から撤廃。
-- ローカル D1 では本マイグレーションで DROP する。

PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS ranking_page_views;
PRAGMA foreign_keys = ON;
