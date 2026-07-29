import "server-only";

/**
 * `/blog` 一覧が使う server 側の最小 entrypoint。
 *
 * `./server` は記事詳細の articleService や関連ランキング section も export するため、
 * 一覧が記事リストを読むだけで詳細側の依存グラフを取り込んでいた。
 *
 * root barrel (`./server`) は互換性のため残す。
 */
export {
  readBlogIndexPageFromR2,
  type BlogIndexPageResult,
} from "./repositories/blog-snapshot-reader";
