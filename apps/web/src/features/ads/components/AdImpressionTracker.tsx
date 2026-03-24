"use client";

import { useEffect, useRef } from "react";

interface AdImpressionTrackerProps {
  category: string;
  label: string;
  position: string;
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
                link_position: position,
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
  }, [category, label, position]);

  return <div ref={ref}>{children}</div>;
}
