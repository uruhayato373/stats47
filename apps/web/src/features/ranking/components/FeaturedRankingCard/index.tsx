// Server Component — 静的コンテンツのみ（Link / SVG 描画）。Client hydration 不要でバンドル削減。
import Link from "next/link";

import { RankingThumbnail } from "../FeaturedRankings/RankingThumbnail";

export interface FeaturedRankingCardProps {
  rankingKey: string;
  title: string;
  latestYear?: string;
  unit: string;
  /** サムネイルURL（カテゴリページ等で使用） */
  baseThumbnailUrl?: string;
  /** 1位の都道府県名（トップページで使用） */
  topAreaName?: string;
  /** 1位の値（トップページで使用） */
  topValue?: string;
  demographicAttr?: string | null;
  normalizationBasis?: string | null;
  /** サーバー生成のミニタイルマップSVG */
  tileMapSvg?: string;
}

/**
 * おすすめランキングカード
 *
 * topAreaName が渡された場合は1位データを表示、
 * baseThumbnailUrl が渡された場合はサムネイル付きレイアウトで表示する。
 */
export function FeaturedRankingCard({
  rankingKey,
  title,
  latestYear,
  unit,
  baseThumbnailUrl,
  topAreaName,
  topValue,
  demographicAttr,
  normalizationBasis,
  tileMapSvg,
}: FeaturedRankingCardProps) {
  // トップページ用: 1位データ表示モード
  if (topAreaName) {
    return (
      <Link
        href={`/ranking/${rankingKey}`}
        title={title}
        className="group block rounded-none border border-border hover:border-primary/50 hover:shadow-md transition-all overflow-hidden"
      >
        {tileMapSvg && (
          <div
            className="w-full bg-muted/20 border-b border-border [&>svg]:w-full [&>svg]:h-auto [&>svg]:block"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: tileMapSvg }}
          />
        )}
        <div className="p-3 flex flex-col gap-1.5">
          <span className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">1位</span>
            <span className="text-sm font-semibold text-primary">{topAreaName}</span>
            {topValue && (
              <span className="text-xs text-muted-foreground">
                {topValue}{unit}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // カテゴリ・ランキング一覧用: サムネイル付きモード
  return (
    <Link
      href={`/ranking/${rankingKey}`}
      title={title}
      className="group block rounded-none border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors overflow-hidden"
    >
      <div className="flex gap-3 p-2.5">
        {baseThumbnailUrl && (
          <div className="flex-shrink-0 w-20 rounded-none overflow-hidden bg-muted aspect-square">
            <RankingThumbnail
              baseSrc={baseThumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <span className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </span>
          <div className="flex flex-wrap gap-1">
            {latestYear && (
              <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                {latestYear}年
              </span>
            )}
            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
              {unit}
            </span>
            {demographicAttr && (
              <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                {demographicAttr}
              </span>
            )}
            {normalizationBasis && (
              <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                {normalizationBasis}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
