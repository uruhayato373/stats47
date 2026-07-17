"use client";

import { useEffect, useRef } from "react";

import {
  trackHomeFeaturedClick,
  trackHomeFeaturedImpression,
  type HomeFeaturedEventParams,
} from "@/lib/analytics/events";

import { createImpressionWatcher } from "../../utils/impression-watcher";

interface TrackedFeaturedRankingCardProps extends HomeFeaturedEventParams {
  children: React.ReactNode;
}

/**
 * ホーム注目ランキングカードの計測ラッパー (home-featured-v1)。
 *
 * - impression: IntersectionObserver threshold 0.5 + 1 秒連続表示で 1 回だけ
 *   `home_featured_impression` を送る (条件ロジックは createImpressionWatcher)。
 * - click: 子のカードリンク click を capture して `home_featured_click` を送る
 *   (キーボードの Enter 起動も click event として捕捉される)。
 * - 表示は children (control / editorial visual) に委譲し、ここでは DOM を足すだけ。
 */
export function TrackedFeaturedRankingCard({
  rankingKey,
  cardVariant,
  slot,
  experimentId,
  experimentVariant,
  children,
}: TrackedFeaturedRankingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const paramsRef = useRef<HomeFeaturedEventParams>({
    rankingKey,
    cardVariant,
    slot,
    experimentId,
    experimentVariant,
  });
  // render 中の ref 書込は React ルール違反のため毎 render 後の effect で最新化する
  // (impression/click は render 後にしか発火しないので stale にならない)
  useEffect(() => {
    paramsRef.current = { rankingKey, cardVariant, slot, experimentId, experimentVariant };
  }, [rankingKey, cardVariant, slot, experimentId, experimentVariant]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const watcher = createImpressionWatcher(() => {
      trackHomeFeaturedImpression(paramsRef.current);
    });
    const observer = new IntersectionObserver(
      ([entry]) => watcher.handleIntersection(entry.isIntersecting),
      { threshold: 0.5 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      watcher.cleanup();
    };
    // card mount につき 1 回の impression。params 変化で再購読しない (paramsRef が最新値を持つ)
  }, []);

  return (
    <div
      ref={ref}
      className="h-full"
      onClickCapture={() => trackHomeFeaturedClick(paramsRef.current)}
    >
      {children}
    </div>
  );
}
