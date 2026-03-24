"use client";

import { trackAffiliateClick } from "@/lib/analytics/events";

interface TrackedAffiliateLinkProps {
  href: string;
  category: string;
  label: string;
  position: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * アフィリエイトリンクの `<a>` ラッパー。
 * クリック時に GA4 カスタムイベント `affiliate_click` を送信する。
 * サーバーコンポーネントから children として利用可能。
 */
export function TrackedAffiliateLink({
  href,
  category,
  label,
  position,
  className,
  children,
}: TrackedAffiliateLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={className}
      onClick={() => trackAffiliateClick({ category, label, position })}
    >
      {children}
    </a>
  );
}
