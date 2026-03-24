import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const areaProfileRankings = sqliteTable(
  "area_profile_rankings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    areaCode: text("area_code").notNull(),
    areaName: text("area_name").notNull(),
    year: text("year").notNull(),
    indicator: text("indicator").notNull(),
    rankingKey: text("ranking_key").notNull(),
    type: text("type").notNull(),
    rank: integer("rank").notNull(),
    value: real("value").notNull(),
    unit: text("unit").notNull(),
    percentile: real("percentile").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    areaRankingTypeUnq: uniqueIndex(
      "area_profile_rankings_area_ranking_type_unique"
    ).on(table.areaCode, table.rankingKey, table.type),
    areaCodeIdx: index("idx_area_profile_rankings_area_code").on(
      table.areaCode
    ),
    rankingKeyIdx: index("idx_area_profile_rankings_ranking_key").on(
      table.rankingKey
    ),
    rankIdx: index("idx_area_profile_rankings_rank").on(table.rank),
  })
);

export const insertAreaProfileRankingSchema = createInsertSchema(areaProfileRankings);
export const selectAreaProfileRankingSchema = createSelectSchema(areaProfileRankings);

export type InsertAreaProfileRanking = typeof areaProfileRankings.$inferInsert;
export type AreaProfileRanking = typeof areaProfileRankings.$inferSelect;
