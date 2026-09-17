import type { AffiliateVertical, ContentVerticalInput } from "./affiliate-category";

export interface BlogAffiliatePolicyEntry {
  /** null は「適合案件が無いため自動アフィリエイトを出さない」という明示判断。 */
  vertical: AffiliateVertical | null;
  reason: string;
}

/**
 * データ出典と読者意図が一致しないブログだけの例外SSOT。
 * 推測で埋めず、意味レビュー済みの記事だけを登録する。
 */
export const BLOG_AFFILIATE_POLICY: Readonly<Record<string, BlogAffiliatePolicyEntry>> = {
  "golf-green-fee-consumption-ranking": {
    vertical: null,
    reason: "家計調査はデータ出典にすぎず、ゴルフ料金・用品にふるさと納税広告は関連しない。適合案件の登録までは広告なし。",
  },
};

export function applyBlogAffiliatePolicy(
  slug: string,
  input: ContentVerticalInput,
): ContentVerticalInput {
  const policy = BLOG_AFFILIATE_POLICY[slug];
  return policy
    ? { ...input, explicitVertical: policy.vertical }
    : input;
}

