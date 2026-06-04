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
  /** 独立スクロール (xl で `max-h+overflow-auto`) を有効にするか (default: true) */
  stickyScroll?: boolean;
}

/**
 * 全ページ共通の右サイドバー widget セット (D-System Phase 1)
 *
 * 配置順 (above-fold 優先):
 *   1. Claude Code 副業講座 (gradient、最高 CTR 期待)
 *   2. 高単価アフィリエイトバナー (SidebarPromoBanner)
 *   3. topWidgets (関連ランキング・関連記事など)
 *   4. AdSense Rectangle (上部)
 *   5. midWidgets
 *   6. ふるさと納税 (furusatoAreaCode 指定時)
 *   7. bottomWidgets
 *   8. AdSense Rectangle (下部)
 *
 * デフォルトで `xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto` により
 * viewport 内で独立スクロール (記事本文を読みつつ全 widget に到達可能)。
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
  stickyScroll = true,
}: RightRailWidgetsProps) {
  const scrollClass = stickyScroll
    ? "xl:sticky xl:top-20 xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto xl:pr-1"
    : "";

  return (
    <div className={`flex flex-col gap-3 ${scrollClass}`}>
      {showOperatorCard && <OperatorPromoCard placement="sidebar" />}

      {showTechSchool && <TechSchoolPromoCard />}

      {showPromoBanner && <SidebarPromoBanner index={promoBannerIndex} />}

      {topWidgets}

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

      {midWidgets}

      {furusatoAreaCode && <FurusatoNozeiCard areaCode={furusatoAreaCode} />}

      {bottomWidgets}

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
