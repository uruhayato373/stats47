import { hrefFor } from "@stats47/data-configs/content/href";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import {
  PORTAL_CARD_PADDING_CLASS,
  PORTAL_CARD_TITLE_CLASS,
  SurfaceLinkCard,
} from "@/components/surface";
import { PORTAL_CARD_CELL_CLASS } from "@/components/surface/SurfaceCard";

import type { FeaturedRankingCardModel } from "../../utils/resolve-featured-ranking-card";

export interface FeaturedRankingCardProps {
  rankingKey: string;
  year: string;
  unit: string;
  model: FeaturedRankingCardModel;
}

/**
 * home / category / survey共通の注目ランキングカード。
 * 余白・文字階層・地理地図配置をこの1形式だけで管理する。
 *
 * 高さは中身で決める (固定比率を持たない)。地図は右上の固定枠 (size-16) に置き、
 * 値の列は残りの幅で省略する。桁の多い値 (58,021,789百万円 など) でも地図と値が潰れない。
 * カルーセルのカード見出しの下では枠を外したセルになる (PORTAL_CARD_CELL_CLASS)。
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
      className={`${PORTAL_CARD_PADDING_CLASS} ${PORTAL_CARD_CELL_CLASS} group flex h-full gap-3`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* hook は 2 行で切る。切れても何のランキングか読めるよう title 属性に全文を持たせる
            (survey の代表ランキングでは hook が長く、2 行目で切れていた)。 */}
        <span className={PORTAL_CARD_TITLE_CLASS} title={model.hook}>
          {model.hook}
        </span>
        <div className="min-w-0">
          {/* 「N位」と都道府県名は改行せず baseline 揃えで1行に置く */}
          <p className="flex items-baseline gap-1 leading-none">
            <span className="text-xs text-muted-foreground">
              {model.top.rank ?? 1}位
            </span>
            <span className="truncate text-sm font-semibold text-foreground">
              {model.top.areaName}
            </span>
          </p>
          <p
            className="mt-1 truncate text-base font-bold leading-tight tabular-nums text-foreground"
            title={`${model.top.value}${formatUnitForDisplay(unit)}`}
          >
            {model.top.value}
            <span className="ml-0.5 text-xs font-medium text-muted-foreground">
              {formatUnitForDisplay(unit)}
            </span>
          </p>
          <span className="mt-1 block text-xs leading-none text-muted-foreground">
            {year}年
          </span>
        </div>
      </div>
      {/* 1 位の値と地図は別の領域に並べる。値の背後に地図を敷くと数字が地図に重なって読みにくい。 */}
      <div
        aria-hidden="true"
        className="pointer-events-none size-16 shrink-0 [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: model.mapSvg }}
      />
    </SurfaceLinkCard>
  );
}
