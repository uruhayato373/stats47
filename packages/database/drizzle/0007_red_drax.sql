CREATE TABLE `fishing_ports` (
	`port_code` text PRIMARY KEY NOT NULL,
	`port_name` text NOT NULL,
	`prefecture_code` text NOT NULL,
	`prefecture_name` text NOT NULL,
	`port_type` text NOT NULL,
	`port_type_name` text NOT NULL,
	`administrator_type` text,
	`administrator_name` text,
	`fishery_cooperative` text,
	`breakwater_length` integer,
	`mooring_length` integer,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_fishing_ports_prefecture` ON `fishing_ports` (`prefecture_code`);--> statement-breakpoint
CREATE INDEX `idx_fishing_ports_type` ON `fishing_ports` (`port_type`);--> statement-breakpoint
ALTER TABLE `ranking_items` ADD `additional_categories` text;--> statement-breakpoint
ALTER TABLE `ports` ADD `port_grade` text;--> statement-breakpoint
ALTER TABLE `ports` ADD `administrator` text;--> statement-breakpoint
ALTER TABLE `ports` ADD `cyport_code` text;