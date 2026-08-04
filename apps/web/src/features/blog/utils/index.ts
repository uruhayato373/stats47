// blog ドメインのユーティリティ Barrel File。
// ドメイン内からは個別ファイルではなく本 barrel を経由してインポートする
// (eslint no-restricted-imports が個別パスを禁止している)。
export { generateBlogMetadata } from "./generate-blog-metadata";
export {
  IN_BODY_AD_EXPERIMENT_ID,
  pickInBodyAdFormat,
  type InBodyAdFormat,
  type InlineAffiliateBanner,
} from "./in-body-ad-format";
