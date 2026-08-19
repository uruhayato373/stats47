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
  const title = selectedAreaName ? `${selectedAreaName}の${themeTitle}` : themeTitle;

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
