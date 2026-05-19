-- gis_datasets から is_downloaded 列を削除
--
-- Phase 2 of GIS dataset management refactor (plan: stateless-stargazing-teapot).
-- is_downloaded は status='imported' で完全に代替されたため不要。
-- migration 0047 で status を導入し、0047/0048 適用後に運用確認済み。
--
-- SQLite 3.35+ の ALTER TABLE DROP COLUMN を使用。

ALTER TABLE gis_datasets DROP COLUMN is_downloaded;
