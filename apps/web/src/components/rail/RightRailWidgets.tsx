import { type ReactNode } from "react";

import {
  RailAdSlot,
  SidebarPromoBanner,
  selectPromoBannerIndexForRanking,
} from "@/features/ads";

import {
  ADSENSE_DISPLAY_ENABLED,
  RANKING_PAGE_SIDEBAR,
  RANKING_SIDEBAR_TOP,
} from "@/lib/google-adsense";

interface RightRailWidgetsProps {
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
  /** 高単価アフィリエイトバナーを表示するか (default: true) */
  showPromoBanner?: boolean;
  /** 表示する SIDEBAR_PROMO_BANNERS の index (default: 汎用画像バナー) */
  promoBannerIndex?: number;
}

/**
 * 全ページ共通の右サイドバー widget セット。
 *
 * 配置順 (本文関連 widget を上・promo/広告を下):
 *   1. topWidgets / midWidgets / bottomWidgets (関連ランキング・関連記事など)
 *   ── 区切り ──
 *   2. 画像アフィリエイトバナー
 *   3. AdSense Rectangle (上 → 下)
 *
 * 右レールの PR は登録済み画像バナーに限定し、独自テキストカードを置かない。
 * 自然フロー（sticky/独立スクロールなし）。本文を主役にするため促進系を下げている。
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md
 */
export async function RightRailWidgets({
  topWidgets,
  midWidgets,
  bottomWidgets,
  showBottomAd = true,
  showTopAd = true,
  showPromoBanner = true,
  promoBannerIndex = selectPromoBannerIndexForRanking(),
}: RightRailWidgetsProps) {
  const hasContent = !!topWidgets || !!midWidgets || !!bottomWidgets;
  const hasAdsense = ADSENSE_DISPLAY_ENABLED && (showTopAd || showBottomAd);
  const hasPromoOrAds = showPromoBanner || hasAdsense;

  return (
    <div className="flex flex-col gap-3">
      {/* 本文関連 widget（主役） */}
      {topWidgets}
      {midWidgets}
      {bottomWidgets}

      {/* 区切り: 本文関連と promo/広告の境界 */}
      {hasContent && hasPromoOrAds && (
        <hr className="my-1 border-t border-border" />
      )}

      {/* PR は ASP 登録済みの画像バナーだけを表示する */}
      {showPromoBanner && <SidebarPromoBanner index={promoBannerIndex} />}

      {/* AdSense（一時停止中は枠・余白とも生成しない）。RailAdSlot に統一 */}
      {ADSENSE_DISPLAY_ENABLED && showTopAd && (
        <RailAdSlot slot={RANKING_SIDEBAR_TOP} />
      )}
      {ADSENSE_DISPLAY_ENABLED && showBottomAd && (
        <RailAdSlot slot={RANKING_PAGE_SIDEBAR} />
      )}
    </div>
  );
}
