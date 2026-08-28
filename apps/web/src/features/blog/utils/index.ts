// blog ドメインのユーティリティ Barrel File。
// ドメイン内からは個別ファイルではなく本 barrel を経由してインポートする
// (eslint no-restricted-imports が個別パスを禁止している)。
export { generateBlogMetadata } from "./generate-blog-metadata";
export {
  BLOG_IN_BODY_BANNER_COUNT,
  type InlineAffiliateBanner,
} from "./inline-affiliate-banner";
