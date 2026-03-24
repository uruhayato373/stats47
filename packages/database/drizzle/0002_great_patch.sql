PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_comparison_components` (
	`id` text PRIMARY KEY NOT NULL,
	`category_key` text NOT NULL,
	`component_type` text NOT NULL,
	`display_order` integer DEFAULT 0,
	`grid_column_span` integer DEFAULT 6,
	`grid_column_span_tablet` integer,
	`grid_column_span_sm` integer,
	`title` text,
	`component_props` text,
	`ranking_link` text,
	`section_label` text,
	`is_active` integer DEFAULT true,
	`source_link` text,
	`source_name` text,
	`area_type` text DEFAULT 'prefecture' NOT NULL,
	`data_source` text DEFAULT 'ranking',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`category_key`) REFERENCES `categories`(`category_key`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "comparison_components_component_type_check" CHECK("__new_comparison_components"."component_type" IN ('kpi-card', 'bar-chart', 'line-chart', 'radar-chart', 'multi-stats-card', 'donut-chart', 'stats-table', 'stacked-area', 'bar-chart-race', 'mixed-chart', 'diverging-bar-chart', 'attribute-matrix', 'ranking-chart', 'pyramid-chart')),
	CONSTRAINT "comparison_components_grid_column_span_check" CHECK("__new_comparison_components"."grid_column_span" BETWEEN 1 AND 12),
	CONSTRAINT "comparison_components_grid_column_span_tablet_check" CHECK("__new_comparison_components"."grid_column_span_tablet" IS NULL OR "__new_comparison_components"."grid_column_span_tablet" BETWEEN 1 AND 12),
	CONSTRAINT "comparison_components_grid_column_span_sm_check" CHECK("__new_comparison_components"."grid_column_span_sm" IS NULL OR "__new_comparison_components"."grid_column_span_sm" BETWEEN 1 AND 12),
	CONSTRAINT "comparison_components_area_type_check" CHECK("__new_comparison_components"."area_type" IN ('prefecture', 'city'))
);
--> statement-breakpoint
INSERT INTO `__new_comparison_components`("id", "category_key", "component_type", "display_order", "grid_column_span", "grid_column_span_tablet", "grid_column_span_sm", "title", "component_props", "ranking_link", "section_label", "is_active", "source_link", "source_name", "area_type", "data_source", "created_at", "updated_at") SELECT "id", "category_key", "component_type", "display_order", "grid_column_span", "grid_column_span_tablet", "grid_column_span_sm", "title", "component_props", "ranking_link", "section_label", "is_active", "source_link", "source_name", "area_type", "data_source", "created_at", "updated_at" FROM `comparison_components`;--> statement-breakpoint
DROP TABLE `comparison_components`;--> statement-breakpoint
ALTER TABLE `__new_comparison_components` RENAME TO `comparison_components`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_comparison_components_area_type` ON `comparison_components` (`area_type`);--> statement-breakpoint
CREATE INDEX `idx_comparison_components_category_area_type` ON `comparison_components` (`category_key`,`area_type`);--> statement-breakpoint
CREATE INDEX `idx_comparison_components_category` ON `comparison_components` (`category_key`);--> statement-breakpoint
CREATE INDEX `idx_comparison_components_display_order` ON `comparison_components` (`display_order`);--> statement-breakpoint
CREATE INDEX `idx_comparison_components_is_active` ON `comparison_components` (`is_active`);