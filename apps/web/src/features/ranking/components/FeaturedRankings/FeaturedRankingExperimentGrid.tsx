import {
  HOME_FEATURED_EXPERIMENT_ID,
  HOME_FEATURED_ADOPTED_VARIANT,
} from "../../utils/home-featured-experiment";
import { FeaturedRankingCard } from "../FeaturedRankingCard";

import { EditorialFeaturedCard } from "./FeaturedRankingCardVisual";
import { TrackedFeaturedRankingCard } from "./TrackedFeaturedRankingCard";

import type { HomeFeaturedEditorialModel } from "../../utils/resolve-home-featured-card";
import type { RankingThumbnailVariant } from "@stats47/data-configs";

/**
 * grid セルの固定高さ (等高化 + CLS 回避)。
 */
const CELL_HEIGHT_CLASS = "h-44 sm:h-52 lg:h-60";

export interface HomeFeaturedGridItem {
  rankingKey: string;
  title: string;
  /** データ年度 (yearCode) */
  latestYear: string;
  unit: string;
  control: {
    variant: RankingThumbnailVariant;
    topAreaName?: string;
    topValue?: string;
    demographicAttr?: string;
    normalizationBasis?: string;
    tileMapSvg?: string;
  };
  /** editorial で描画できる場合のみ (payload 不足は null = control フォールバック §5.4) */
  editorial: HomeFeaturedEditorialModel | null;
}

interface FeaturedRankingExperimentGridProps {
  items: HomeFeaturedGridItem[];
}

/**
 * home 注目ランキング grid。
 *
 * home-featured-v1 の 50/50 A/B は 2026-07-23 のポータル再設計で **editorial を採用して終了**した
 * (オーナー判断・inconclusive。正典 doc 28 §9.4 / FeaturedRankings/README.md)。以降は editorial
 * variant (question / comparison / territory / top-three) を全ユーザーに固定描画し、item 単位で
 * editorial payload 不足時のみ control card にフォールバックする (§5.4)。
 *
 * - client 割当 (localStorage + 乱数) と mount 前 placeholder は撤去 (A/B 不要のため)。
 *   editorial は決定的なので SSR HTML に直接描画され、初期 HTML に主要 link が含まれ CLS も無い。
 * - impression / click 計測は維持 (experiment_variant は採用値 "editorial" 固定で継続)。
 */
export function FeaturedRankingExperimentGrid({ items }: FeaturedRankingExperimentGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item, idx) => {
        const editorialModel = item.editorial;
        const shownVariant = editorialModel ? editorialModel.variant : item.control.variant;
        return (
          <div key={`${item.rankingKey}-${idx}`} className={CELL_HEIGHT_CLASS}>
            <TrackedFeaturedRankingCard
              rankingKey={item.rankingKey}
              cardVariant={shownVariant}
              slot={idx + 1}
              experimentId={HOME_FEATURED_EXPERIMENT_ID}
              experimentVariant={HOME_FEATURED_ADOPTED_VARIANT}
            >
              {editorialModel ? (
                <EditorialFeaturedCard
                  rankingKey={item.rankingKey}
                  title={item.title}
                  year={item.latestYear}
                  unit={item.unit}
                  model={editorialModel}
                />
              ) : (
                <FeaturedRankingCard
                  rankingKey={item.rankingKey}
                  title={item.title}
                  latestYear={item.latestYear}
                  unit={item.unit}
                  topAreaName={item.control.topAreaName}
                  topValue={item.control.topValue}
                  demographicAttr={item.control.demographicAttr}
                  normalizationBasis={item.control.normalizationBasis}
                  tileMapSvg={item.control.tileMapSvg}
                  variant={item.control.variant}
                  fitHeight
                />
              )}
            </TrackedFeaturedRankingCard>
          </div>
        );
      })}
    </div>
  );
}
