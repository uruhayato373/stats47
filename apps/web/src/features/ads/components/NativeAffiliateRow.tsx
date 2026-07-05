import Image from "next/image";

import { Sparkles } from "lucide-react";


import { SurfaceCard, getSurfaceCardClassName } from "@/components/surface";

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
            <TrackedAffiliateLink
              key={b.href + b.imageUrl}
              href={b.href}
              category={trackingCategory}
              label={b.title}
              position={position}
              className={getSurfaceCardClassName({
                interactive: true,
                className: "group flex flex-col gap-2 p-2",
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
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}
