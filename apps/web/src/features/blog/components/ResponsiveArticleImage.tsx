"use client";

import { useState } from "react";

import Image from "next/image";

import { isResponsiveRankingChart, resolveMobileChartSource } from "../lib/responsive-chart";

import { MEDIA_QUERIES } from "@/constants/breakpoints";

interface ResponsiveArticleImageProps {
  src: string;
  alt: string;
}

/**
 * ブログ本文画像。ランキングと積み上げ棒のSVGだけPC横長／mobile版をpictureで切り替える。
 * 未移行の公開記事にmobile assetがまだ無い場合はonErrorでdesktopへ戻し、画像切れを起こさない。
 * ランキングのmobile版は2:3の縦長固定なので枠を2:3にする。積み上げ棒は高さが項目数で変わるので画像の比率に任せる。
 */
export function ResponsiveArticleImage({ src, alt }: ResponsiveArticleImageProps) {
  const [mobileFailed, setMobileFailed] = useState(false);
  const mobileSrc = mobileFailed ? null : resolveMobileChartSource(src);
  const isRankingChart = isResponsiveRankingChart(src);
  const isFixedPortrait = mobileSrc !== null && isRankingChart;

  return (
    <picture className={isFixedPortrait ? "block max-sm:aspect-2/3" : "block"}>
      {mobileSrc && <source media={MEDIA_QUERIES.belowSm} srcSet={mobileSrc} />}
      <Image
        src={src}
        alt={alt}
        width={isRankingChart ? 960 : 800}
        height={isRankingChart ? 404 : 450}
        className={isFixedPortrait
          ? "h-auto w-full rounded-lg max-sm:h-full max-sm:object-contain"
          : "h-auto w-full rounded-lg"}
        sizes={`${MEDIA_QUERIES.belowSm} 100vw, 672px`}
        decoding="async"
        loading="lazy"
        unoptimized
        onError={() => {
          if (mobileSrc) setMobileFailed(true);
        }}
      />
    </picture>
  );
}
