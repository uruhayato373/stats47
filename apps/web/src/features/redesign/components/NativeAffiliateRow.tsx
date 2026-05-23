import Image from "next/image";

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
  /** false なら "PR" バッジを非表示 */
  showPrBadge?: boolean;
}

/**
 * D-System ネイティブアフィリエイト枠
 *
 * 本文導線中に 4 列カードでバナーを表示。"PR" バッジ + 注記 footer を必須付与し、
 * AdSense / コンテンツとの混同を防ぐ。banners が空なら何も返さない（安全な fallback）。
 */
export function NativeAffiliateRow({
  title,
  description,
  moreHref,
  banners,
  position = "native-row",
  trackingCategory = "native-affiliate",
  showPrBadge = true,
}: NativeAffiliateRowProps) {
  if (banners.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-accent-foreground/70" />
          <h2 className="truncate text-sm font-bold text-foreground">{title}</h2>
          {showPrBadge && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
              PR
            </span>
          )}
        </div>
        {moreHref && (
          <a
            href={moreHref}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            もっと見る ›
          </a>
        )}
      </div>
      {description && (
        <p className="border-b border-border px-4 pt-2.5 text-xs text-muted-foreground">
          {description}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-4">
        {banners.slice(0, 4).map((b) => (
          <TrackedAffiliateLink
            key={b.href + b.imageUrl}
            href={b.href}
            category={trackingCategory}
            label={b.title}
            position={position}
            className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-2.5 transition-shadow hover:shadow-md"
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
      <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        アフィリエイトリンクが含まれます。価格は表示時点のものです。
      </div>
    </div>
  );
}
