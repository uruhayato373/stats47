import Image from "next/image";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { Sparkles } from "lucide-react";


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
    <Card>
      <CardHeader className="py-3 px-4">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {moreHref && (
          <a
            href={moreHref}
            className="ml-auto shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            もっと見る ›
          </a>
        )}
      </CardHeader>
      {description && (
        <p className="border-b border-border px-4 pb-2 text-xs text-muted-foreground">
          {description}
        </p>
      )}
      <CardContent className="px-3 pb-3 pt-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {banners.slice(0, 4).map((b) => (
            <TrackedAffiliateLink
              key={b.href + b.imageUrl}
              href={b.href}
              category={trackingCategory}
              label={b.title}
              position={position}
              className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-2 transition-shadow hover:shadow-md"
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
      </CardContent>
    </Card>
  );
}
