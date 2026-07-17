import "server-only";

import { loadAll, getById, insert, updateById, type Post } from "./posts-store";
import { decorate, type DecoratedPost } from "./inventory";

/**
 * 投稿の filter / patch / draft 作成。旧 server.mjs の GET /api/posts / PATCH /api/posts/:id /
 * POST /api/posts のロジックを忠実移植 (書込ホワイトリスト・status 強制を含む)。
 */
export interface PostsFilter {
  platform?: string;
  status?: string;
  domain?: string;
  q?: string;
}

/** filter して posted/scheduled/created_at 降順にソートし decorate。 */
export function filterPosts(f: PostsFilter): { count: number; posts: DecoratedPost[] } {
  let posts = loadAll().filter((x) => x.status !== "deleted");
  if (f.platform) posts = posts.filter((x) => x.platform === f.platform);
  if (f.status) posts = posts.filter((x) => x.status === f.status);
  if (f.domain) posts = posts.filter((x) => x.domain === f.domain);
  if (f.q) {
    const q = f.q;
    posts = posts.filter(
      (x) => (x.content_key || "").includes(q) || (x.caption || "").includes(q),
    );
  }
  posts.sort((a, b) =>
    (b.posted_at || b.scheduled_at || b.created_at || "").localeCompare(
      a.posted_at || a.scheduled_at || a.created_at || "",
    ),
  );
  return { count: posts.length, posts: posts.map((p) => decorate(p)) as DecoratedPost[] };
}

export type UpdatePostResult =
  | { ok: true; post: DecoratedPost }
  | { ok: false; code: 400 | 404; error: string };

/**
 * caption / scheduled_at のみ編集可 (SSOT の他フィールドは守る)。
 * それ以外のキーは 400、空 patch は 400、存在しない id は 404。
 */
export function updatePost(
  id: number,
  body: Record<string, unknown>,
): UpdatePostResult {
  const patch: Partial<Post> = {};
  const allowed = new Set(["caption", "scheduled_at"]);
  for (const k of Object.keys(body)) {
    if (!allowed.has(k)) {
      return { ok: false, code: 400, error: "caption / scheduled_at のみ編集可" };
    }
  }
  if (typeof body.caption === "string") patch.caption = body.caption;
  if (typeof body.scheduled_at === "string" || body.scheduled_at === null) {
    patch.scheduled_at = body.scheduled_at as string | null;
  }
  if (Object.keys(patch).length === 0) {
    return { ok: false, code: 400, error: "caption / scheduled_at のみ編集可" };
  }
  const row = updateById(id, patch);
  if (!row) return { ok: false, code: 404, error: "post not found" };
  return { ok: true, post: decorate(row) as DecoratedPost };
}

export interface CreateDraftInput {
  platform: string;
  domain: string;
  content_key: string;
  post_type?: string | null;
  caption?: string | null;
  media_path?: string | null;
}

export type CreateDraftResult =
  | { ok: true; post: DecoratedPost }
  | { ok: false; code: 400; error: string };

/** draft 作成。必須欠落は 400。status は常に "draft" に強制。 */
export function createDraft(body: CreateDraftInput): CreateDraftResult {
  const { platform, domain, content_key } = body;
  if (!platform || !domain || !content_key) {
    return { ok: false, code: 400, error: "platform/domain/content_key は必須" };
  }
  const row = insert({
    platform,
    post_type: body.post_type ?? null,
    domain,
    content_key,
    caption: body.caption ?? null,
    status: "draft",
    media_path: body.media_path ?? null,
  });
  return { ok: true, post: decorate(row) as DecoratedPost };
}

export { getById };
