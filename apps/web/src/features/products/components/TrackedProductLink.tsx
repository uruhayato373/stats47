"use client";

import Link from "next/link";

import { trackCtaClick, trackNavClick } from "@/lib/analytics/events";

import type { StorefrontChannel } from "../types";

interface TrackedProductLinkProps {
  readonly href: string;
  readonly label: string;
  readonly surface: "product_catalog" | "blog_product";
  readonly className?: string;
  readonly children: React.ReactNode;
}

/** サイト内の商品導線。登録済み nav_label/nav_surface だけで行き先を判別する。 */
export function TrackedProductLink({
  href,
  label,
  surface,
  className,
  children,
}: TrackedProductLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackNavClick({ href, label, surface })}
    >
      {children}
    </Link>
  );
}

interface TrackedProductOutboundLinkProps {
  readonly href: string;
  readonly productId: string;
  readonly productTitle: string;
  readonly channel: StorefrontChannel;
  readonly className?: string;
  readonly children: React.ReactNode;
}

/**
 * 販売先クリック。商品IDは詳細ページの page path、販売先は登録済み link_position で判別する。
 * 新しい GA4 custom dimension に依存しないため、デプロイ直後から集計可能。
 */
export function TrackedProductOutboundLink({
  href,
  productId,
  productTitle,
  channel,
  className,
  children,
}: TrackedProductOutboundLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() =>
        trackCtaClick({
          ctaId: `product_${channel}_${productId.toLowerCase()}`,
          label: productTitle,
          position: `product_${channel}`,
        })
      }
    >
      {children}
    </a>
  );
}
