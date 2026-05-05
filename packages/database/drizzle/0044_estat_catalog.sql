CREATE TABLE IF NOT EXISTS `estat_catalog` (
  `id`            integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `stats_data_id` text NOT NULL,
  `cat01_code`    text NOT NULL,
  `cat01_name`    text NOT NULL,
  `unit`          text,
  `category_key`  text,
  `ranking_key`   text,
  `is_active`     integer DEFAULT 0,
  `is_excluded`   integer DEFAULT 0,
  `metric_key`    text,
  `created_at`    text DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    text DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS `estat_catalog_uniq`              ON `estat_catalog` (`stats_data_id`, `cat01_code`);
CREATE INDEX        IF NOT EXISTS `idx_estat_catalog_active`        ON `estat_catalog` (`is_active`);
CREATE INDEX        IF NOT EXISTS `idx_estat_catalog_category`      ON `estat_catalog` (`category_key`, `is_active`);
CREATE INDEX        IF NOT EXISTS `idx_estat_catalog_ranking_key`   ON `estat_catalog` (`ranking_key`);
