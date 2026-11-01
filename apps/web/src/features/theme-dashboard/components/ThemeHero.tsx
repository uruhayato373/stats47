"use client";

import { HeroBanner } from "@/components/layout";
import type { PageHeroDef } from "@/components/layout/page-heroes";

import { useThemePrefecture } from "./ThemePrefectureContext";


/**
 * hero 画像付きのテーマ見出し。ThemeAreaHeader の drop-in 差し替え
 * (hero を持つテーマだけ ThemePageLayout がこちらを描画する)。
 *
 * 描画は共有 HeroBanner に委譲し、都道府県連動の H1 を供給する。
 * 地域切替は lg+ の左レール、lg 未満のパンくず直下ツールバーに集約する。
 */
export function ThemeHero({
  themeTitle,
  hero,
}: {
  themeTitle: string;
  hero: PageHeroDef;
}) {
  const { selectedAreaName } = useThemePrefecture();
  // 題名に今の地域を入れる (2026-10-31 IA-REGION-THEME-01): 県を選ぶと「兵庫県の労働・賃金」、選ばないと「全国の労働・賃金」(2026-10-31 に「都道府県別の」から改めた。テーマは 1 つの地域を見せる)
  const title = selectedAreaName ? `${selectedAreaName}の${themeTitle}` : `全国の${themeTitle}`;

  return (
    <HeroBanner
      eyebrow="テーマ"
      title={title}
      tagline={hero.tagline ?? ""}
      imageSrc={hero.image.src}
      imageAlt={hero.imageAlt}
    />
  );
}
