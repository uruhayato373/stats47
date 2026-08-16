import { CATEGORY_AFFILIATE_MAP } from "../constants/affiliate-category";
import { readActiveBannersByLocationFromR2 as findActiveBannersByLocation } from "../repositories/affiliate-ad-snapshot";

import { BannerAd } from "./BannerAd";

interface SidebarStickyBannerAdProps {
  /** GA4 link_position。設置面ごとに変える (例: "home-left-rail") */
  position?: string;
}

/**
 * 縦長 (スカイスクレイパー 120x600 / 160x600) 専用のサイドバースロット。
 * locationCode "sidebar-sticky" のバナーを priority 降順で 1 件表示する。
 *
 * ★ 2026-08-06 新設。sidebar-sticky は型定義には昔からあるが**読む描画コードが存在せず**、
 *   縦長在庫が vertical 解決経由で本文の native 横並び枠に流入して極細の縦帯に潰れていた。
 *   縦長の受け皿はこのスロットだけ (native/本文枠は isLandscapeBanner で除外する)。
 *   正典: .claude/rules/affiliate-ads-standards.md §3
 *
 * ★ lg 未満では描画しない (サイドバーという概念が lg+ にしか無い。600px の縦長を
 *   モバイルの本文フローに落とすと画面を占有する)。sticky 追従は付けない — home の
 *   構造テストが aside への sticky 付与を禁止している (フッター押し出し防止の系譜)。
 * 該当なしの場合は何も表示しない (空枠を作らない・AdSense フォールバックなし)。
 */
export async function SidebarStickyBannerAd({
  position = "sidebar-sticky",
}: SidebarStickyBannerAdProps) {
  const banners = await findActiveBannersByLocation("sidebar-sticky", 1);
  const banner = banners[0];
  if (!banner || !banner.imageUrl) return null;

  const affiliateCategory = banner.categoryKey
    ? CATEGORY_AFFILIATE_MAP[banner.categoryKey]
    : undefined;

  return (
    <div className="hidden lg:block">
      <BannerAd
        href={banner.htmlContent}
        imageUrl={banner.imageUrl}
        trackingPixelUrl={banner.trackingPixelUrl}
        width={banner.width}
        height={banner.height}
        category={affiliateCategory ?? "other"}
        label={banner.title}
        position={position}
        adId={banner.id}
        creativeSize={`${banner.width}x${banner.height}`}
      />
    </div>
  );
}
