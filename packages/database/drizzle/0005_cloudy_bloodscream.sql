CREATE TABLE `port_statistics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`port_code` text NOT NULL,
	`year` text NOT NULL,
	`metric_key` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`port_code`) REFERENCES `ports`(`port_code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `port_statistics_unq` ON `port_statistics` (`port_code`,`year`,`metric_key`);--> statement-breakpoint
CREATE INDEX `idx_port_statistics_port_year` ON `port_statistics` (`port_code`,`year`);--> statement-breakpoint
CREATE INDEX `idx_port_statistics_metric` ON `port_statistics` (`metric_key`,`year`);--> statement-breakpoint
CREATE INDEX `idx_port_statistics_year` ON `port_statistics` (`year`);--> statement-breakpoint
CREATE TABLE `ports` (
	`port_code` text PRIMARY KEY NOT NULL,
	`port_name` text NOT NULL,
	`prefecture_code` text NOT NULL,
	`prefecture_name` text NOT NULL,
	`port_class` text DEFAULT '甲種' NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_ports_prefecture` ON `ports` (`prefecture_code`);--> statement-breakpoint
CREATE INDEX `idx_ports_class` ON `ports` (`port_class`);