// Server Component — 静的コンテンツのみ（Link / SVG 描画）。Client hydration 不要でバンドル削減。
import Link from "next/link";

import { RankingThumbnail } from "../FeaturedRankings/RankingThumbnail";

import type { RankingThumbnailVariant } from "@stats47/data-configs";

interface FeaturedRankingCardProps {
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
  /**
   * サムネイル表示バリアント。"map"=地図型(既定・後方互換) / "number"=数値型(代表値強調)。
   * 解決は resolveRankingThumbnailVariant に一本化し、ここでは解決済み値を受け取る。
   * 正典(A/B解決規則): apps/web/src/features/ranking/utils/resolve-thumbnail-variant.ts
   */
  variant?: RankingThumbnailVariant;
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
  variant = "map",
}: FeaturedRankingCardProps) {
  // トップページ用 B: 数値型（代表値を最大要素にし、地図は薄い装飾背景）。
  // variant=number でも 1位名/値が欠損していれば下の A（地図型）へフォールバックする。
  if (topAreaName && topValue && variant === "number") {
    return (
      <Link
        href={`/ranking/${rankingKey}`}
        title={title}
        className="group relative flex flex-col overflow-hidden rounded-none border border-border transition-all hover:border-primary/50 hover:shadow-md"
      >
        {tileMapSvg && (
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15] [&>svg]:h-full [&>svg]:w-full"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: tileMapSvg }}
          />
        )}
        <div className="relative flex flex-1 flex-col gap-2 p-3">
          <span className="text-sm font-medium leading-tight line-clamp-2 transition-colors group-hover:text-primary">
            {title}
          </span>
          <div className="mt-auto flex items-baseline gap-1">
            <span className="font-mono text-3xl font-bold leading-none tabular-nums text-primary">
              {topValue}
            </span>
            <span className="text-sm font-medium text-muted-foreground">{unit}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">1位</span>
            <span className="text-sm font-semibold text-foreground">{topAreaName}</span>
          </div>
        </div>
      </Link>
    );
  }

  // トップページ用 A: 1位データ表示モード（地図型・後方互換の標準）
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
