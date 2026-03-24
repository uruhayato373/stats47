CREATE TABLE `ranking_page_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ranking_key` text NOT NULL,
	`date` text NOT NULL,
	`page_views` integer DEFAULT 0 NOT NULL,
	`active_users` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ranking_page_views_key_date_unq` ON `ranking_page_views` (`ranking_key`,`date`);--> statement-breakpoint
CREATE INDEX `idx_ranking_page_views_date` ON `ranking_page_views` (`date`);--> statement-breakpoint
CREATE INDEX `idx_ranking_page_views_ranking_key` ON `ranking_page_views` (`ranking_key`);