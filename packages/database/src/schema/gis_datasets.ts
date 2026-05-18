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
    isDownloaded:   integer("is_downloaded", { mode: "boolean" }).notNull().default(false),
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
  },
  (table) => ({
    statusCheck: check(
      "gis_datasets_status_check",
      sql`${table.status} IN ('available', 'registered', 'imported', 'deprecated')`,
    ),
    statusIdx: index("idx_gis_datasets_status").on(table.status),
  }),
);

export type GisDataset = typeof gisDatasets.$inferSelect;
export type InsertGisDataset = typeof gisDatasets.$inferInsert;

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertGisDatasetSchema = createInsertSchema(gisDatasets);
export const selectGisDatasetSchema = createSelectSchema(gisDatasets);
