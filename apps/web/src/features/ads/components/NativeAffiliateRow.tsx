import Image from "next/image";

import { Sparkles } from "lucide-react";


import { SurfaceCard, getSurfaceCardClassName } from "@/components/surface";

import { AdImpressionTracker } from "@/features/ads/components/AdImpressionTracker";
import { TrackedAffiliateLink } from "@/features/ads/components/tracked-affiliate-link";
import type { ResolvedAffiliateBanner } from "@/features/ads/services/resolve-affiliate-ad";

interface NativeAffiliateRowProps {
  /** セクションタイトル (例: "このカテゴリで読む") */
  title: string;
  /** タイトル下の説明（任意） */
  description?: string;
  /** 右上の "もっと見る" リンク */
  moreHref?: string;
  /** バナー配列。空なら null を返す */
  banners: ResolvedAffiliateBanner[];
  /** AffiliateLink の position 追跡用 */
  position?: string;
  /** AffiliateLink の category 追跡用 */
  trackingCategory?: string;
}

/**
 * ネイティブアフィリエイト枠。他のサイドバー・本文カードと同じ Card スタイルで表示する。
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
  title,
  description,
  moreHref,
  banners,
  position = "native-row",
  trackingCategory = "native-affiliate",
}: NativeAffiliateRowProps) {
  if (banners.length === 0) return null;

  return (
    <SurfaceCard className="p-0">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          {title}
        </h3>
        {moreHref && (
          <a
            href={moreHref}
            className="ml-auto shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            もっと見る ›
          </a>
        )}
      </div>
      {description && (
        <p className="border-b border-border px-4 pb-2 text-xs text-muted-foreground">
          {description}
        </p>
      )}
      <div className="px-3 pb-3 pt-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {banners.slice(0, 4).map((b) => (
            <AdImpressionTracker
              key={b.href + b.imageUrl}
              category={b.vertical ?? trackingCategory}
              label={b.title}
              position={position}
              adId={b.id}
              creativeSize={`${b.width}x${b.height}`}
              className="h-full"
            >
            <TrackedAffiliateLink
              href={b.href}
              category={b.vertical ?? trackingCategory}
              label={b.title}
              position={position}
              adId={b.id}
              className={getSurfaceCardClassName({
                interactive: true,
                className: "group flex h-full flex-col gap-2 p-2",
              })}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
                <Image
                  src={b.imageUrl}
                  alt={b.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain transition-transform group-hover:scale-[1.03]"
                  loading="lazy"
                />
                {b.trackingPixelUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={b.trackingPixelUrl}
                    alt=""
                    width={1}
                    height={1}
                    className="absolute h-px w-px opacity-0"
                  />
                )}
              </div>
              <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                {b.title}
              </p>
            </TrackedAffiliateLink>
            </AdImpressionTracker>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}
