CREATE TABLE `affiliate_ads` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`html_content` text NOT NULL,
	`area_code` text,
	`subcategory_key` text,
	`location_code` text NOT NULL,
	`is_active` integer DEFAULT true,
	`priority` integer DEFAULT 0,
	`start_date` text,
	`end_date` text,
	`target_categories` text,
	`ad_type` text DEFAULT 'text' NOT NULL,
	`image_url` text,
	`tracking_pixel_url` text,
	`width` integer,
	`height` integer,
	`ad_file_key` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_affiliate_ads_area_code` ON `affiliate_ads` (`area_code`);--> statement-breakpoint
CREATE INDEX `idx_affiliate_ads_subcategory_key` ON `affiliate_ads` (`subcategory_key`);--> statement-breakpoint
CREATE INDEX `idx_affiliate_ads_location_code` ON `affiliate_ads` (`location_code`);--> statement-breakpoint
CREATE INDEX `idx_affiliate_ads_is_active` ON `affiliate_ads` (`is_active`);--> statement-breakpoint
CREATE TABLE `ranking_ai_content` (
	`ranking_key` text NOT NULL,
	`area_type` text NOT NULL,
	`faq` text,
	`regional_analysis` text,
	`insights` text,
	`year_code` text NOT NULL,
	`data_hash` text,
	`ai_model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`generated_at` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`ranking_key`, `area_type`)
);
--> statement-breakpoint
CREATE INDEX `idx_ranking_ai_content_is_active` ON `ranking_ai_content` (`is_active`);--> statement-breakpoint
CREATE TABLE `area_profile_rankings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`area_code` text NOT NULL,
	`area_name` text NOT NULL,
	`year` text NOT NULL,
	`indicator` text NOT NULL,
	`ranking_key` text NOT NULL,
	`type` text NOT NULL,
	`rank` integer NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`percentile` real NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `area_profile_rankings_area_ranking_type_unique` ON `area_profile_rankings` (`area_code`,`ranking_key`,`type`);--> statement-breakpoint
CREATE INDEX `idx_area_profile_rankings_area_code` ON `area_profile_rankings` (`area_code`);--> statement-breakpoint
CREATE INDEX `idx_area_profile_rankings_ranking_key` ON `area_profile_rankings` (`ranking_key`);--> statement-breakpoint
CREATE INDEX `idx_area_profile_rankings_rank` ON `area_profile_rankings` (`rank`);--> statement-breakpoint
CREATE TABLE `articles` (
	`slug` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`tags` text,
	`file_path` text NOT NULL,
	`format` text DEFAULT 'mdx',
	`has_charts` integer DEFAULT false,
	`published` integer DEFAULT false,
	`published_at` text,
	`og_image_type` text,
	`ogp_title` text,
	`ogp_subtitle` text,
	`proofread_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_articles_published_at` ON `articles` (`published_at`);--> statement-breakpoint
CREATE INDEX `idx_articles_file_path` ON `articles` (`file_path`);--> statement-breakpoint
CREATE TABLE `categories` (
	`category_key` text PRIMARY KEY NOT NULL,
	`category_name` text NOT NULL,
	`icon` text,
	`display_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_categories_display_order` ON `categories` (`display_order`);--> statement-breakpoint
CREATE TABLE `comparison_components` (
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
	CONSTRAINT "comparison_components_component_type_check" CHECK("comparison_components"."component_type" IN ('stats-card', 'bar-chart', 'line-chart', 'radar-chart', 'multi-stats-card', 'donut-chart', 'stats-table', 'stacked-area', 'bar-chart-race', 'mixed-chart', 'diverging-bar-chart', 'attribute-matrix', 'ranking-chart')),
	CONSTRAINT "comparison_components_grid_column_span_check" CHECK("comparison_components"."grid_column_span" BETWEEN 1 AND 12),
	CONSTRAINT "comparison_components_grid_column_span_tablet_check" CHECK("comparison_components"."grid_column_span_tablet" IS NULL OR "comparison_components"."grid_column_span_tablet" BETWEEN 1 AND 12),
	CONSTRAINT "comparison_components_grid_column_span_sm_check" CHECK("comparison_components"."grid_column_span_sm" IS NULL OR "comparison_components"."grid_column_span_sm" BETWEEN 1 AND 12),
	CONSTRAINT "comparison_components_area_type_check" CHECK("comparison_components"."area_type" IN ('prefecture', 'city'))
);
--> statement-breakpoint
CREATE INDEX `idx_comparison_components_area_type` ON `comparison_components` (`area_type`);--> statement-breakpoint
CREATE INDEX `idx_comparison_components_category_area_type` ON `comparison_components` (`category_key`,`area_type`);--> statement-breakpoint
CREATE INDEX `idx_comparison_components_category` ON `comparison_components` (`category_key`);--> statement-breakpoint
CREATE INDEX `idx_comparison_components_display_order` ON `comparison_components` (`display_order`);--> statement-breakpoint
CREATE INDEX `idx_comparison_components_is_active` ON `comparison_components` (`is_active`);--> statement-breakpoint
CREATE TABLE `correlation_analysis` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ranking_key_x` text NOT NULL,
	`ranking_key_y` text NOT NULL,
	`year_x` text NOT NULL,
	`year_y` text NOT NULL,
	`pearson_r` real NOT NULL,
	`partial_r_population` real,
	`partial_r_area` real,
	`partial_r_aging` real,
	`partial_r_density` real,
	`scatter_data` text NOT NULL,
	`calculated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `correlation_analysis_ranking_keys_year_unique` ON `correlation_analysis` (`ranking_key_x`,`ranking_key_y`,`year_x`,`year_y`);--> statement-breakpoint
CREATE INDEX `idx_correlation_rankingkeys` ON `correlation_analysis` (`ranking_key_x`,`ranking_key_y`);--> statement-breakpoint
CREATE INDEX `idx_correlation_year_x` ON `correlation_analysis` (`year_x`);--> statement-breakpoint
CREATE INDEX `idx_correlation_year_y` ON `correlation_analysis` (`year_y`);--> statement-breakpoint
CREATE INDEX `idx_correlation_rankingkey_x_year` ON `correlation_analysis` (`ranking_key_x`,`year_x`);--> statement-breakpoint
CREATE INDEX `idx_correlation_rankingkey_y_year` ON `correlation_analysis` (`ranking_key_y`,`year_y`);--> statement-breakpoint
CREATE TABLE `estat_metainfo` (
	`stats_data_id` text PRIMARY KEY NOT NULL,
	`stat_name` text NOT NULL,
	`title` text NOT NULL,
	`area_type` text DEFAULT 'national' NOT NULL,
	`description` text,
	`cycle` text,
	`survey_date` text,
	`last_fetched_at` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`item_name_prefix` text,
	`memo` text,
	`is_active` integer DEFAULT true,
	`category_filters` text,
	CONSTRAINT "estat_metainfo_area_type_check" CHECK("estat_metainfo"."area_type" IN ('national', 'prefecture', 'city'))
);
--> statement-breakpoint
CREATE INDEX `idx_estat_metainfo_stat_name` ON `estat_metainfo` (`stat_name`);--> statement-breakpoint
CREATE INDEX `idx_estat_metainfo_title` ON `estat_metainfo` (`title`);--> statement-breakpoint
CREATE INDEX `idx_estat_metainfo_area_type` ON `estat_metainfo` (`area_type`);--> statement-breakpoint
CREATE INDEX `idx_estat_metainfo_updated_at` ON `estat_metainfo` (`updated_at`);--> statement-breakpoint
CREATE TABLE `estat_stats_tables` (
	`stats_data_id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`stat_name` text,
	`gov_org` text,
	`category_key` text,
	`stats_field` text,
	`area_type` text,
	`cycle` text,
	`survey_date` text,
	`updated_date` text,
	`class_inf` text,
	`status` text DEFAULT 'candidate' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_est_category_key` ON `estat_stats_tables` (`category_key`);--> statement-breakpoint
CREATE INDEX `idx_est_stats_field` ON `estat_stats_tables` (`stats_field`);--> statement-breakpoint
CREATE INDEX `idx_est_status` ON `estat_stats_tables` (`status`);--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`adapter_type` text NOT NULL,
	`config_schema` text,
	`is_active` integer DEFAULT true,
	`base_url` text,
	`link_template` text,
	`attribution_text` text,
	`license` text,
	`license_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `ranking_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`area_type` text NOT NULL,
	`area_code` text NOT NULL,
	`area_name` text NOT NULL,
	`year_code` text NOT NULL,
	`year_name` text,
	`category_code` text NOT NULL,
	`category_name` text,
	`value` real NOT NULL,
	`unit` text,
	`rank` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ranking_data_unq` ON `ranking_data` (`area_type`,`category_code`,`year_code`,`area_code`);--> statement-breakpoint
CREATE INDEX `idx_ranking_data_lookup` ON `ranking_data` (`area_type`,`category_code`,`year_code`);--> statement-breakpoint
CREATE INDEX `idx_ranking_data_area` ON `ranking_data` (`area_code`,`year_code`);--> statement-breakpoint
CREATE TABLE `ranking_items` (
	`ranking_key` text NOT NULL,
	`area_type` text NOT NULL,
	`ranking_name` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`demographic_attr` text,
	`normalization_basis` text,
	`unit` text NOT NULL,
	`description` text,
	`category_key` text,
	`latest_year` text,
	`available_years` text,
	`is_active` integer DEFAULT true,
	`is_featured` integer DEFAULT false,
	`featured_order` integer DEFAULT 0,
	`is_calculated` integer DEFAULT false,
	`calculation_type` text,
	`numerator_ranking_key` text,
	`denominator_ranking_key` text,
	`calculation_formula` text,
	`data_source_id` text DEFAULT 'estat' NOT NULL,
	`survey_id` text,
	`source_config` text,
	`value_display_config` text,
	`visualization_config` text,
	`calculation_config` text,
	`group_key` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`ranking_key`, `area_type`),
	FOREIGN KEY (`data_source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ranking_items_active` ON `ranking_items` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_ranking_items_area_type` ON `ranking_items` (`area_type`);--> statement-breakpoint
CREATE INDEX `idx_ranking_items_category_key` ON `ranking_items` (`category_key`);--> statement-breakpoint
CREATE INDEX `idx_ranking_items_is_calculated` ON `ranking_items` (`is_calculated`);--> statement-breakpoint
CREATE INDEX `idx_ranking_items_calculation_type` ON `ranking_items` (`calculation_type`);--> statement-breakpoint
CREATE INDEX `idx_ranking_items_numerator` ON `ranking_items` (`numerator_ranking_key`);--> statement-breakpoint
CREATE INDEX `idx_ranking_items_denominator` ON `ranking_items` (`denominator_ranking_key`);--> statement-breakpoint
CREATE INDEX `idx_ranking_items_group_key` ON `ranking_items` (`group_key`);--> statement-breakpoint
CREATE TABLE `ranking_tags` (
	`ranking_key` text NOT NULL,
	`area_type` text NOT NULL,
	`tag` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`ranking_key`, `area_type`, `tag`),
	FOREIGN KEY (`ranking_key`,`area_type`) REFERENCES `ranking_items`(`ranking_key`,`area_type`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_ranking_tags_tag` ON `ranking_tags` (`tag`);--> statement-breakpoint
CREATE INDEX `idx_ranking_tags_ranking` ON `ranking_tags` (`ranking_key`,`area_type`);--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` text PRIMARY KEY NOT NULL,
	`organization` text NOT NULL,
	`name` text NOT NULL,
	`url` text,
	`description` text,
	`display_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `ranking_page_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`ranking_key` text NOT NULL,
	`component_type` text NOT NULL,
	`display_order` integer DEFAULT 0,
	`title` text,
	`component_props` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "ranking_page_cards_component_type_check" CHECK("ranking_page_cards"."component_type" IN ('stats-line-chart'))
);
--> statement-breakpoint
CREATE INDEX `idx_ranking_page_cards_ranking_key` ON `ranking_page_cards` (`ranking_key`);--> statement-breakpoint
CREATE INDEX `idx_ranking_page_cards_display_order` ON `ranking_page_cards` (`display_order`);--> statement-breakpoint
CREATE INDEX `idx_ranking_page_cards_is_active` ON `ranking_page_cards` (`is_active`);