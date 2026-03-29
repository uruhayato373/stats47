CREATE TABLE `sns_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sns_post_id` integer NOT NULL,
	`impressions` integer,
	`reach` integer,
	`views` integer,
	`likes` integer,
	`comments` integer,
	`shares` integer,
	`saves` integer,
	`quotes` integer,
	`fetched_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_sns_metrics_post_id` ON `sns_metrics` (`sns_post_id`);--> statement-breakpoint
CREATE INDEX `idx_sns_metrics_fetched_at` ON `sns_metrics` (`fetched_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `sns_metrics_post_date_unq` ON `sns_metrics` (`sns_post_id`, `fetched_at`);
