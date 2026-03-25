import { sql } from "drizzle-orm";
import {
    index,
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * SNS 投稿管理テーブル
 *
 * X / Instagram / TikTok / YouTube / note の投稿を一元管理する。
 * - 投稿済みコンテンツの追跡（重複投稿防止）
 * - エンゲージメントデータの蓄積
 * - 投稿パフォーマンス分析
 */
export const snsPosts = sqliteTable(
  "sns_posts",
  {
    id:          integer("id").primaryKey({ autoIncrement: true }),
    /** プラットフォーム: x, instagram, tiktok, youtube, note */
    platform:    text("platform").notNull(),
    /** 投稿タイプ: original, quote_rt, repost, reply, story, reel, short, carousel */
    postType:    text("post_type").notNull().default("original"),
    /** コンテンツドメイン: ranking, compare, correlation, bar-chart-race, blog, other */
    domain:      text("domain").default("ranking"),
    /** コンテンツキー: ranking_key, compare key, correlation key 等 */
    contentKey:  text("content_key"),
    /** 投稿テキスト（キャプション） */
    caption:     text("caption"),
    /** 投稿の外部 URL（例: https://x.com/stats47jp373/status/xxx） */
    postUrl:     text("post_url"),
    /** 引用元の URL（quote_rt の場合） */
    quoteUrl:    text("quote_url"),
    /** 添付画像/動画のローカルパス */
    mediaPath:   text("media_path"),
    /** stats47.jp へのリンクを含むか */
    hasLink:     integer("has_link", { mode: "boolean" }).default(false),
    /** UTM パラメータ付き URL */
    utmUrl:      text("utm_url"),
    /** ステータス: draft, scheduled, posted, failed */
    status:      text("status").notNull().default("draft"),
    /** 予約投稿日時（JST、ISO 8601） */
    scheduledAt: text("scheduled_at"),
    /** 実際の投稿日時（JST、ISO 8601） */
    postedAt:    text("posted_at"),
    /** インプレッション数 */
    impressions: integer("impressions"),
    /** いいね数 */
    likes:       integer("likes"),
    /** リポスト/RT 数 */
    reposts:     integer("reposts"),
    /** 返信数 */
    replies:     integer("replies"),
    /** ブックマーク数 */
    bookmarks:   integer("bookmarks"),
    /** エンゲージメント最終取得日時 */
    metricsUpdatedAt: text("metrics_updated_at"),
    createdAt:   text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt:   text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    platformIdx:    index("idx_sns_posts_platform").on(table.platform),
    contentKeyIdx:  index("idx_sns_posts_content_key").on(table.contentKey),
    statusIdx:      index("idx_sns_posts_status").on(table.status),
    postedAtIdx:    index("idx_sns_posts_posted_at").on(table.postedAt),
    platformContentIdx: index("idx_sns_posts_platform_content").on(table.platform, table.contentKey, table.postType),
  })
);

export const insertSnsPostSchema = createInsertSchema(snsPosts);
export const selectSnsPostSchema = createSelectSchema(snsPosts);
