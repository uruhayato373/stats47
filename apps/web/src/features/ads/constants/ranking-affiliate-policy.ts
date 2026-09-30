import type { AffiliateVertical, ContentVerticalInput } from "./affiliate-category";

export interface RankingAffiliatePolicyEntry {
  /** null は「適合案件が無いため自動アフィリエイトを出さない」という明示判断。 */
  vertical: AffiliateVertical | null;
  reason: string;
}

/**
 * 出典調査・タグ・カテゴリの解決では読者意図と合わないランキングだけの例外SSOT
 * (`BLOG_AFFILIATE_POLICY` のランキング版)。推測で埋めず、意味レビュー済みの指標だけを登録する。
 */
export const RANKING_AFFILIATE_POLICY: Readonly<Record<string, RankingAffiliatePolicyEntry>> = {
  "census-household-change-rate-5y": {
    vertical: "housing",
    reason: "国勢調査で世帯が増えた県は単身・転入による住まいの需要が主題。人口分類の婚活・保険より引っ越し・住まいが合う。",
  },
};

export function applyRankingAffiliatePolicy(
  rankingKey: string,
  input: ContentVerticalInput,
): ContentVerticalInput {
  const policy = RANKING_AFFILIATE_POLICY[rankingKey];
  return policy ? { ...input, explicitVertical: policy.vertical } : input;
}
