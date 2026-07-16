import { z } from "zod";

/**
 * 書込 / action body の検証スキーマ (Zod v3)。
 * filter 側の platform は緩く (posts.json には note/tiktok もある)、書込側は厳密にする。
 * scheduled_at:null 許容・日本語 caption 許容・comma 区切り keys 許容。
 */

/** 書込対象の platform enum (X / IG / YouTube のみ)。 */
export const WritePlatform = z.enum(["x", "instagram", "youtube"]);

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

/** POST /api/actions/publish-yt */
export const PublishYt = z.object({
  confirm: z.boolean().optional(),
  video_file: z.string().optional(),
  title: z.string().optional(),
  content_key: z.string().optional(),
  thumbnail: z.string().optional(),
  description: z.string().optional(),
});

export type PublishYtInputZ = z.infer<typeof PublishYt>;

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
