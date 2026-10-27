import { hrefFor } from "@stats47/data-configs/content/href";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import {
  PORTAL_CARD_ASPECT_CLASS,
  PORTAL_CARD_PADDING_CLASS,
  PORTAL_CARD_TITLE_CLASS,
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
      href={hrefFor("ranking", { rankingKey: rankingKey })}
      className={`${PORTAL_CARD_ASPECT_CLASS} ${PORTAL_CARD_PADDING_CLASS} group flex flex-col overflow-hidden`}
    >
      {/* hook は 2 行で切る。切れても何のランキングか読めるよう title 属性に全文を持たせる
          (survey の代表ランキングでは hook が長く、2 行目で切れていた)。 */}
      <span className={PORTAL_CARD_TITLE_CLASS} title={model.hook}>
        {model.hook}
      </span>
      {/* 1 位の値と地図は別の領域に並べる。値の背後に地図を敷くと数字が地図に重なって読みにくい。 */}
      <div className="mt-1 flex min-h-0 flex-1 gap-2">
        <div className="flex shrink-0 flex-col justify-between py-1">
          <div>
            {/* 「N位」と都道府県名は改行せず baseline 揃えで1行に置く */}
            <p className="flex items-baseline gap-1 leading-none">
              <span className="text-xs text-muted-foreground">
                {model.top.rank ?? 1}位
              </span>
              <span className="text-sm font-semibold text-foreground">
                {model.top.areaName}
              </span>
            </p>
            <p className="mt-1 font-mono text-base font-bold leading-none tabular-nums text-primary">
              {model.top.value}
              <span className="ml-0.5 font-sans text-xs font-medium text-muted-foreground">
                {formatUnitForDisplay(unit)}
              </span>
            </p>
          </div>
          <span className="text-xs leading-none text-muted-foreground">
            {year}年
          </span>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none min-w-0 flex-1 [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: model.mapSvg }}
        />
      </div>
    </SurfaceLinkCard>
  );
}
