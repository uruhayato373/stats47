import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * SNS メトリクス時系列テーブル
 *
 * sns_posts に紐づくエンゲージ���ントデータのスナップショットを蓄積する。
 * 取得のたびに INSERT し、時系列でパフォーマンス推移を追跡する。
 * sns_posts のインライン列（impressions, likes 等）は最新キャッシュとして別途 UPDATE する。
 */
export const snsMetrics = sqliteTable(
  "sns_metrics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** sns_posts.id への外部キー */
    snsPostId: integer("sns_post_id").notNull(),
    /** インプレッション数 */
    impressions: integer("impressions"),
    /** リーチ数（Instagram 固有） */
    reach: integer("reach"),
    /** 動画再生数（YouTube / TikTok / IG Reels） */
    views: integer("views"),
    /** いいね数 */
    likes: integer("likes"),
    /** コメント数（X では replies） */
    comments: integer("comments"),
    /** シェア数（X では reposts/RT、Instagram では shares） */
    shares: integer("shares"),
    /** 保存数（X では bookmarks、Instagram では saves） */
    saves: integer("saves"),
    /** 引用数（X 固有） */
    quotes: integer("quotes"),
    /** API 取得日時（ISO 8601） */
    fetchedAt: text("fetched_at").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    postIdIdx: index("idx_sns_metrics_post_id").on(table.snsPostId),
    fetchedAtIdx: index("idx_sns_metrics_fetched_at").on(table.fetchedAt),
    unq: uniqueIndex("sns_metrics_post_date_unq").on(
      table.snsPostId,
      table.fetchedAt
    ),
  })
);

export type SnsMetric = typeof snsMetrics.$inferSelect;
export type InsertSnsMetric = typeof snsMetrics.$inferInsert;

export const insertSnsMetricSchema = createInsertSchema(snsMetrics);
export const selectSnsMetricSchema = createSelectSchema(snsMetrics);
