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
      href={`/ranking/${rankingKey}`}
      className={`${PORTAL_CARD_ASPECT_CLASS} ${PORTAL_CARD_PADDING_CLASS} group flex flex-col overflow-hidden`}
    >
      {/* hook を常に2行分の高さで確保し、下の flex-1 地図領域を全カードで同じ高さに揃える
          (1行/2行のタイトル差で地図の大きさがバラつくのを防ぐ)。 */}
      <span className={PORTAL_CARD_TITLE_CLASS}>
        {model.hook}
      </span>
      <div className="relative mt-1 min-h-0 flex-1">
        {/* 地図を拡大して右下へ寄せる。テキストが左上に集まるため、地図の重心を
            右下に移すと構図が釣り合い、はみ出しはカードの overflow-hidden がクリップする。 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [transform-origin:center] [transform:scale(1.3)_translate(6%,14%)] [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: model.mapSvg }}
        />
        <div className="absolute left-0 top-1 z-10 bg-background/90 pr-2">
          {/* 「N位」と都道府県名は改行せず baseline 揃えで1行に置く
              (フォントサイズは各自そのまま)。左上をコンパクトにして地図に余白を譲る。 */}
          <p className="flex items-baseline gap-1 leading-none">
            <span className="text-[10px] text-muted-foreground">
              {model.top.rank ?? 1}位
            </span>
            <span className="text-sm font-semibold text-foreground">
              {model.top.areaName}
            </span>
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
