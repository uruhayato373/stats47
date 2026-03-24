import { sql } from "drizzle-orm";
import {
    index,
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";

export const categories = sqliteTable(
  "categories",
  {
    categoryKey: text("category_key").primaryKey(),
    categoryName: text("category_name").notNull(),
    icon: text("icon"),
    displayOrder: integer("display_order").default(0),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    displayOrderIdx: index("idx_categories_display_order").on(
      table.displayOrder
    ),
  })
);

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);

