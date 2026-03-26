ALTER TABLE `chart_definitions` ADD `grid_column_span_tablet` integer;--> statement-breakpoint
ALTER TABLE `chart_definitions` ADD `grid_column_span_sm` integer;--> statement-breakpoint
ALTER TABLE `chart_definitions` ADD `data_source` text DEFAULT 'ranking';