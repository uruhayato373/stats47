import "server-only";

import { projectRoot, R2_BASE } from "./project-root";
import { loadAll } from "./posts-store";
import { enumerateBlogSlugs, enumerateNoteCovers, enumerateVideoMasters } from "./collectors";

/**
 * ホームの件数サマリ (SNS 台帳・ブログ記事・note カバー・動画 master)。
 * 旧 /assets 画面のタブ定義・タブ取得・欠落確認は 2026-10-27 に画面ごと廃止した (画像は /ops/image-library が扱う)。
 * sitemap 走査を避け、即答できる件数だけを返す。
 */
export async function assetsSummary(): Promise<{
  sns: { total: number; posted: number; scheduled: number; draft: number };
  blogArticles: number;
  noteCovers: number;
  videoMasters: number;
}> {
  const root = projectRoot();
  const posts = loadAll().filter((p) => p.status !== "deleted");
  let blogSlugs = 0;
  try {
    blogSlugs = (await enumerateBlogSlugs(R2_BASE)).length;
  } catch {
    // sitemap/all.json 到達不可でも他サマリは返す
  }
  return {
    sns: {
      total: posts.length,
      posted: posts.filter((p) => p.status === "posted").length,
      scheduled: posts.filter((p) => p.status === "scheduled").length,
      draft: posts.filter((p) => p.status === "draft").length,
    },
    blogArticles: blogSlugs,
    noteCovers: enumerateNoteCovers(root).length,
    videoMasters: enumerateVideoMasters(root, R2_BASE).entries.length,
  };
}
