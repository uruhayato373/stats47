CREATE TABLE `tags` (
	`tag_key` text PRIMARY KEY NOT NULL,
	`tag_name` text NOT NULL,
	`display_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `article_tags` (
	`slug` text NOT NULL,
	`tag_key` text NOT NULL,
	PRIMARY KEY(`slug`, `tag_key`),
	FOREIGN KEY (`slug`) REFERENCES `articles`(`slug`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_key`) REFERENCES `tags`(`tag_key`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_article_tags_tag_key` ON `article_tags` (`tag_key`);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_ranking_tags` (
	`ranking_key` text NOT NULL,
	`area_type` text NOT NULL,
	`tag_key` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`ranking_key`, `area_type`, `tag_key`),
	FOREIGN KEY (`tag_key`) REFERENCES `tags`(`tag_key`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ranking_key`,`area_type`) REFERENCES `ranking_items`(`ranking_key`,`area_type`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_ranking_tags`("ranking_key", "area_type", "tag_key", "created_at") SELECT "ranking_key", "area_type", "tag", "created_at" FROM `ranking_tags`;
--> statement-breakpoint
DROP TABLE `ranking_tags`;
--> statement-breakpoint
ALTER TABLE `__new_ranking_tags` RENAME TO `ranking_tags`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
CREATE INDEX `idx_ranking_tags_tag_key` ON `ranking_tags` (`tag_key`);
--> statement-breakpoint
CREATE INDEX `idx_ranking_tags_ranking` ON `ranking_tags` (`ranking_key`,`area_type`);
