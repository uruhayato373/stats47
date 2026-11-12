"use client";

import { useEffect, useRef } from "react";

import Link from "@/components/atoms/SiteLink";

import { buildAmazonUrl } from "@/features/ads/constants/related-books";

import {
  productReferralOf,
  trackCtaClick,
  trackNavClick,
  trackProductClick,
  trackProductImpression,
} from "@/lib/analytics/events";
import { createImpressionWatcher } from "@/lib/analytics/impression-watcher";

import type { ProductDetailPlacement, StorefrontChannel } from "../types";

/** 商品詳細へ来る前の案内の置き場所を、販売先クリックまで持ち越す (同じタブの間だけ)。 */
const PLACEMENT_STORAGE_KEY = "stats47:product-placement";

function rememberPlacement(productSlug: string, placement: string): void {
  try {
    const current = JSON.parse(sessionStorage.getItem(PLACEMENT_STORAGE_KEY) ?? "{}") as Record<string, string>;
    sessionStorage.setItem(PLACEMENT_STORAGE_KEY, JSON.stringify({ ...current, [productSlug]: placement }));
  } catch {
    // 保存できない環境では、販売先クリックを product_detail として数える
  }
}

function recallPlacement(productSlug: string): string | null {
  try {
    const current = JSON.parse(sessionStorage.getItem(PLACEMENT_STORAGE_KEY) ?? "{}") as Record<string, string>;
    return typeof current[productSlug] === "string" ? current[productSlug] : null;
  } catch {
    return null;
  }
}

/** 商品案内が 50% 以上・1 秒続けて見えたら 1 回だけ product_impression を送る。 */
export function useProductImpression<T extends Element>(
  externalUrl: string,
  placement: string,
  detail?: { readonly productSlug: string; readonly ctaId: ProductDetailPlacement },
) {
  const ref = useRef<T>(null);
  const productSlug = detail?.productSlug;
  const ctaId = detail?.ctaId;
  useEffect(() => {
    const el = ref.current;
    const referral = productReferralOf(externalUrl);
    if (!el || !referral || typeof IntersectionObserver === "undefined") return;
    const watcher = createImpressionWatcher(() => trackProductImpression({
      ...referral,
      placement: (productSlug && recallPlacement(productSlug)) || placement,
      ctaId,
    }));
    const observer = new IntersectionObserver(
      ([entry]) => watcher.handleIntersection(entry.isIntersecting && entry.intersectionRatio >= 0.5),
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      watcher.cleanup();
    };
  }, [externalUrl, placement, productSlug, ctaId]);
  return ref;
}

interface TrackedProductLinkProps {
  readonly href: string;
  readonly label: string;
  readonly surface: "product_catalog" | "blog_product" | "ranking_product";
  /** 案内する商品。表示 (product_impression) と、詳細から販売先へ出たときの置き場所の持ち越しに使う */
  readonly product: { readonly slug: string; readonly externalUrl: string };
  /** link_position に入れる置き場所。省略時は surface と同じ */
  readonly placement?: string;
  readonly className?: string;
  readonly children: React.ReactNode;
}

/** サイト内の商品導線。登録済み nav_label/nav_surface だけで行き先を判別する。 */
export function TrackedProductLink({
  href,
  label,
  surface,
  product,
  placement = surface,
  className,
  children,
}: TrackedProductLinkProps) {
  const ref = useProductImpression<HTMLAnchorElement>(product.externalUrl, placement);
  return (
    <Link
      ref={ref}
      href={href}
      className={className}
      onClick={() => {
        trackNavClick({ href, label, surface });
        rememberPlacement(product.slug, placement);
      }}
    >
      {children}
    </Link>
  );
}

interface TrackedProductOutboundLinkProps {
  readonly href: string;
  readonly productId: string;
  readonly productSlug: string;
  readonly productTitle: string;
  readonly channel: StorefrontChannel;
  readonly detailPlacement?: ProductDetailPlacement;
  readonly className?: string;
  readonly children: React.ReactNode;
}

/**
 * 販売先クリック。商品詳細内の位置は登録済み cta_id に入れ、流入元の link_position は保つ。
 * Kindle は Amazon アソシエイトのタグを付ける (自社本でも第三者の購入は紹介料の対象) ため sponsored にする。
 *
 * 加えて product_click (キーイベント) を送る。link_position は詳細へ来る前の案内の置き場所
 * (直接来た人は product_detail)。cta_click は 2026-10-07 からの時系列を切らないため残す。
 */
export function TrackedProductOutboundLink({
  href,
  productId,
  productSlug,
  productTitle,
  channel,
  detailPlacement,
  className,
  children,
}: TrackedProductOutboundLinkProps) {
  return (
    <a
      href={channel === "kindle" ? buildAmazonUrl(href) : href}
      target="_blank"
      rel={channel === "kindle" ? "noopener noreferrer sponsored" : "noopener noreferrer"}
      className={className}
      data-click-owner="cta"
      onClick={() => {
        trackCtaClick({
          ctaId: `product_${channel}_${productId.toLowerCase()}`,
          label: productTitle,
          position: `product_${channel}`,
        });
        const referral = productReferralOf(href);
        if (referral) {
          trackProductClick({
            ...referral,
            placement: recallPlacement(productSlug) ?? "product_detail",
            ctaId: detailPlacement,
          });
        }
      }}
    >
      {children}
    </a>
  );
}
