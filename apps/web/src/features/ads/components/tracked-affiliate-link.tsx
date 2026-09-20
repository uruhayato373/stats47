"use client";

import { trackAffiliateClick } from "@/lib/analytics/events";

interface TrackedAffiliateLinkProps {
  href: string;
  category: string;
  label: string;
  position: string;
  /** 広告 1 件単位の識別子 (AffiliateAd.id)。案件別 CTR 計測用 */
  adId?: string;
  /** A/B テスト用 (AFF-05・任意) */
  experimentId?: string;
  variantId?: string;
  creativeSize?: string;
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
  adId,
  experimentId,
  variantId,
  creativeSize,
  className,
  children,
}: TrackedAffiliateLinkProps) {
  const isMoshimo = (() => {
    try {
      return new URL(href).hostname === "af.moshimo.com";
    } catch {
      return false;
    }
  })();
  // もしもの発行原稿は referrerpolicy + attributionsrc を必須とする。
  // noreferrer は referrerpolicy を無効化するため、もしもだけ nofollow/noopener/sponsored にする。
  const moshimoAttributes = isMoshimo
    ? ({ referrerPolicy: "no-referrer-when-downgrade", attributionsrc: "" } as const)
    : {};
  return (
    // eslint-disable-next-line react/jsx-no-target-blank -- もしも原稿はreferrer送信必須。noopenerは常に維持する。
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel={isMoshimo ? "nofollow noopener sponsored" : "noopener noreferrer sponsored"}
      className={className}
      {...moshimoAttributes}
      onClick={() =>
        trackAffiliateClick({ category, label, position, adId, experimentId, variantId, creativeSize })
      }
    >
      {children}
    </a>
  );
}
