import { hrefFor } from "@stats47/data-configs/content/href";
import { formatFeaturedValueDisplay, type RankingItem } from "@stats47/ranking";

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
  unit: string;
  /** 指標の定義の表示単位 (item.valueDisplay)。渡せば定義の単位、無ければ図の規則で桁を寄せる */
  valueDisplay?: RankingItem["valueDisplay"];
  model: FeaturedRankingCardModel;
}

/**
 * home / category / survey共通の注目ランキングカード。
 * 余白・文字階層・地理地図配置をこの1形式だけで管理する。
 *
 * 形はブログのカード (PortalBlogCard) と同じ「画像が上・題名が下」(2026-11-19 オーナー判断)。
 * 上から 地図 (サムネイルと同じ 40:21 の枠) → 問い → 上位 3 県 (順位・県名・値) → 年 の順に縦に積む。
 * 上位を 3 件書くのは、同率 1 位が 2 県あると 1 件では片方しか出ないため (平均身長の新潟県・福井県)。
 * 地図は 1 位の県を線で囲まない (凡例が無く意味が伝わらなかった)。
 * 問いと値は省略しない。値はランキングのページと同じ表示単位で書く (「58.0兆円」。2026-11-14)。
 * 値と地図は別の領域に置く (値の背後に地図を敷くと数字が地図に重なって読みにくい)。
 * カルーセルのカード見出しの下では枠を外したセルになる (PORTAL_CARD_CELL_CLASS)。
 */
/** 並べた値の小数の桁をそろえる (「171」と「170.9」を「171.0」と「170.9」にする。焼き込みの値は末尾の 0 を落としている) */
export function alignFractionDigits(values: readonly string[]): string[] {
  const digits = (value: string) => (/^-?[\d,]+\.(\d+)$/.exec(value)?.[1].length ?? 0);
  const max = Math.max(0, ...values.map(digits));
  return values.map((value) => {
    if (!/^-?[\d,]+(\.\d+)?$/.test(value)) return value;
    const pad = max - digits(value);
    if (pad === 0) return value;
    return `${value}${digits(value) === 0 ? "." : ""}${"0".repeat(pad)}`;
  });
}

export function FeaturedRankingCard({
  rankingKey,
  year,
  unit,
  valueDisplay,
  model,
}: FeaturedRankingCardProps) {
  const formatted = model.tops.map((top) => formatFeaturedValueDisplay({ unit, valueDisplay }, top.value));
  const values = alignFractionDigits(formatted.map((entry) => entry.value));
  return (
    <SurfaceLinkCard
      href={hrefFor("ranking", { rankingKey: rankingKey })}
      // 線の格子 (CardGrid) はカード (data-slot="card") を余白なしのセルとして扱う。記事カードと同じ印 (2026-11-03)
      data-slot="card"
      className={`${PORTAL_CARD_PADDING_CLASS} ${PORTAL_CARD_CELL_CLASS} group flex h-full flex-col gap-2 overflow-hidden`}
    >
      {/* 地図はブログのサムネイルと同じ比率の枠に置き、SVG (320:190) は枠の中央に収める */}
      <span
        aria-hidden="true"
        className={`pointer-events-none relative block ${PORTAL_CARD_ASPECT_CLASS} w-full overflow-hidden rounded-sm bg-muted [&>svg]:h-full [&>svg]:w-full`}
        dangerouslySetInnerHTML={{ __html: model.mapSvg }}
      />
      <span className={PORTAL_CARD_TITLE_CLASS}>{model.hook}</span>
      <ol className="flex flex-col gap-1 text-sm">
        {model.tops.map((top, index) => {
          const value = values[index];
          const valueUnit = formatted[index].unit;
          return (
            <li key={`${top.rank}-${top.areaName}`} className="flex items-baseline gap-2">
              <span className="w-8 shrink-0 text-xs text-muted-foreground tabular-nums">{top.rank ?? 1}位</span>
              <span className="min-w-0 flex-1 font-semibold text-foreground">{top.areaName}</span>
              <span className="whitespace-nowrap font-semibold tabular-nums text-foreground">
                {value}
                {valueUnit && <span className="ml-0.5 text-xs font-medium text-muted-foreground">{valueUnit}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <span className="mt-auto block text-xs leading-none text-muted-foreground">{year}年</span>
    </SurfaceLinkCard>
  );
}
