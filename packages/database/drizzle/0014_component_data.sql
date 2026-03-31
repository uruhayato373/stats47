CREATE TABLE `component_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chart_key` text NOT NULL,
	`area_code` text NOT NULL,
	`year_code` text NOT NULL,
	`category_key` text NOT NULL,
	`value` real,
	`unit` text,
	`source_id` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_component_data` ON `component_data` (`chart_key`,`area_code`,`year_code`,`category_key`);--> statement-breakpoint
CREATE INDEX `idx_component_data_lookup` ON `component_data` (`chart_key`,`area_code`);
