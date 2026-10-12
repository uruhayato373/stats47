import "server-only";

import { matchesPostQuery } from "@/lib/sns-ledger";

import { loadAll } from "./posts-store";
import { decorate, type DecoratedPost } from "./inventory";

/**
 * 投稿台帳の読み取りと filter。本文編集は posts-store の専用関数へ。
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
      (x) => matchesPostQuery(x, q),
    );
  }
  posts.sort((a, b) =>
    (b.posted_at || b.scheduled_at || b.created_at || "").localeCompare(
      a.posted_at || a.scheduled_at || a.created_at || "",
    ),
  );
  return { count: posts.length, posts: posts.map((p) => decorate(p)) as DecoratedPost[] };
}
