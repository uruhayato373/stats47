"use client";

import { useEffect, useState } from "react";

import type { RankingLinkCardData } from "@/features/blog";

import { FeaturedRankingCard } from "../FeaturedRankingCard";

import type { FeaturedRankingCardModel } from "../../utils/resolve-featured-ranking-card";

interface RelatedRankingMapLoaderProps {
  rankingKey: string;
  /** カードの題 (指標の短い名前) */
  hook: string;
  /** 最新年 (4 桁) */
  year: string;
}

/**
 * ランキングのページ下の「同カテゴリの関連ランキング」の 1 枚を読み込む役 (カードの部品は持たない)。注目ランキングと同じカード (FeaturedRankingCard) に、
 * ブログのカードと同じ API (`/api/ranking-card/<key>`) から地図と上位 3 位を読んで入れる。
 * 地図をページの HTML に焼くと 9 枚分の SVG で描画とキャッシュが重くなるので、表示後に読む。
 * 読み込み中と、データが無い指標は、同じカードの地図の枠を空けたまま題だけを出す (高さを変えない)。
 */
export function RelatedRankingMapLoader({ rankingKey, hook, year }: RelatedRankingMapLoaderProps) {
  const [data, setData] = useState<RankingLinkCardData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ranking-card/${rankingKey}`)
      .then((res) => (res.ok ? (res.json() as Promise<RankingLinkCardData | null>) : null))
      .catch(() => null)
      .then((json) => {
        if (!cancelled && json?.top?.length) setData(json);
      });
    return () => {
      cancelled = true;
    };
  }, [rankingKey]);

  const model: FeaturedRankingCardModel = {
    hook,
    top: { unit: data?.unit ?? "", rows: data?.top ?? [] },
    mapSvg: data?.mapSvg ?? "",
  };
  return <FeaturedRankingCard rankingKey={rankingKey} year={year} model={model} />;
}
