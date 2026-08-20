import Image from "next/image";

import { AdImpressionTracker } from "@/features/ads/components/AdImpressionTracker";
import { TrackedAffiliateLink } from "@/features/ads/components/tracked-affiliate-link";
import { isLandscapeBanner } from "@/features/ads/services/banner-geometry";
import type { ResolvedAffiliateBanner } from "@/features/ads/services/resolve-affiliate-ad";

interface NativeAffiliateRowProps {
  /** バナー配列。縦長を除き、variantの上限（3件または4件）まで描画する */
  banners: ResolvedAffiliateBanner[];
  /** AffiliateLink の position 追跡用 */
  position?: string;
  /** AffiliateLink の category 追跡用 */
  trackingCategory?: string;
  /**
   * `standard`: mobile 2列 / desktop 4列（一覧・ハブ用）。
   * `three-up`: mobile は最優先1件 / desktop は3列（読了位置用）。
   */
  variant?: "standard" | "three-up";
}

function getThreeUpGridClassName(itemCount: number): string {
  if (itemCount === 1) {
    return "mx-auto grid max-w-xs grid-cols-1 items-start gap-2";
  }
  if (itemCount === 2) {
    return "mx-auto grid max-w-2xl grid-cols-1 items-start gap-2 md:grid-cols-2";
  }
  return "grid grid-cols-1 items-start gap-2 md:grid-cols-3";
}

/**
 * ネイティブアフィリエイト枠。リンク付きバナー画像だけをグリッド表示する。
 *
 * ★ 2026-08-14: PR ラベル・見出し・商品名・もっと見る導線・カード装飾を廃止した。
 *   ASP 提供バナーの意匠をそのまま表示し、サイト側の可視テキストや装飾を重ねない。
 *
 * ★ 縦長 (height > width) クリエイティブはここで除外する。本文の横並びグリッドに
 *   スカイスクレイパー (120x600) が入ると行が過度に高くなるため。縦長の受け皿は
 *   sidebar-sticky スロット (SidebarStickyBannerAd)。呼び出し元は除外分を見込んで
 *   解決 limit を 8 程度にする (正典: .claude/rules/affiliate-ads-standards.md §3)。
 *
 * ★ 2026-08-04: impression 計装を追加した。それまで **クリックだけ送って impression を
 *   送っていなかった**ため、GA4 の impression 内訳に native 枠が 1 つも現れず、CTR の
 *   分母が系統的に欠けていた (この枠は blog / ranking / category / survey / tag / themes /
 *   home / compare / 市区町村と主要ページ種別のほぼ全てに出る)。
 *   正典: .claude/rules/analytics-event-standards.md
 *
 * ★ 計測の `category` には **banner の vertical (10 軸)** を渡す。`trackingCategory`
 *   (例 "category-landweather") は 10 軸外なので affiliate_vertical に流すと内訳が壊れる。
 *   ページ文脈は `position` (例 "category-native") が担うため情報は失われない。
 */
export function NativeAffiliateRow({
  banners,
  position = "native-row",
  trackingCategory = "native-affiliate",
  variant = "standard",
}: NativeAffiliateRowProps) {
  // 呼び出し元がフィルタ済みでも冪等 (防御的フィルタ)
  const itemLimit = variant === "three-up" ? 3 : 4;
  const visible = banners.filter(isLandscapeBanner).slice(0, itemLimit);
  if (visible.length === 0) return null;

  const isThreeUp = variant === "three-up";
  const gridClassName = isThreeUp
    ? getThreeUpGridClassName(visible.length)
    : "grid grid-cols-2 items-start gap-2 md:grid-cols-4";

  return (
    <div className={gridClassName}>
      {visible.map((b, index) => (
        <AdImpressionTracker
          key={b.href + b.imageUrl}
          category={b.vertical ?? trackingCategory}
          label={b.title}
          position={position}
          adId={b.id}
          creativeSize={`${b.width}x${b.height}`}
          className={isThreeUp && index > 0 ? "hidden md:block" : undefined}
        >
          <TrackedAffiliateLink
            href={b.href}
            category={b.vertical ?? trackingCategory}
            label={b.title}
            position={position}
            adId={b.id}
            className="relative block"
          >
            <Image
              src={b.imageUrl}
              alt={b.title}
              width={b.width}
              height={b.height}
              sizes={
                isThreeUp
                  ? "(max-width: 767px) 100vw, 33vw"
                  : "(max-width: 767px) 50vw, 25vw"
              }
              className="block h-auto w-full"
              loading="lazy"
            />
            {b.trackingPixelUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={b.trackingPixelUrl}
                alt=""
                width={1}
                height={1}
                className="absolute left-0 top-0 h-px w-px opacity-0"
              />
            )}
          </TrackedAffiliateLink>
        </AdImpressionTracker>
      ))}
    </div>
  );
}
