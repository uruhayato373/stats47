import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const estatCatalog = sqliteTable(
  "estat_catalog",
  {
    id:          integer("id").primaryKey({ autoIncrement: true }),
    statsDataId: text("stats_data_id").notNull(),  // FK → estat_metainfo
    cat01Code:   text("cat01_code").notNull(),      // cdCat01 値
    cat01Name:   text("cat01_name").notNull(),      // 日本語名（元データ）
    unit:        text("unit"),
    categoryKey: text("category_key"),
    rankingKey:  text("ranking_key"),               // 英語 kebab-case（AI 翻訳後）
    isActive:    integer("is_active").default(0),   // 1 = metrics に登録して使う
    isExcluded:  integer("is_excluded").default(0), // 1 = スキップ（男/女 等）
    metricKey:   text("metric_key"),                // FK → metrics.key（登録後）
    createdAt:   text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt:   text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    uniqPair:      uniqueIndex("estat_catalog_uniq").on(t.statsDataId, t.cat01Code),
    isActiveIdx:   index("idx_estat_catalog_active").on(t.isActive),
    categoryIdx:   index("idx_estat_catalog_category").on(t.categoryKey, t.isActive),
    rankingKeyIdx: index("idx_estat_catalog_ranking_key").on(t.rankingKey),
  })
);

export type EstatCatalog = typeof estatCatalog.$inferSelect;
export type InsertEstatCatalog = typeof estatCatalog.$inferInsert;
