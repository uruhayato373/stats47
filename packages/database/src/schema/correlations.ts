import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { metrics } from "./metrics";

/**
 * 相関分析
 *
 * metric_key_x × metric_key_y の組み合わせで相関係数 (Pearson r) と部分相関を保持。
 * PR #211: metric_x_id/y_id (INTEGER) → metric_key_x/y (TEXT) に変更。
 */
export const correlations = sqliteTable(
  "correlations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    metricKeyX: text("metric_key_x")
      .notNull()
      .references(() => metrics.key),
    metricKeyY: text("metric_key_y")
      .notNull()
      .references(() => metrics.key),
    yearX: text("year_x").notNull(),
    yearY: text("year_y").notNull(),
    pearsonR: real("pearson_r").notNull(),
    partialRPopulation: real("partial_r_population"),
    partialRArea: real("partial_r_area"),
    partialRAging: real("partial_r_aging"),
    partialRDensity: real("partial_r_density"),
    scatterDataJson: text("scatter_data_json").notNull(),
    calculatedAt: text("calculated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    unq: uniqueIndex("idx_correlations_pair_year").on(
      table.metricKeyX,
      table.metricKeyY,
      table.yearX,
      table.yearY
    ),
    metricXIdx: index("idx_correlations_metric_x").on(table.metricKeyX),
    metricYIdx: index("idx_correlations_metric_y").on(table.metricKeyY),
    yearXIdx: index("idx_correlations_year_x").on(table.yearX),
    yearYIdx: index("idx_correlations_year_y").on(table.yearY),
  })
);

export type Correlation = typeof correlations.$inferSelect;
export type InsertCorrelation = typeof correlations.$inferInsert;

export const insertCorrelationSchema = createInsertSchema(correlations);
export const selectCorrelationSchema = createSelectSchema(correlations);
