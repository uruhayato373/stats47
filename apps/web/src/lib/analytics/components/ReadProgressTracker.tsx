"use client";

import { useEffect } from "react";

import { usePathname } from "next/navigation";

import { READ_PROGRESS_STEPS, trackReadProgress, type ReadProgressStep } from "@/lib/analytics/events";

const SCROLL_THROTTLE_MS = 200;

/** スクロール位置 (0〜100) から、まだ送っていない到達段階を返す (pure)。 */
export function reachedSteps(percent: number, sent: ReadonlySet<ReadProgressStep>): ReadProgressStep[] {
  return READ_PROGRESS_STEPS.filter((step) => percent >= step && !sent.has(step));
}

/**
 * 読了トラッカー — ページをどこまで読んだかを 25 / 50 / 75 / 100% で 1 回ずつ送る。
 * pathname が変わると段階をリセットする。
 */
export function ReadProgressTracker(): null {
  const pathname = usePathname();

  useEffect(() => {
    const sent = new Set<ReadProgressStep>();
    // requestAnimationFrame は非表示タブで止まるため、短いタイマーで間引く
    let timer: number | undefined;
    const measure = () => {
      timer = undefined;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const percent = ((window.scrollY + 1) / scrollable) * 100;
      for (const step of reachedSteps(percent, sent)) {
        sent.add(step);
        trackReadProgress(step);
      }
    };
    const onScroll = () => {
      if (timer === undefined) timer = window.setTimeout(measure, SCROLL_THROTTLE_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
