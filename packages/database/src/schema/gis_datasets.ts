import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const gisDatasets = sqliteTable("gis_datasets", {
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
});

export type GisDataset = typeof gisDatasets.$inferSelect;
export type InsertGisDataset = typeof gisDatasets.$inferInsert;
