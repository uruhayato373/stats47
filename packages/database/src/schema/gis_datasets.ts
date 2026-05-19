import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const gisDatasets = sqliteTable(
  "gis_datasets",
  {
    dataId:         text("data_id").primaryKey(),
    name:           text("name").notNull(),
    nameEn:         text("name_en").notNull(),
    category:       text("category").notNull(),      // land|policy|facility|transport|statistics
    geometryType:   text("geometry_type").notNull(), // point|line|polygon|mesh|mixed
    coverage:       text("coverage").notNull(),       // national|prefecture|mesh|region
    license:        text("license").notNull(),
    r2Version:      text("r2_version"),
    fileCount:      integer("file_count"),
    totalSizeBytes: integer("total_size_bytes"),
    convertedAt:    text("converted_at"),
    r2Prefix:       text("r2_prefix"),
    attribution:    text("attribution"),
    // Phase 1 (migration 0047): 進捗管理用
    status: text("status", {
      enum: ["available", "registered", "imported", "deprecated"],
    })
      .notNull()
      .default("registered"),
    lastImportedAt: integer("last_imported_at"), // Unix timestamp (seconds)
    memo:           text("memo"),
    createdAt:      text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt:      text("updated_at").default(sql`CURRENT_TIMESTAMP`),
    // Phase 2 (migration 0048): registry.ts から D1 に寄せた純メタ + RANKINGS 連携
    stats47Category: text("stats47_category"),
    latestVersion:   text("latest_version"),
    estimatedSize:   text("estimated_size"),
    isRankingTarget: integer("is_ranking_target", { mode: "boolean" })
      .notNull()
      .default(false),
    rankingConfig:   text("ranking_config"), // JSON: RANKINGS 配列要素
  },
  (table) => ({
    statusCheck: check(
      "gis_datasets_status_check",
      sql`${table.status} IN ('available', 'registered', 'imported', 'deprecated')`,
    ),
    statusIdx: index("idx_gis_datasets_status").on(table.status),
    rankingTargetIdx: index("idx_gis_datasets_ranking_target").on(
      table.isRankingTarget,
    ),
  }),
);

export type GisDataset = typeof gisDatasets.$inferSelect;
export type InsertGisDataset = typeof gisDatasets.$inferInsert;

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertGisDatasetSchema = createInsertSchema(gisDatasets);
export const selectGisDatasetSchema = createSelectSchema(gisDatasets);
