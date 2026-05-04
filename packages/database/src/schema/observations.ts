import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { metrics } from "./metrics";

/**
 * 観測値 — metric × area × year の値 (最小設計)
 *
 * (metric_id, area_type, area_code, year_code) の複合 PK で一意。
 * area_type は 4 種: prefecture / city / port / fishing_port
 *
 * 表示用フィールド (area_name / year_name / unit / category_name) は
 * Repository 層で JOIN して計算する (denorm は持たない)。
 * - area_name: prefectures / cities / ports / fishing_ports を JOIN
 * - year_name: metrics.year_format + year_code から formatYearName() で計算
 * - unit:      metrics.unit を参照
 * - category_name: metrics.title を参照
 */
export const observations = sqliteTable(
  "observations",
  {
    metricId: integer("metric_id")
      .notNull()
      .references(() => metrics.id),
    areaType: text("area_type", {
      enum: ["prefecture", "city", "port", "fishing_port"],
    }).notNull(),
    areaCode: text("area_code").notNull(),
    yearCode: text("year_code").notNull(),
    value: real("value"),
    rank: integer("rank"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.metricId,
        table.areaType,
        table.areaCode,
        table.yearCode,
      ],
    }),
    entityIdx: index("idx_observations_entity").on(
      table.areaType,
      table.areaCode,
      table.yearCode
    ),
    metricYearIdx: index("idx_observations_metric_year").on(
      table.metricId,
      table.yearCode
    ),
  })
);

export type Observation = typeof observations.$inferSelect;
export type InsertObservation = typeof observations.$inferInsert;

export const insertObservationSchema = createInsertSchema(observations);
export const selectObservationSchema = createSelectSchema(observations);
