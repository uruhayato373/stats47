import { resolveContentVertical, type AffiliateVertical, type ContentVerticalInput } from "./affiliate-category";
import { detectSinglePrefCodeFromText } from "./furusato-nozei";

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

/**
 * 楽天カードを出しうる記事の vertical (`resolveBlogRakutenPlacement` の入口条件)。
 * 楽天カタログ同期の purge 対象 (`apps/web/scripts/lib/rakuten-purge-targets.ts`) も同じ集合で記事を選ぶ。
 * CLI から import されるため、このファイルには `@/` alias の import を持ち込まない。
 */
export const BLOG_RAKUTEN_VERTICALS: ReadonlySet<AffiliateVertical> = new Set(["furusato", "economy", "travel"]);

export function applyBlogAffiliatePolicy(
  slug: string,
  input: ContentVerticalInput,
): ContentVerticalInput {
  const policy = BLOG_AFFILIATE_POLICY[slug];
  return policy
    ? { ...input, explicitVertical: policy.vertical }
    : input;
}

/**
 * 単一県の食卓・食文化・特産品・返礼品を主題にした記事か。この記事だけがふるさと納税と読者の関心が重なる。
 * 楽天カード (`resolveBlogRakutenPlacement` の県別返礼品) と A8 バナー (`resolveBlogBannerInput`) の両方がこの判定を使う。
 */
export function isRegionalFoodCultureTitle(title: string, subtitle?: string | null): boolean {
  const sourceText = [title, subtitle].filter(Boolean).join("\n");
  return detectSinglePrefCodeFromText(sourceText) !== null && /食卓|食文化|特産品|返礼品|ふるさと納税/.test(title);
}

/**
 * ブログの A8 バナー・テキスト広告の解決入力。
 *
 * 出典が家計調査などだと `SURVEY_AFFILIATE_MAP` で一律 furusato になり、ビールやエアコンの記事にも
 * ふるさと納税ポータルのバナーが出ていた (2026-09-24 実測: 出典調査だけで furusato になる 222 本のうち
 * 地域の食卓・特産品の記事は 42 本)。調査はデータの出典で読者の購買意図ではないので、出典調査だけで
 * furusato になり地域の食卓・特産品でもない記事は広告を出さない。タグへ落とすと 124 本が economy
 * (FP 相談・NISA) になり、もっと合わないため空にする (affiliate-ads-standards.md §5)。
 * 明示 policy がある記事はそれに従う。楽天カードの判定はこの入力を使わない (主題の品目カードは残す)。
 */
export function resolveBlogBannerInput(
  slug: string,
  input: ContentVerticalInput,
  { title, subtitle }: { title: string; subtitle?: string | null },
): ContentVerticalInput {
  const withPolicy = applyBlogAffiliatePolicy(slug, input);
  const resolution = resolveContentVertical(withPolicy);
  if (resolution.source === "survey" && resolution.vertical === "furusato" && !isRegionalFoodCultureTitle(title, subtitle)) {
    return { ...withPolicy, explicitVertical: null };
  }
  return withPolicy;
}

