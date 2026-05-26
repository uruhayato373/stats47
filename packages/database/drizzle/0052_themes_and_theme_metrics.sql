-- themes / theme_metrics — テーマダッシュボード構成の D1 化 (2026-05-26)
--
-- 背景: 旧 packages/types/src/indicator-sets/*.ts に TS ハードコードしていた
-- 17 テーマ x ~10 metrics の構成を D1 に移行。R2 snapshot
-- (app/themes/[key]/config.json) 経由で web app が読む統一フローへ。
--
-- 既存 TS は seed の source として残し、D1 移行が安定したら別 PR で削除予定。

CREATE TABLE `themes` (
  `theme_key` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `category` text,
  `usage` text DEFAULT 'theme' NOT NULL,
  `keywords_json` text DEFAULT '[]',
  `related_article_tag_keys_json` text DEFAULT '[]',
  `display_order` integer DEFAULT 0,
  `is_active` integer DEFAULT 1,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_themes_display_order` ON `themes` (`display_order`);
--> statement-breakpoint
CREATE INDEX `idx_themes_usage` ON `themes` (`usage`);
--> statement-breakpoint
CREATE INDEX `idx_themes_active` ON `themes` (`is_active`);
--> statement-breakpoint

CREATE TABLE `theme_metrics` (
  `theme_key` text NOT NULL,
  `metric_key` text NOT NULL,
  `panel_label` text,
  `panel_order` integer DEFAULT 0,
  `role` text,
  `short_label` text,
  `chart_type` text DEFAULT 'choropleth' NOT NULL,
  `chart_target` text,
  `chart_config_json` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`theme_key`, `metric_key`, `chart_type`),
  FOREIGN KEY (`theme_key`) REFERENCES `themes`(`theme_key`),
  FOREIGN KEY (`metric_key`) REFERENCES `metrics`(`key`)
);
--> statement-breakpoint
CREATE INDEX `idx_theme_metrics_theme_key` ON `theme_metrics` (`theme_key`);
--> statement-breakpoint
CREATE INDEX `idx_theme_metrics_metric_key` ON `theme_metrics` (`metric_key`);
--> statement-breakpoint
CREATE INDEX `idx_theme_metrics_panel` ON `theme_metrics` (`theme_key`, `panel_label`, `panel_order`);
