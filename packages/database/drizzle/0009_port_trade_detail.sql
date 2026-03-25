CREATE TABLE `port_trade_detail` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`port_code` text NOT NULL,
	`year` text NOT NULL,
	`direction` text NOT NULL,
	`commodity_code` text NOT NULL,
	`commodity_name` text,
	`destination_code` text NOT NULL,
	`destination_name` text,
	`destination_type` text NOT NULL,
	`value` real NOT NULL,
	`unit` text DEFAULT 'トン' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`port_code`) REFERENCES `ports`(`port_code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `port_trade_detail_unq` ON `port_trade_detail` (`port_code`,`year`,`direction`,`commodity_code`,`destination_code`);--> statement-breakpoint
CREATE INDEX `idx_port_trade_port_year` ON `port_trade_detail` (`port_code`,`year`);--> statement-breakpoint
CREATE INDEX `idx_port_trade_direction` ON `port_trade_detail` (`direction`,`year`);--> statement-breakpoint
CREATE INDEX `idx_port_trade_commodity` ON `port_trade_detail` (`commodity_code`,`year`);--> statement-breakpoint
CREATE INDEX `idx_port_trade_destination` ON `port_trade_detail` (`destination_code`,`year`);