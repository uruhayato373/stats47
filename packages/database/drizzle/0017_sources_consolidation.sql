-- Sources consolidation (PR-2 of 3-layer schema migration)
--
-- 旧 data_sources (5 行) と source_metadata (402 行) を統合して、すでに投入済みの
-- sources テーブル (110 行) に一本化する。
--
-- - data_sources: id 全 5 件 (estat / ssdse / ipss / mlit_ksj / mlit_dpf) は
--   既に sources に存在するため、参照先を rewire するのみ。
-- - source_metadata: 402 行のうち実質的な内容（adapter_type 5 / memo 1 / その他 396 は
--   estat_stats_tables に重複）はすべて他テーブルで代替可能なため DROP。
--
-- ranking_items.data_source_id の FK 参照先は sources(id) に変更
-- （Drizzle schema 上のみ。SQLite では既存テーブルの FK 制約は ALTER できないが、
--  値は全て sources(id) と一致しているため runtime 整合性は確保済み）。

CREATE TABLE IF NOT EXISTS `sources` (
  `id` TEXT PRIMARY KEY,
  `source_kind` TEXT NOT NULL CHECK(`source_kind` IN ('platform','survey','estat_table')),
  `external_id` TEXT,
  `parent_source_id` TEXT,
  `name` TEXT NOT NULL,
  `organization` TEXT,
  `url` TEXT,
  `description` TEXT,
  `attribution_text` TEXT,
  `license` TEXT,
  `license_url` TEXT,
  `base_url` TEXT,
  `link_template` TEXT,
  `display_order` INTEGER DEFAULT 0,
  `is_active` INTEGER DEFAULT 1,
  `created_at` TEXT DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TEXT DEFAULT CURRENT_TIMESTAMP
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_sources_kind` ON `sources`(`source_kind`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_sources_parent` ON `sources`(`parent_source_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_sources_external_id` ON `sources`(`source_kind`,`external_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_sources_active` ON `sources`(`is_active`);--> statement-breakpoint

DROP TABLE IF EXISTS `source_metadata`;--> statement-breakpoint
DROP TABLE IF EXISTS `data_sources`;
