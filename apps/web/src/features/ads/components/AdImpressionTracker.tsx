"use client";

import { useEffect, useRef } from "react";

interface AdImpressionTrackerProps {
  category: string;
  label: string;
  position: string;
  /** A/B テスト用 (AFF-05・任意) */
  experimentId?: string;
  variantId?: string;
  creativeSize?: string;
  children: React.ReactNode;
}

/**
 * Intersection Observer で広告のインプレッション（ビューポート表示）を GA4 に送信する。
 * 50% 以上が 1 秒以上表示された場合に 1 回だけ発火する。
 */
export function AdImpressionTracker({
  category,
  label,
  position,
  experimentId,
  variantId,
  creativeSize,
  children,
}: AdImpressionTrackerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || firedRef.current) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !firedRef.current) {
          timer = setTimeout(() => {
            if (firedRef.current) return;
            firedRef.current = true;

            if (typeof window !== "undefined" && window.gtag) {
              window.gtag("event", "ad_impression", {
                event_category: "affiliate",
                event_label: label,
                affiliate_category: category,
                // 広告意図軸 (10 vertical) の canonical dimension。category に vertical 値が流れる。
                affiliate_vertical: category,
                link_position: position,
                ...(experimentId ? { experiment_id: experimentId } : {}),
                ...(variantId ? { variant_id: variantId } : {}),
                ...(creativeSize ? { creative_size: creativeSize } : {}),
              });
            }
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [category, label, position, experimentId, variantId, creativeSize]);

  return <div ref={ref}>{children}</div>;
}
