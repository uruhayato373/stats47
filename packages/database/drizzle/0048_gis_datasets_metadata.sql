-- gis_datasets に純メタデータ列と RANKINGS 連携列を追加
--
-- Phase 2 of GIS dataset management refactor (plan: stateless-stargazing-teapot).
-- registry.ts に閉じていた純メタ (stats47_category / latest_version / estimated_size) を
-- D1 に寄せ、register-ksj-rankings.ts の RANKINGS hardcode を D1 ソース化する。
--
-- seed は scripts/seed-from-registry.ts で実行する (本 migration は列追加のみ)。

ALTER TABLE gis_datasets ADD COLUMN stats47_category TEXT;
ALTER TABLE gis_datasets ADD COLUMN latest_version TEXT;
ALTER TABLE gis_datasets ADD COLUMN estimated_size TEXT;
ALTER TABLE gis_datasets ADD COLUMN is_ranking_target INTEGER NOT NULL DEFAULT 0;
ALTER TABLE gis_datasets ADD COLUMN ranking_config TEXT;

CREATE INDEX IF NOT EXISTS idx_gis_datasets_ranking_target ON gis_datasets(is_ranking_target);
