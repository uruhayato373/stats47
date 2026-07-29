/**
 * `/blog` 一覧が使う最小 entrypoint (client-safe)。
 *
 * `./index` は `ArticleRenderer` / `ArticleTableOfContents` / 記事内の地図など
 * 記事詳細の描画一式も export するため、一覧がカードと著者カードだけを欲しくても
 * 詳細の依存グラフごと dev bundle に取り込まれていた。
 *
 * root barrel (`./index`) は互換性のため残す。
 */
export { BlogArticleGrid } from "./components/blog-article-grid";
export { BlogAuthorProfileCard } from "./components/BlogAuthorProfileCard";
