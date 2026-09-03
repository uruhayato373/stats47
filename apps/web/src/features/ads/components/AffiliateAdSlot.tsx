import { SurfaceCard } from "@/components/surface";

import {
  ADSENSE_DISPLAY_ENABLED,
  RANKING_PAGE_FOOTER,
  RANKING_PAGE_TABLE_SIDE,
} from "@/lib/google-adsense";

import { CATEGORY_AFFILIATE_MAP, type AffiliateVertical } from "../constants/affiliate-category";
import {
  resolveAffiliateBannersByVertical,
  resolveAffiliateTextAdsByVertical,
  resolveExperimentVariantsByCategoryKey,
} from "../services";

import { AdSenseAdWrapper } from "./AdSenseAdWrapper";
import { AffiliateTextAdList } from "./AffiliateTextAdList";
import { BannerAd } from "./BannerAd";
import { VariantAdSlot } from "./VariantAdSlot";

import type { AffiliateLocationCode } from "../types";

interface AffiliateAdSlotProps {
  categoryKey: string;
  /**
   * ページ内容から解決済みの意図軸 (`resolveContentVertical`)。渡されたときは categoryKey 由来の
   * 写像より優先する。**null は「意図軸の広告を出さない」**(出典調査が null の指標) で、
   * その場合は AdSense フォールバックへ直行する。undefined は従来どおり categoryKey で解決。
   */
  vertical?: AffiliateVertical | null;
  position?: "sidebar" | "footer";
  /** ranking ページで指定。targetRankingKeys を持つ広告の文脈一致フィルタに使う (任意) */
  rankingKey?: string;
  /** 右レールを画像バナーだけに限定し、テキスト広告へフォールバックしない */
  bannerOnly?: boolean;
  /**
   * サイドバーに出すバナーの最大数 (既定 1)。在庫が無ければその分だけ減る。
   * 同一 vertical で priority 降順に返るため、先頭ほど確定EPC が高い順に当たる。
   */
  bannerLimit?: number;
  /** テキスト広告の最大数 (既定 2)。bannerOnly のときは使わない。 */
  textLimit?: number;
}

function mapPositionToLocation(position: "sidebar" | "footer"): AffiliateLocationCode {
  return position === "footer" ? "footer" : "sidebar-bottom";
}

/**
 * アフィリエイト広告スロット。
 *
 * 優先順位 (AFF-05 で実験を最優先に追加):
 * 0. A/B 実験 variant (sidebar・experimentId 付きが 2 件以上) → VariantAdSlot でクライアント加重ランダム
 * 1. バナー広告 (sidebar のみ・categoryKey 一致の上位1件) — 視認性が高く impression を稼ぐ (AFF-03)
 * 2. テキスト広告 (最大 2 件。bannerOnly ではスキップ)
 * 3. なければ AdSense にフォールバック
 *
 * experiment / banner 在庫の無いカテゴリ (広告ゼロ8軸など) は下位へ流れるため従来挙動と同じ。
 * 本コンポーネントは async Server Component で R2 を build 時に解決する
 * (cookies()/headers() を使わないため SSG を壊さない: nextjs-ssg-preservation.md)。
 */
export async function AffiliateAdSlot({
  categoryKey,
  vertical,
  position = "sidebar",
  rankingKey,
  bannerOnly = false,
  bannerLimit = 1,
  textLimit = 2,
}: AffiliateAdSlotProps) {
  const locationCode = mapPositionToLocation(position);
  const affiliateCategory =
    vertical !== undefined ? vertical : (CATEGORY_AFFILIATE_MAP[categoryKey] ?? null);

  // 0. A/B 実験 (sidebar のみ)。experimentId 付き variant が 2 件以上あればクライアント加重ランダム出し分け。
  if (position === "sidebar") {
    const variants = await resolveExperimentVariantsByCategoryKey(categoryKey);
    const eligibleVariants = bannerOnly
      ? variants.filter(
          (variant) => variant.adType === "banner" && !!variant.imageUrl,
        )
      : variants;
    if (eligibleVariants.length >= 2) {
      return (
        <VariantAdSlot
          variants={eligibleVariants}
          category={affiliateCategory ?? "other"}
          position="ranking-sidebar"
        />
      );
    }
  }

  // 1. バナー優先 (sidebar のみ)。ranking の主要トラフィックに視認性の高い枠を出す。
  //    ★ 2026-08-04: 上位 1 件の早期 return をやめ bannerLimit 件まで積む。
  if (position === "sidebar" && affiliateCategory) {
    const banners = await resolveAffiliateBannersByVertical(
      affiliateCategory,
      Math.max(1, bannerLimit),
      rankingKey,
    );
    if (banners.length > 0) {
      return (
        <>
          {banners.map((banner) => (
            <BannerAd
              key={banner.id}
              href={banner.href}
              imageUrl={banner.imageUrl}
              trackingPixelUrl={banner.trackingPixelUrl}
              width={banner.width}
              height={banner.height}
              // vertical を優先 (categoryKey 由来の affiliateCategory は fallback)
              category={banner.vertical ?? affiliateCategory ?? "other"}
              label={banner.title}
              position="ranking-sidebar"
              adId={banner.id}
              creativeSize={`${banner.width}x${banner.height}`}
            />
          ))}
        </>
      );
    }
  }

  // 2. テキスト広告
  //    ★ 条件を `!bannerOnly` 単独に保つ (check-ad-placement.cjs がこのリテラルで
  //      「テキストへ戻さない」ゲートの存在を検査する)。意図軸の有無は内側で分岐する。
  if (!bannerOnly) {
    const ads = affiliateCategory
      ? await resolveAffiliateTextAdsByVertical(
          affiliateCategory,
          locationCode,
          textLimit,
          rankingKey,
        )
      : [];
    if (ads.length > 0) {
      return (
        <AffiliateTextAdList
          ads={ads}
          affiliateCategory={affiliateCategory}
          position={position}
        />
      );
    }
  }

  // 3. AdSense フォールバック
  if (!ADSENSE_DISPLAY_ENABLED) return null;

  const adSlot =
    position === "footer" ? RANKING_PAGE_FOOTER : RANKING_PAGE_TABLE_SIDE;

  return (
    <SurfaceCard className="p-3">
      <AdSenseAdWrapper
        format={adSlot.format}
        slotId={adSlot.slotId}
      />
    </SurfaceCard>
  );
}
