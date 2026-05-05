import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { metrics } from "./metrics";

export const metricTexts = sqliteTable("metric_texts", {
  metricKey: text("metric_key")
    .primaryKey()
    .references(() => metrics.key),
  yearCode: text("year_code").notNull(),
  faq: text("faq"),
  regionalAnalysis: text("regional_analysis"),
  insights: text("insights"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type MetricText = typeof metricTexts.$inferSelect;
export type InsertMetricText = typeof metricTexts.$inferInsert;

export const insertMetricTextSchema = createInsertSchema(metricTexts);
export const selectMetricTextSchema = createSelectSchema(metricTexts);
