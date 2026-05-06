CREATE TABLE `gis_datasets` (
  `data_id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `name_en` text NOT NULL,
  `category` text NOT NULL,
  `geometry_type` text NOT NULL,
  `coverage` text NOT NULL,
  `license` text NOT NULL,
  `is_downloaded` integer NOT NULL DEFAULT 0,
  `r2_version` text,
  `file_count` integer,
  `total_size_bytes` integer,
  `converted_at` text,
  `r2_prefix` text,
  `attribution` text
);
