import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * 統一ソースマスタ — platform / survey / estat_table の 3 階層を 1 テーブルで表現
 *
 * source_kind:
 * - platform: e-Stat / SSDSE / IPSS / 国土数値情報 / 総務省 等の発行元
 * - survey: 国勢調査 / 人口動態統計 等の調査名
 * - estat_table: e-Stat 内の個別統計表（statsDataId 単位）
 *
 * parent_source_id で estat_table → platform などの階層を表現。
 * 旧 data_sources / source_metadata を統合した結果 (PR-2)。
 */
export const sources = sqliteTable(
  "sources",
  {
    id: text("id").primaryKey(),
    sourceKind: text("source_kind", {
      enum: ["platform", "survey", "estat_table"],
    }).notNull(),
    externalId: text("external_id"),
    parentSourceId: text("parent_source_id"),
    name: text("name").notNull(),
    organization: text("organization"),
    url: text("url"),
    description: text("description"),
    attributionText: text("attribution_text"),
    license: text("license"),
    licenseUrl: text("license_url"),
    baseUrl: text("base_url"),
    linkTemplate: text("link_template"),
    displayOrder: integer("display_order").default(0),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    kindIdx: index("idx_sources_kind").on(table.sourceKind),
    parentIdx: index("idx_sources_parent").on(table.parentSourceId),
    externalIdIdx: index("idx_sources_external_id").on(
      table.sourceKind,
      table.externalId
    ),
    activeIdx: index("idx_sources_active").on(table.isActive),
  })
);

export type Source = typeof sources.$inferSelect;
export type InsertSource = typeof sources.$inferInsert;

export const insertSourceSchema = createInsertSchema(sources);
export const selectSourceSchema = createSelectSchema(sources);
