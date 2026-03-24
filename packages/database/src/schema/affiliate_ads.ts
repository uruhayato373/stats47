import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const affiliateAds = sqliteTable(
  "affiliate_ads",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    htmlContent: text("html_content").notNull(),
    areaCode: text("area_code"),
    categoryKey: text("subcategory_key"),
    locationCode: text("location_code").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    priority: integer("priority").default(0),
    startDate: text("start_date"), // ISO
    endDate: text("end_date"), // ISO
    targetCategories: text("target_categories"), // JSON
    adType: text("ad_type").notNull().default("text"), // 'text' | 'banner'
    imageUrl: text("image_url"),
    trackingPixelUrl: text("tracking_pixel_url"),
    width: integer("width"),
    height: integer("height"),
    adFileKey: text("ad_file_key"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    areaCodeIdx: index("idx_affiliate_ads_area_code").on(table.areaCode),
    subcategoryKeyIdx: index("idx_affiliate_ads_subcategory_key").on(
      table.categoryKey
    ),
    locationCodeIdx: index("idx_affiliate_ads_location_code").on(
      table.locationCode
    ),
    isActiveIdx: index("idx_affiliate_ads_is_active").on(table.isActive),
  })
);

export const insertAffiliateAdSchema = createInsertSchema(affiliateAds);
export const selectAffiliateAdSchema = createSelectSchema(affiliateAds);

export type InsertAffiliateAd = typeof affiliateAds.$inferInsert;
export type AffiliateAd = typeof affiliateAds.$inferSelect;
