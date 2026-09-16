import { Suspense } from "react";

import { FurusatoNozeiCard, RakutenItemsCard } from "@/features/ads/server";

interface RankingPageRakutenNativeSectionProps {
  /** 楽天商品の品目検出に使うランキング名。 */
  rankingName: string;
  /** 選択年の 1 位県。無ければ地域軸カードを出さない。 */
  top1: { areaCode: string; areaName: string } | null;
  /** ランキング名から品目 (楽天市場で売っている商品) を検出できたか。 */
  hasProductKeyword: boolean;
}

/**
 * 家計調査系 ranking (`kakei-chousa`) の本文中段 native 枠 (2026-09-16)。
 *
 * A8 の意図不一致バナー (au PAY ふるさと納税など) を楽天カードへ置換する。
 * モバイル (lg 未満) は商品軸 `RakutenItemsCard`、品目を検出できないページは
 * 地域軸 `FurusatoNozeiCard` で代替する。デスクトップ (lg+) は常に 1 位県の
 * 返礼品カード (地域軸)。右レールの商品カードはこの枠と重複しないよう
 * `RankingPageSidebarSection` 側でデスクトップ限定にする。
 *
 * 正典: `.claude/rules/affiliate-ads-standards.md` §4 / §12。
 */
export function RankingPageRakutenNativeSection({
  rankingName,
  top1,
  hasProductKeyword,
}: RankingPageRakutenNativeSectionProps) {
  if (!top1 && !hasProductKeyword) return null;

  return (
    <Suspense fallback={null}>
      <div className="lg:hidden">
        {hasProductKeyword ? (
          <RakutenItemsCard sourceText={rankingName} position="rakuten-native" layout="content" />
        ) : top1 ? (
          <FurusatoNozeiCard
            areaCode={top1.areaCode}
            position="furusato-native"
            layout="content"
            headingPrefix="1位 "
          />
        ) : null}
      </div>
      {top1 ? (
        <div className="hidden lg:block">
          <FurusatoNozeiCard
            areaCode={top1.areaCode}
            position="furusato-native"
            layout="content"
            headingPrefix="1位 "
          />
        </div>
      ) : null}
    </Suspense>
  );
}
