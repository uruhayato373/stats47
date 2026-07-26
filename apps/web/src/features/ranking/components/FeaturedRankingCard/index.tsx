import {
  PORTAL_CARD_ASPECT_CLASS,
  SurfaceLinkCard,
} from "@/components/surface";

import type { FeaturedRankingCardModel } from "../../utils/resolve-featured-ranking-card";

export interface FeaturedRankingCardProps {
  rankingKey: string;
  year: string;
  unit: string;
  model: FeaturedRankingCardModel;
}

/**
 * home / category / survey共通の注目ランキングカード。
 * 比率・余白・文字階層・地理地図配置をこの1形式だけで管理する。
 */
export function FeaturedRankingCard({
  rankingKey,
  year,
  unit,
  model,
}: FeaturedRankingCardProps) {
  return (
    <SurfaceLinkCard
      href={`/ranking/${rankingKey}`}
      className={`${PORTAL_CARD_ASPECT_CLASS} group flex flex-col overflow-hidden p-3`}
    >
      <span className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
        {model.hook}
      </span>
      <div className="relative mt-1 min-h-0 flex-1">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 translate-x-[8%] translate-y-[10%] [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: model.mapSvg }}
        />
        <div className="absolute left-0 top-1 z-10 bg-background/90 pr-2">
          <p className="text-[10px] leading-none text-muted-foreground">
            {model.top.rank ?? 1}位
          </p>
          <p className="mt-1 text-sm font-semibold leading-none text-foreground">
            {model.top.areaName}
          </p>
          <p className="mt-1 font-mono text-base font-bold leading-none tabular-nums text-primary">
            {model.top.value}
            <span className="ml-0.5 font-sans text-[10px] font-medium text-muted-foreground">
              {unit}
            </span>
          </p>
        </div>
        <span className="absolute bottom-0 left-0 z-10 bg-background/90 pr-2 text-[10px] leading-none text-muted-foreground">
          {year}年
        </span>
      </div>
    </SurfaceLinkCard>
  );
}
