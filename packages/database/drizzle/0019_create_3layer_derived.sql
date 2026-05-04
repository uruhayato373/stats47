-- Create 3-layer derived tables (PR-5 of 3-layer schema migration, commit 2)
--
-- 旧 派生テーブル (area_profile_rankings / correlation_analysis / ranking_ai_content /
-- ranking_tags) を indicator_id FK ベースの新 schema に置換する。
-- Commit 2 では新テーブルを作成してデータを migrate するのみ。旧テーブルの DROP は
-- Commit 7 で実施。
--
-- Migration row counts (local D1):
-- - area_profile_rankings (17,678) → area_profiles (17,678) — 100% mapping
-- - correlation_analysis (1,674,544) → correlations (1,674,544) — 100% mapping
-- - ranking_ai_content (1,943) → ai_content (1,941) — orphan 2 行 skip
-- - ranking_tags (3,638) → indicator_tags (3,638) — 100% mapping

CREATE TABLE IF NOT EXISTS `area_profiles` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `entity_type` TEXT NOT NULL CHECK(`entity_type` IN ('prefecture','city','port','fishing_port')),
  `entity_code` TEXT NOT NULL,
  `entity_name` TEXT NOT NULL,
  `indicator_id` INTEGER NOT NULL REFERENCES `indicators`(`id`),
  `year_code` TEXT NOT NULL,
  `type` TEXT NOT NULL CHECK(`type` IN ('strength','weakness')),
  `rank` INTEGER NOT NULL,
  `value_numeric` REAL NOT NULL,
  `unit` TEXT NOT NULL,
  `percentile` REAL NOT NULL,
  `created_at` TEXT DEFAULT CURRENT_TIMESTAMP
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `idx_area_profiles_entity_indicator_type`
  ON `area_profiles`(`entity_type`,`entity_code`,`indicator_id`,`type`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_area_profiles_entity` ON `area_profiles`(`entity_type`,`entity_code`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_area_profiles_indicator` ON `area_profiles`(`indicator_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_area_profiles_rank` ON `area_profiles`(`rank`);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `correlations` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `indicator_x_id` INTEGER NOT NULL REFERENCES `indicators`(`id`),
  `indicator_y_id` INTEGER NOT NULL REFERENCES `indicators`(`id`),
  `year_x` TEXT NOT NULL,
  `year_y` TEXT NOT NULL,
  `pearson_r` REAL NOT NULL,
  `partial_r_population` REAL,
  `partial_r_area` REAL,
  `partial_r_aging` REAL,
  `partial_r_density` REAL,
  `scatter_data_json` TEXT NOT NULL,
  `calculated_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `idx_correlations_pair_year`
  ON `correlations`(`indicator_x_id`,`indicator_y_id`,`year_x`,`year_y`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_correlations_indicator_x` ON `correlations`(`indicator_x_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_correlations_indicator_y` ON `correlations`(`indicator_y_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_correlations_year_x` ON `correlations`(`year_x`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_correlations_year_y` ON `correlations`(`year_y`);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `ai_content` (
  `indicator_id` INTEGER PRIMARY KEY REFERENCES `indicators`(`id`),
  `year_code` TEXT NOT NULL,
  `faq` TEXT,
  `regional_analysis` TEXT,
  `insights` TEXT,
  `ai_model` TEXT NOT NULL,
  `prompt_version` TEXT NOT NULL,
  `generated_at` TEXT NOT NULL,
  `is_active` INTEGER DEFAULT 1,
  `is_proofread` INTEGER DEFAULT 0,
  `proofread_at` TEXT,
  `editorial_source` TEXT DEFAULT 'ai-generated',
  `reviewed_by` TEXT,
  `created_at` TEXT DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TEXT DEFAULT CURRENT_TIMESTAMP
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_ai_content_is_active` ON `ai_content`(`is_active`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_ai_content_is_proofread` ON `ai_content`(`is_proofread`);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `indicator_tags` (
  `indicator_id` INTEGER NOT NULL REFERENCES `indicators`(`id`) ON DELETE CASCADE,
  `tag_key` TEXT NOT NULL REFERENCES `tags`(`tag_key`),
  `created_at` TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`indicator_id`,`tag_key`)
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_indicator_tags_tag_key` ON `indicator_tags`(`tag_key`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_indicator_tags_indicator` ON `indicator_tags`(`indicator_id`);
