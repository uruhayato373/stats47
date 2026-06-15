import { type ReactNode } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";

import { FurusatoNozeiCard, OperatorPromoCard, SidebarPromoBanner, TechSchoolPromoCard } from "@/features/ads";

import { AdSenseAd, RANKING_PAGE_SIDEBAR, RANKING_SIDEBAR_TOP } from "@/lib/google-adsense";

interface RightRailWidgetsProps {
  /** ふるさと納税 widget の都道府県コード (省略時は表示しない) */
  furusatoAreaCode?: string;
  /** 上部に挿入する追加 widget (関連ランキング・関連記事など) */
  topWidgets?: ReactNode;
  /** 中部に挿入する追加 widget */
  midWidgets?: ReactNode;
  /** 下部に挿入する追加 widget */
  bottomWidgets?: ReactNode;
  /** AdSense Rectangle (下部) を表示するか (default: true) */
  showBottomAd?: boolean;
  /** AdSense Rectangle (上部) を表示するか (default: true) */
  showTopAd?: boolean;
  /** Claude Code 講座カードを表示するか (default: true) */
  showTechSchool?: boolean;
  /** 高単価アフィリエイトバナーを表示するか (default: true) */
  showPromoBanner?: boolean;
  /** 運営者カード (転職/AI学習ランダム) を表示するか (default: true) */
  showOperatorCard?: boolean;
  /** 表示する SIDEBAR_PROMO_BANNERS の index (default: 0 = STRATEGY CAREER) */
  promoBannerIndex?: number;
  /**
   * 独立スクロール (xl で sticky + `max-h+overflow-auto`) を有効にするか (default: false)。
   * 既定は自然フロー = レールが本文と一緒にスクロールする（本文を主役にするため）。
   * sticky にすると max-h+overflow が必須になる（フッター消失防止 / ui-components.md）。
   */
  stickyScroll?: boolean;
}

/**
 * 全ページ共通の右サイドバー widget セット。
 *
 * 配置順 (本文関連 widget を上・promo/広告を下):
 *   1. topWidgets / midWidgets / bottomWidgets (関連ランキング・関連記事など)
 *   2. ふるさと納税 (furusatoAreaCode 指定時)
 *   ── 区切り ──
 *   3. promo 群 (運営者カード / Claude Code 講座 / アフィリエイトバナー)
 *   4. AdSense Rectangle (上 → 下)
 *
 * 既定は自然フロー（sticky/独立スクロールなし）。本文を主役にするため促進系を下げている。
 * 設計仕様: docs/01_技術設計/13_統一レイアウト設計.md
 */
export async function RightRailWidgets({
  furusatoAreaCode,
  topWidgets,
  midWidgets,
  bottomWidgets,
  showBottomAd = true,
  showTopAd = true,
  showTechSchool = true,
  showPromoBanner = true,
  showOperatorCard = true,
  promoBannerIndex = 0,
  stickyScroll = false,
}: RightRailWidgetsProps) {
  const scrollClass = stickyScroll
    ? "xl:sticky xl:top-20 xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto xl:pr-1"
    : "";

  const hasContent =
    !!topWidgets || !!midWidgets || !!bottomWidgets || !!furusatoAreaCode;
  const hasPromoOrAds =
    showOperatorCard ||
    showTechSchool ||
    showPromoBanner ||
    showTopAd ||
    showBottomAd;

  return (
    <div className={`flex flex-col gap-3 ${scrollClass}`}>
      {/* 本文関連 widget（主役） */}
      {topWidgets}
      {midWidgets}
      {bottomWidgets}
      {furusatoAreaCode && <FurusatoNozeiCard areaCode={furusatoAreaCode} />}

      {/* 区切り: 本文関連と promo/広告の境界 */}
      {hasContent && hasPromoOrAds && (
        <hr className="my-1 border-t border-border" />
      )}

      {/* promo 群（本文関連の下へ降格） */}
      {showOperatorCard && <OperatorPromoCard placement="sidebar" />}
      {showTechSchool && <TechSchoolPromoCard />}
      {showPromoBanner && <SidebarPromoBanner index={promoBannerIndex} />}

      {/* AdSense（収益枠は維持・最下部） */}
      {showTopAd && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              広告
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center overflow-hidden">
            <AdSenseAd
              format={RANKING_SIDEBAR_TOP.format}
              slotId={RANKING_SIDEBAR_TOP.slotId}
              showLabel={false}
            />
          </CardContent>
        </Card>
      )}

      {showBottomAd && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              広告
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center overflow-hidden">
            <AdSenseAd
              format={RANKING_PAGE_SIDEBAR.format}
              slotId={RANKING_PAGE_SIDEBAR.slotId}
              showLabel={false}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
