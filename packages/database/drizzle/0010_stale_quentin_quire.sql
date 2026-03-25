CREATE TABLE `sns_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text NOT NULL,
	`post_type` text DEFAULT 'original' NOT NULL,
	`domain` text DEFAULT 'ranking',
	`content_key` text,
	`caption` text,
	`post_url` text,
	`quote_url` text,
	`media_path` text,
	`has_link` integer DEFAULT false,
	`utm_url` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`scheduled_at` text,
	`posted_at` text,
	`impressions` integer,
	`likes` integer,
	`reposts` integer,
	`replies` integer,
	`bookmarks` integer,
	`metrics_updated_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_sns_posts_platform` ON `sns_posts` (`platform`);--> statement-breakpoint
CREATE INDEX `idx_sns_posts_content_key` ON `sns_posts` (`content_key`);--> statement-breakpoint
CREATE INDEX `idx_sns_posts_status` ON `sns_posts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_sns_posts_posted_at` ON `sns_posts` (`posted_at`);--> statement-breakpoint
CREATE INDEX `idx_sns_posts_platform_content` ON `sns_posts` (`platform`,`content_key`,`post_type`);