import { z } from "zod";

/**
 * 書込 / action body の検証スキーマ (Zod v3)。
 * filter 側の platform は緩く (posts.json には note/tiktok もある)、書込側は厳密にする。
 * scheduled_at:null 許容・日本語 caption 許容・comma 区切り keys 許容。
 */

/** 書込対象の platform enum (X / IG のみ。YouTube pilot は Studio 手動投稿)。 */
export const WritePlatform = z.enum(["x", "instagram"]);

/** PATCH /api/posts/:id — caption / scheduled_at のみ。厳密検証は server 側 updatePost が担う。 */
export const PatchPost = z
  .object({
    caption: z.string().optional(),
    scheduled_at: z.string().nullable().optional(),
  })
  .passthrough(); // 余剰キーは server 側で 400 判定 (ここでは落とさない)

export type PatchPostInput = z.infer<typeof PatchPost>;

/** POST /api/posts — draft 作成。status は server が "draft" 強制。 */
export const CreatePost = z.object({
  platform: WritePlatform,
  domain: z.string().min(1),
  content_key: z.string().min(1),
  post_type: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  media_path: z.string().nullable().optional(),
});

export type CreatePostInput = z.infer<typeof CreatePost>;

/** POST /api/actions/schedule-ig */
export const ScheduleIg = z.object({
  date: z.string().min(1),
  time: z.string().optional(),
  type: z.string().min(1),
  domain: z.string().min(1),
  content_key: z.string().min(1),
  caption: z.string().nullable().optional(),
});

export type ScheduleIgInputZ = z.infer<typeof ScheduleIg>;

/** POST /api/actions/publish-x */
export const PublishX = z.object({
  content_key: z.string().min(1),
  datetime: z.string().optional(),
  domain: z.string().optional(),
  dry_run: z.boolean().optional(),
  immediate: z.boolean().optional(),
  force: z.boolean().optional(),
});

export type PublishXInputZ = z.infer<typeof PublishX>;

/** POST /api/actions/regenerate */
export const Regenerate = z.object({
  kind: z.string().optional(),
  keys: z.string().optional(),
});

export type RegenerateInputZ = z.infer<typeof Regenerate>;

/** POST /api/assets/check */
export const AssetsCheck = z.object({
  tab: z.string().min(1),
  limit: z.number().int().nonnegative().nullable().optional(),
  all: z.boolean().optional(),
});

export type AssetsCheckInput = z.infer<typeof AssetsCheck>;

/** POST /api/probe-r2 */
export const ProbeR2 = z.object({
  domain: z.string().min(1),
  content_key: z.string().min(1),
});

export type ProbeR2Input = z.infer<typeof ProbeR2>;

/** ideaId は英数字とハイフンのみ (catalog 実在 allowlist は server 側で追加検証)。 */
const IdeaId = z.string().regex(/^[a-z0-9-]+$/, "ideaId は英数字とハイフンのみ");

/** POST /api/buzz-map/actions/generate-spec */
export const BuzzMapGenerateSpec = z.object({
  ideaId: IdeaId,
  helper: z.enum(["estat", "ksj", "gsi", "merge"]),
  extraArgs: z.array(z.string()).optional(),
});
export type BuzzMapGenerateSpecInput = z.infer<typeof BuzzMapGenerateSpec>;

/** POST /api/buzz-map/actions/render */
export const BuzzMapRender = z.object({
  ideaId: IdeaId,
  kind: z.enum(["still", "preview", "full"]),
});
export type BuzzMapRenderInput = z.infer<typeof BuzzMapRender>;

/** POST /api/buzz-map/actions/push-r2 (確認ダイアログは client 側必須・server は confirm:true を要求) */
export const BuzzMapPushR2 = z.object({
  ideaId: IdeaId,
  confirm: z.literal(true),
});
export type BuzzMapPushR2Input = z.infer<typeof BuzzMapPushR2>;

/** POST /api/buzz-map/actions/register-draft */
export const BuzzMapRegisterDraft = z.object({
  ideaId: IdeaId,
  channel: z.enum(["x", "instagram"]),
  confirm: z.literal(true),
});
export type BuzzMapRegisterDraftInput = z.infer<typeof BuzzMapRegisterDraft>;

// ─── content operations source contracts (read-only) ─────────────

export const ContentSocialPostsState = z.object({
  posts: z.array(
    z
      .object({
        platform: z.string(),
        status: z.string(),
      })
      .passthrough(),
  ),
});

export const ContentKdpListing = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    subtitle: z.string().nullable().optional(),
    status: z.string(),
    priceYen: z.number().finite(),
    asin: z.string().nullable().optional(),
    draftId: z.string().nullable().optional(),
    publishedAt: z.string().nullable().optional(),
    epubPath: z.string(),
    coverPath: z.string(),
  })
  .passthrough();

export const ContentKdpListingsState = z.object({
  listings: z.record(ContentKdpListing),
});

export const ContentKindleBuildState = z.object({
  generatedAt: z.string().optional(),
  books: z.array(
    z
      .object({
        id: z.string().min(1),
        status: z.string(),
      })
      .passthrough(),
  ),
});

export const ContentNoteDraftIndex = z.object({
  drafts: z.record(
    z
      .object({
        status: z.string(),
      })
      .passthrough(),
  ),
});

export const ContentReferenceInventory = z.object({
  sourceKey: z.string(),
  edition: z.string(),
  items: z.array(
    z
      .object({
        id: z.string(),
        resolution: z.string(),
        primarySource: z
          .object({ url: z.string().optional() })
          .passthrough()
          .optional(),
        mapping: z
          .object({
            metricKeys: z.array(z.string()).optional(),
            areaCodes: z.array(z.string()).optional(),
            contentRoles: z.array(z.string()).optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough(),
  ),
});

export const ContentBlogIndex = z.object({
  articles: z.array(
    z
      .object({
        slug: z.string(),
        title: z.string(),
        filePath: z.string(),
        published: z.boolean(),
      })
      .passthrough(),
  ),
});

export const ContentPrefectures = z.array(
  z.object({ prefCode: z.string(), prefName: z.string() }).passthrough(),
);

/**
 * query の limit パース (非負有限整数のみ。NaN/Infinity/負 → 不正)。
 * 返り値: 有効なら number、指定なしなら null、不正なら "invalid"。
 */
export function parseLimit(raw: string | null): number | null | "invalid" {
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return "invalid";
  return n;
}
