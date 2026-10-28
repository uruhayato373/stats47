import { cn } from "@stats47/components";
import { hrefFor } from "@stats47/data-configs/content/href";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import { PORTAL_CARD_PADDING_CLASS, PORTAL_CARD_TITLE_CLASS, SurfaceLinkCard, PORTAL_CARD_CELL_CLASS } from "@/components/surface";

import type { FeaturedRankingCardModel } from "../../utils/resolve-featured-ranking-card";

export interface FeaturedRankingCardProps {
  rankingKey: string;
  year: string;
  unit: string;
  model: FeaturedRankingCardModel;
}

/**
 * 値と単位の文字の大きさ。値は省略しないので、桁が多いほど段階で小さくする
 * (セルの幅は xl で約 170px。「58,021,789百万円」でも 1 行に収める)。
 */
export function featuredValueSizeClass(valueWithUnit: string): string {
  const length = [...valueWithUnit].length;
  if (length <= 8) return "text-xl";
  if (length <= 11) return "text-lg";
  return "text-base";
}

/**
 * home / category / survey共通の注目ランキングカード。
 * 余白・文字階層・地理地図配置をこの1形式だけで管理する。
 *
 * 高さは中身で決める (固定比率を持たない)。上から 問い → 1 位の県 → 値 → 年 → 地図 の順に縦に積む。
 * 問いと値は省略しない (2026-10-28 3 巡目。値が「58,021,…」と切れて単位も消え、問いが語の途中で切れていた)。
 * 値と単位は折り返さない 1 塊にし、桁の多い値は文字を段階で小さくする。
 * 地図はセルの下半分に全幅の高さ 96px で置く (値の横の 64px では形が読めなかった)。
 * カルーセルのカード見出しの下では枠を外したセルになる (PORTAL_CARD_CELL_CLASS)。
 */
export function FeaturedRankingCard({
  rankingKey,
  year,
  unit,
  model,
}: FeaturedRankingCardProps) {
  const displayUnit = formatUnitForDisplay(unit);
  return (
    <SurfaceLinkCard
      href={hrefFor("ranking", { rankingKey: rankingKey })}
      className={`${PORTAL_CARD_PADDING_CLASS} ${PORTAL_CARD_CELL_CLASS} group flex h-full flex-col gap-2`}
    >
      <span className={PORTAL_CARD_TITLE_CLASS}>{model.hook}</span>
      <div className="min-w-0">
        {/* 「N位」と都道府県名は改行せず baseline 揃えで1行に置く */}
        <p className="flex items-baseline gap-1 leading-none">
          <span className="text-xs text-muted-foreground">
            {model.top.rank ?? 1}位
          </span>
          <span className="text-sm font-semibold text-foreground">
            {model.top.areaName}
          </span>
        </p>
        <p
          className={cn(
            "mt-1 whitespace-nowrap font-semibold leading-tight tabular-nums text-foreground",
            featuredValueSizeClass(`${model.top.value}${displayUnit}`),
          )}
        >
          {model.top.value}
          {displayUnit && (
            <span className="ml-0.5 text-xs font-medium text-muted-foreground">
              {displayUnit}
            </span>
          )}
        </p>
        <span className="mt-1 block text-xs leading-none text-muted-foreground">
          {year}年
        </span>
      </div>
      {/* 1 位の値と地図は別の領域に置く。値の背後に地図を敷くと数字が地図に重なって読みにくい。 */}
      <div
        aria-hidden="true"
        className="pointer-events-none mt-auto h-24 w-full [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: model.mapSvg }}
      />
    </SurfaceLinkCard>
  );
}
