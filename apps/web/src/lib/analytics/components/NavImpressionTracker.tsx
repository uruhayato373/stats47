"use client";

import { useEffect } from 'react';

import { usePathname } from 'next/navigation';

import { trackNavImpression } from '../events';
import { createImpressionWatcher } from '../impression-watcher';

import { resolveNavClick } from './NavClickTracker';

/** 記事 ID のあるリンクを、クリックと同じ属性で計測。見えていないカードは分母に入れない。 */
export function NavImpressionTracker({ containerId }: { containerId: string }): null {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.getElementById(containerId);
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const cards = new Map(Array.from(root.querySelectorAll<HTMLAnchorElement>('a[data-content-id]'), (anchor) => [
      anchor,
      {
        visible: false,
        watcher: createImpressionWatcher(() => {
          const params = resolveNavClick(anchor, window.location);
          if (params) trackNavImpression(params);
        }),
      },
    ]));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const card = entry.target instanceof HTMLAnchorElement ? cards.get(entry.target) : undefined;
        if (!card) continue;
        card.visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        card.watcher.handleIntersection(card.visible && !document.hidden);
      }
    }, { threshold: 0.5 });
    const onVisibilityChange = () => {
      for (const card of cards.values()) card.watcher.handleIntersection(card.visible && !document.hidden);
    };
    cards.forEach((_card, anchor) => observer.observe(anchor));
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      cards.forEach(({ watcher }) => watcher.cleanup());
    };
  }, [containerId, pathname]);
  return null;
}
