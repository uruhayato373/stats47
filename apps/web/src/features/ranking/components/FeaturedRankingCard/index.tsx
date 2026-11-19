import { hrefFor } from "@stats47/data-configs/content/href";

import {
  PORTAL_CARD_ASPECT_CLASS,
  PORTAL_CARD_CELL_CLASS,
  PORTAL_CARD_PADDING_CLASS,
  PORTAL_CARD_TITLE_CLASS,
  SurfaceLinkCard,
} from "@/components/surface";

import type { FeaturedRankingCardModel } from "../../utils/resolve-featured-ranking-card";

export interface FeaturedRankingCardProps {
  rankingKey: string;
  year: string;
  model: FeaturedRankingCardModel;
}

/**
 * home / category / survey共通の注目ランキングカード。
 * 余白・文字階層・地理地図配置をこの1形式だけで管理する。
 *
 * 形はブログのカード (PortalBlogCard) と同じ「画像が上・題名が下」(2026-11-19 オーナー判断)。
 * 画像はサムネイルと同じ 40:21 の枠の地図で、上位 3 位までを左上 (日本海側の空き) に重ねる。
 * 並びは図の型の台帳「地図（実際の形）」の web の決まり (data/content-operations/image-templates.json)。
 * 上位の行は正本の関数 `buildFeaturedTopRows` (@stats47/ranking) が、ランキングのページの表と同じ単位・桁で書いた文字で、
 * カードは整形し直さない。地図の SVG はブログのカードと API でも使うので、文字は SVG に焼かず HTML で重ねる。
 * 問いは省略しない。カルーセルのカード見出しの下では枠を外したセルになる (PORTAL_CARD_CELL_CLASS)。
 */
export function FeaturedRankingCard({ rankingKey, year, model }: FeaturedRankingCardProps) {
  const { unit, rows } = model.top;
  return (
    <SurfaceLinkCard
      href={hrefFor("ranking", { rankingKey: rankingKey })}
      // 線の格子 (CardGrid) はカード (data-slot="card") を余白なしのセルとして扱う。記事カードと同じ印 (2026-11-03)
      data-slot="card"
      className={`${PORTAL_CARD_PADDING_CLASS} ${PORTAL_CARD_CELL_CLASS} group flex h-full flex-col gap-2 overflow-hidden`}
    >
      <span className={`relative block ${PORTAL_CARD_ASPECT_CLASS} w-full overflow-hidden rounded-sm bg-muted`}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: model.mapSvg }}
        />
        <ol aria-label="上位" className="absolute top-2 left-2 flex flex-col gap-0.5 text-xs leading-tight">
          {rows.map((row) => (
            <li key={`${row.rank}-${row.areaName}`} className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="w-3 text-right font-semibold tabular-nums text-muted-foreground">{row.rank}</span>
              <span className="font-semibold text-foreground">{row.areaName}</span>
              <span className="font-semibold tabular-nums text-foreground">
                {row.value}
                {unit && <span className="ml-0.5 font-medium text-muted-foreground">{unit}</span>}
              </span>
            </li>
          ))}
        </ol>
      </span>
      <span className={PORTAL_CARD_TITLE_CLASS}>{model.hook}</span>
      <span className="mt-auto block text-xs leading-none text-muted-foreground">{year}年</span>
    </SurfaceLinkCard>
  );
}
