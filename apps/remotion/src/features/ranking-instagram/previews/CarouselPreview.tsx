import { CTASlide, type RankingMeta, type ThemeName, resolveRankingData } from "@/shared";
import type { RankingEntry } from "@/shared";
import { CoverSlide } from "../CoverSlide";
import React from "react";
/** プレビューで表示するスライドの種類 */
type SlideType = "cover" | "cta";

interface CarouselPreviewProps {
  slide?: SlideType;
  theme?: ThemeName;
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  /** 表示用タイトル。指定時は meta.title を上書きする */
  displayTitle?: string;
  /** AI 生成フックテキスト */
  hookText?: string;
  /** D3 カラースキーム名 */
  colorScheme?: string;
  /** カラースキームの種類 */
  colorSchemeType?: "sequential" | "diverging";
  /** diverging スケールの中間値 */
  divergingMidpointValue?: number;
}

/**
 * カルーセルスライドのプレビュー用コンポジション
 *
 * Remotion Studio の Props パネルから slide タイプを切り替えて確認できる。
 */
export const CarouselPreview: React.FC<CarouselPreviewProps> = ({
  slide = "cover",
  theme = "dark",
  meta,
  allEntries,
  displayTitle,
  hookText,
  colorScheme,
  colorSchemeType,
  divergingMidpointValue,
}) => {
  const { meta: resolved, entries } = resolveRankingData({ meta, allEntries });

  switch (slide) {
    case "cover":
      return (
        <CoverSlide
          meta={resolved}
          allEntries={entries}
          theme={theme}
          displayTitle={displayTitle}
          hookText={hookText}
          colorScheme={colorScheme}
          colorSchemeType={colorSchemeType}
          divergingMidpointValue={divergingMidpointValue}
        />
      );
    case "cta":
      return (
        <CTASlide
          theme={theme}
          headline={resolved.sourceLabel ? "保存して、47地域を見比べよう" : undefined}
          subtext={resolved.sourceLabel ? [
            displayTitle ?? resolved.title,
            [resolved.yearName, resolved.demographicAttr, resolved.normalizationBasis].filter(Boolean).join("・"),
            `出典：${resolved.sourceLabel}`,
            resolved.note,
            "プロフィールのリンクから詳しいデータへ",
          ].filter(Boolean).join("\n\n") : undefined}
        />
      );
    default:
      return (
        <CoverSlide
          meta={resolved}
          allEntries={entries}
          theme={theme}
          displayTitle={displayTitle}
          hookText={hookText}
          colorScheme={colorScheme}
          colorSchemeType={colorSchemeType}
          divergingMidpointValue={divergingMidpointValue}
        />
      );
  }
};
