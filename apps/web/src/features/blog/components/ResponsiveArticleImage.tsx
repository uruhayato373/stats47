"use client";

import { useState } from "react";

import Image from "next/image";

import { resolveMobileChartSource } from "../lib/responsive-chart";

interface ResponsiveArticleImageProps {
  src: string;
  alt: string;
}

/**
 * ブログ本文画像。ランキングSVGだけPC横長／mobile縦長をpictureで切り替える。
 * 未移行の公開記事にmobile assetがまだ無い場合はonErrorでdesktopへ戻し、画像切れを起こさない。
 */
export function ResponsiveArticleImage({ src, alt }: ResponsiveArticleImageProps) {
  const [mobileFailed, setMobileFailed] = useState(false);
  const mobileSrc = mobileFailed ? null : resolveMobileChartSource(src);
  const isResponsiveChart = resolveMobileChartSource(src) !== null;

  return (
    <picture className={mobileSrc ? "block max-sm:aspect-[2/3]" : "block"}>
      {mobileSrc && <source media="(max-width: 639px)" srcSet={mobileSrc} />}
      <Image
        src={src}
        alt={alt}
        width={isResponsiveChart ? 960 : 800}
        height={isResponsiveChart ? 404 : 450}
        className={mobileSrc
          ? "h-auto w-full rounded-lg max-sm:h-full max-sm:object-contain"
          : "h-auto w-full rounded-lg"}
        sizes="(max-width: 639px) 100vw, 672px"
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
