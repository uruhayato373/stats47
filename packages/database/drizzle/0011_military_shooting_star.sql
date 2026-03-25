CREATE TABLE `chart_definitions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chart_key` text NOT NULL,
	`component_type` text NOT NULL,
	`title` text NOT NULL,
	`component_props` text NOT NULL,
	`source_name` text,
	`source_link` text,
	`ranking_link` text,
	`tags` text,
	`grid_column_span` integer DEFAULT 12,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chart_definitions_chart_key_unique` ON `chart_definitions` (`chart_key`);--> statement-breakpoint
CREATE INDEX `idx_chart_definitions_chart_key` ON `chart_definitions` (`chart_key`);--> statement-breakpoint
CREATE INDEX `idx_chart_definitions_component_type` ON `chart_definitions` (`component_type`);--> statement-breakpoint
CREATE TABLE `page_chart_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_type` text NOT NULL,
	`page_key` text NOT NULL,
	`chart_key` text NOT NULL,
	`section` text,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_page_chart_assignments_page` ON `page_chart_assignments` (`page_type`,`page_key`);--> statement-breakpoint
CREATE INDEX `idx_page_chart_assignments_chart_key` ON `page_chart_assignments` (`chart_key`);--> statement-breakpoint
CREATE INDEX `idx_page_chart_unique` ON `page_chart_assignments` (`page_type`,`page_key`,`chart_key`);