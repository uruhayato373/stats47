"use client";

import { useState } from "react";

import Image from "next/image";

import { isResponsiveRankingChart, resolveDarkChartSource, resolveMobileChartSource } from "../lib/responsive-chart";

import { MEDIA_QUERIES } from "@/constants/breakpoints";

interface ResponsiveArticleImageProps {
  src: string;
  alt: string;
}

/**
 * ブログ本文画像。ランキングと積み上げ棒のSVGはスマホで `-mobile.svg` に切り替え、ランキングと地図は
 * サイトの暗い表示のとき `-dark.svg` に切り替える。どちらも無い記事は読み込み失敗で元の画像へ戻し、画像切れを起こさない。
 * ランキングと地図は 4:5 の型の画像、積み上げ棒は項目数で高さが変わるので、比率は画像に任せる。
 */
export function ResponsiveArticleImage({ src, alt }: ResponsiveArticleImageProps) {
  const [mobileFailed, setMobileFailed] = useState(false);
  const [darkFailed, setDarkFailed] = useState(false);
  const mobileSrc = mobileFailed ? null : resolveMobileChartSource(src);
  const darkSrc = darkFailed ? null : resolveDarkChartSource(src);
  const isRankingChart = isResponsiveRankingChart(src);
  const isTypeImage = Boolean(darkSrc) || isRankingChart;
  const size = isTypeImage ? { width: 1080, height: 1350 } : { width: 800, height: 450 };
  // 4:5 の型の画像は 672px 幅だと高さが 840px になり、ノート PC の画面に 1 枚が収まらない
  const widthClass = isTypeImage ? "mx-auto h-auto w-full rounded-lg sm:max-w-[560px]" : "h-auto w-full rounded-lg";
  const imageProps = {
    alt,
    ...size,
    sizes: `${MEDIA_QUERIES.belowSm} 100vw, ${isTypeImage ? "560px" : "672px"}`,
    decoding: "async" as const,
    loading: "lazy" as const,
    unoptimized: true,
  };

  return (
    <>
      <picture className={darkSrc ? "block dark:hidden" : "block"}>
        {mobileSrc && <source media={MEDIA_QUERIES.belowSm} srcSet={mobileSrc} />}
        <Image
          src={src}
          className={widthClass}
          {...imageProps}
          onError={() => {
            if (mobileSrc) setMobileFailed(true);
          }}
        />
      </picture>
      {darkSrc && (
        // display:none の間は lazy の画像を読まないので、明るい表示では暗い版を取りに行かない
        <Image
          src={darkSrc}
          className={`hidden dark:block ${widthClass}`}
          {...imageProps}
          onError={() => setDarkFailed(true)}
        />
      )}
    </>
  );
}
