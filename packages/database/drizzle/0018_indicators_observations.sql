-- Indicators / Observations schema declaration (PR-3 of 3-layer schema migration)
--
-- 旧 ranking_items / ranking_data の置換となる新 schema。両者は並行運用される。
-- ranking_name (448 行は seo_title に migrate 済み) と data_source_id は削除。
--
-- ローカル D1 には実験データとして既に投入済み:
-- - indicators: 3,064 行 (ranking_items 3,050 行をカバー + 14 行追加)
-- - observations: 3,365,746 行 (ranking_data 3,324,013 行をカバー)
--
-- このファイルは fresh setup 用。

CREATE TABLE IF NOT EXISTS `indicators` (
  `id` INTEGER PRIMARY KEY,
  `key` TEXT NOT NULL,
  `area_type` TEXT NOT NULL CHECK(`area_type` IN ('prefecture','city','national','port','fishing_port')),
  `title` TEXT NOT NULL,
  `subtitle` TEXT,
  `description` TEXT,
  `unit` TEXT NOT NULL,
  `source_id` TEXT REFERENCES `sources`(`id`),
  `survey_id` TEXT REFERENCES `surveys`(`id`),
  `category_key` TEXT,
  `visualization_preset` TEXT,
  `visualization_config_json` TEXT,
  `source_config_json` TEXT,
  `value_display_config_json` TEXT,
  `calculation_config_json` TEXT,
  `group_key` TEXT,
  `additional_categories_json` TEXT,
  `demographic_attr` TEXT,
  `normalization_basis` TEXT,
  `latest_year` TEXT,
  `available_years_json` TEXT,
  `is_active` INTEGER DEFAULT 1,
  `is_featured` INTEGER DEFAULT 0,
  `featured_order` INTEGER DEFAULT 0,
  `seo_title` TEXT,
  `seo_description` TEXT,
  `created_at` TEXT DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TEXT DEFAULT CURRENT_TIMESTAMP
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `idx_indicators_natural_key` ON `indicators`(`key`,`area_type`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_indicators_key` ON `indicators`(`key`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_indicators_area_type` ON `indicators`(`area_type`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_indicators_source_id` ON `indicators`(`source_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_indicators_category_key` ON `indicators`(`category_key`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_indicators_active` ON `indicators`(`is_active`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_indicators_featured` ON `indicators`(`is_featured`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_indicators_group_key` ON `indicators`(`group_key`);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `observations` (
  `indicator_id` INTEGER NOT NULL REFERENCES `indicators`(`id`),
  `entity_type` TEXT NOT NULL CHECK(`entity_type` IN ('prefecture','city','port','fishing_port')),
  `entity_code` TEXT NOT NULL,
  `year_code` TEXT NOT NULL,
  `value_numeric` REAL,
  `value_text` TEXT,
  `rank` INTEGER,
  `percentile` REAL,
  `entity_name` TEXT,
  `year_name` TEXT,
  `unit` TEXT,
  `category_name` TEXT,
  `created_at` TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`indicator_id`,`entity_type`,`entity_code`,`year_code`)
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_observations_entity` ON `observations`(`entity_type`,`entity_code`,`year_code`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_observations_indicator_year` ON `observations`(`indicator_id`,`year_code`);
