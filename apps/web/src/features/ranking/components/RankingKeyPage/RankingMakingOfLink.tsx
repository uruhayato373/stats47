import Link from "@/components/atoms/SiteLink";

import { navSurfaceProps } from "@/lib/analytics/events";

/**
 * 雑学ランキングの読者に、このランキングの作り方 (Claude Code × e-Stat の無料連載) を 1 行で案内する
 * (RANKING-MAKING-OF-LINK-01・2026-10-19)。収益の主張ではなく「作り方への興味」という事実に基づく入口を試す。
 *
 * 全ランキングに一括で出さない。対象は 28 日の検索クリックが多い食の雑学ランキング上位 5 件
 * (GSC 2026-W41 snapshot の pages.csv)。続ける・広げる・やめるは 4 週のクリック数を見て KNOWHOW-PRODUCT-PILOT-01 で決める。
 */
export const RANKING_MAKING_OF_KEYS: ReadonlySet<string> = new Set([
  "natto-consumption-expenditure",
  "rice-consumption-quantity",
  "cup-noodles-consumption-expenditure",
  "icecream-consumption-expenditure",
  "green-tea-consumption-quantity",
]);

const MAKING_OF_HREF = "/blog/cc-estat-01-setup";

export function RankingMakingOfLink({ rankingKey }: { rankingKey: string }) {
  if (!RANKING_MAKING_OF_KEYS.has(rankingKey)) return null;
  return (
    <p className="text-sm text-muted-foreground" {...navSurfaceProps("ranking_making_of")}>
      このランキングは e-Stat の公開データから作っています。作り方は{" "}
      <Link href={MAKING_OF_HREF} data-nav-label="cc-estat-01-setup" className="text-primary hover:underline">
        Claude Code × e-Stat 入門（無料の連載）
      </Link>
      で紹介しています。
    </p>
  );
}
