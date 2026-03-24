-- construction カテゴリのダッシュボード再構成マイグレーション
-- サブカテゴリ 6→5 への整理に伴い、既存 DB の dashboard_configs / dashboard_components /
-- ranking_link / subcategories を新構成に合わせる。
--
-- 実行前: バックアップを取得すること。
-- 実行後: 必要に応じて `pnpm run seed` (packages/database) で subcategories / ranking_tags を最新化。

PRAGMA foreign_keys = OFF;

-- =============================================================================
-- 1. dashboard_components: ranking_link の置換 (housing-statistics → housing-overview)
-- =============================================================================
UPDATE dashboard_components
SET ranking_link = REPLACE(ranking_link, '/construction/housing-statistics/', '/construction/housing-overview/')
WHERE ranking_link LIKE '%/construction/housing-statistics/%';

-- =============================================================================
-- 2. dashboard_components: dashboard_id の更新（旧ID → 新ID）
-- =============================================================================
UPDATE dashboard_components SET dashboard_id = 'housing-overview-national' WHERE dashboard_id = 'living-environment-national';
UPDATE dashboard_components SET dashboard_id = 'housing-overview-prefecture' WHERE dashboard_id = 'living-environment-prefecture';
UPDATE dashboard_components SET dashboard_id = 'housing-overview-city' WHERE dashboard_id = 'living-environment-city';

UPDATE dashboard_components SET dashboard_id = 'living-space-national' WHERE dashboard_id = 'housing-facilities-national';
UPDATE dashboard_components SET dashboard_id = 'living-space-prefecture' WHERE dashboard_id = 'housing-facilities-prefecture';
UPDATE dashboard_components SET dashboard_id = 'living-space-city' WHERE dashboard_id = 'housing-facilities-city';
UPDATE dashboard_components SET dashboard_id = 'living-space-city' WHERE dashboard_id = 'housing-facilities-city-1768624180752';

UPDATE dashboard_components SET dashboard_id = 'new-construction-national' WHERE dashboard_id = 'construction-manufacturing-national';
UPDATE dashboard_components SET dashboard_id = 'new-construction-prefecture' WHERE dashboard_id = 'construction-manufacturing-prefecture';
UPDATE dashboard_components SET dashboard_id = 'new-construction-city' WHERE dashboard_id = 'construction-manufacturing-city';

UPDATE dashboard_components SET dashboard_id = 'housing-overview-national' WHERE dashboard_id = 'housing-statistics-national';
UPDATE dashboard_components SET dashboard_id = 'housing-overview-prefecture' WHERE dashboard_id = 'housing-statistics-prefecture';
UPDATE dashboard_components SET dashboard_id = 'housing-overview-city' WHERE dashboard_id = 'housing-statistics-city';

-- =============================================================================
-- 3. dashboard_configs: 旧IDの行を新IDで挿入し、subcategory_key / display_name を更新
-- =============================================================================
-- living-environment → housing-overview
INSERT OR REPLACE INTO dashboard_configs (id, subcategory_key, area_type, display_name, display_order, is_active, is_featured, featured_order, created_at, updated_at)
SELECT 'housing-overview-national', 'housing-overview', area_type, '住宅概況', display_order, is_active, is_featured, featured_order, created_at, updated_at
FROM dashboard_configs WHERE id = 'living-environment-national';
INSERT OR REPLACE INTO dashboard_configs (id, subcategory_key, area_type, display_name, display_order, is_active, is_featured, featured_order, created_at, updated_at)
SELECT 'housing-overview-prefecture', 'housing-overview', area_type, '住宅概況', display_order, is_active, is_featured, featured_order, created_at, updated_at
FROM dashboard_configs WHERE id = 'living-environment-prefecture';
INSERT OR REPLACE INTO dashboard_configs (id, subcategory_key, area_type, display_name, display_order, is_active, is_featured, featured_order, created_at, updated_at)
SELECT 'housing-overview-city', 'housing-overview', area_type, '住宅概況', display_order, is_active, is_featured, featured_order, created_at, updated_at
FROM dashboard_configs WHERE id = 'living-environment-city';

-- housing-facilities → living-space
INSERT OR REPLACE INTO dashboard_configs (id, subcategory_key, area_type, display_name, display_order, is_active, is_featured, featured_order, created_at, updated_at)
SELECT 'living-space-national', 'living-space', area_type, '居住水準', display_order, is_active, is_featured, featured_order, created_at, updated_at
FROM dashboard_configs WHERE id = 'housing-facilities-national';
INSERT OR REPLACE INTO dashboard_configs (id, subcategory_key, area_type, display_name, display_order, is_active, is_featured, featured_order, created_at, updated_at)
SELECT 'living-space-prefecture', 'living-space', area_type, '居住水準', display_order, is_active, is_featured, featured_order, created_at, updated_at
FROM dashboard_configs WHERE id = 'housing-facilities-prefecture';
INSERT OR REPLACE INTO dashboard_configs (id, subcategory_key, area_type, display_name, display_order, is_active, is_featured, featured_order, created_at, updated_at)
SELECT 'living-space-city', 'living-space', area_type, '居住水準', display_order, is_active, is_featured, featured_order, created_at, updated_at
FROM dashboard_configs WHERE id LIKE 'housing-facilities-city%' LIMIT 1;

-- construction-manufacturing → new-construction
INSERT OR REPLACE INTO dashboard_configs (id, subcategory_key, area_type, display_name, display_order, is_active, is_featured, featured_order, created_at, updated_at)
SELECT 'new-construction-national', 'new-construction', area_type, '建設・着工', display_order, is_active, is_featured, featured_order, created_at, updated_at
FROM dashboard_configs WHERE id = 'construction-manufacturing-national';
INSERT OR REPLACE INTO dashboard_configs (id, subcategory_key, area_type, display_name, display_order, is_active, is_featured, featured_order, created_at, updated_at)
SELECT 'new-construction-prefecture', 'new-construction', area_type, '建設・着工', display_order, is_active, is_featured, featured_order, created_at, updated_at
FROM dashboard_configs WHERE id = 'construction-manufacturing-prefecture';
INSERT OR REPLACE INTO dashboard_configs (id, subcategory_key, area_type, display_name, display_order, is_active, is_featured, featured_order, created_at, updated_at)
SELECT 'new-construction-city', 'new-construction', area_type, '建設・着工', display_order, is_active, is_featured, featured_order, created_at, updated_at
FROM dashboard_configs WHERE id = 'construction-manufacturing-city';

-- 旧 config 行を削除（新IDは上で INSERT OR REPLACE 済みのため、旧IDのみ削除）
DELETE FROM dashboard_configs WHERE id IN (
  'living-environment-national', 'living-environment-prefecture', 'living-environment-city',
  'housing-facilities-national', 'housing-facilities-prefecture', 'housing-facilities-city', 'housing-facilities-city-1768624180752',
  'construction-manufacturing-national', 'construction-manufacturing-prefecture', 'construction-manufacturing-city',
  'housing-statistics-national', 'housing-statistics-prefecture', 'housing-statistics-city'
);

-- =============================================================================
-- 4. subcategories: 旧キー削除（新キーは seed で投入する想定）
-- =============================================================================
DELETE FROM subcategories WHERE subcategory_key IN (
  'living-environment', 'housing-facilities', 'construction-manufacturing', 'housing-statistics'
);

-- =============================================================================
-- 5. ranking_tags: 旧 subcategory_key を新キーに一括更新
--    （細かい振り分けは remap-construction-ranking-tags.mjs 済みの seed で上書きする想定）
-- =============================================================================
UPDATE ranking_tags SET subcategory_key = 'housing-overview' WHERE subcategory_key = 'housing-statistics';
UPDATE ranking_tags SET subcategory_key = 'housing-overview' WHERE subcategory_key = 'living-environment';
UPDATE ranking_tags SET subcategory_key = 'living-space' WHERE subcategory_key = 'housing-facilities';
-- 製造業系は manufacturing、それ以外の construction-manufacturing は new-construction
UPDATE ranking_tags SET subcategory_key = 'manufacturing' WHERE subcategory_key = 'construction-manufacturing'
  AND (ranking_key LIKE 'shipment-value-manufacturing%' OR ranking_key LIKE 'manufacturing-%'
    OR ranking_key LIKE 'gross-prefectural-product-manufacturing%' OR ranking_key LIKE 'mfg-%');
UPDATE ranking_tags SET subcategory_key = 'new-construction' WHERE subcategory_key = 'construction-manufacturing';

PRAGMA foreign_keys = ON;

-- 実行後: packages/database で `pnpm run seed` を実行し、subcategories の新キー定義と
-- ranking_tags の詳細マッピングを反映することを推奨する。
