import React from "react";
import { AbsoluteFill } from "remotion";

import { COLOR_SCHEMES, type ThemeName } from "@/shared/themes/brand";
import type { ChoroplethPathInfo } from "@/shared/utils/choropleth";
import { ChoroplethMapSvg } from "@/shared/components/maps/ChoroplethMapSvg";

interface RankingThumbnailProps {
  mapPaths: ChoroplethPathInfo[];
  theme?: ThemeName;
  /** 回転角度 (度) */
  rotation?: number;
}

/**
 * ランキングサムネイル (240x240)
 *
 * サイドバー等で使用する正方形のコロプレス地図サムネイル。
 * テキストなし・地図のみのコンパクト画像。
 */
export const RankingThumbnail: React.FC<RankingThumbnailProps> = ({
  mapPaths,
  theme = "dark",
  rotation = 0,
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
      }}
    >
      <ChoroplethMapSvg
        paths={mapPaths}
        width={1000}
        height={1000}
        strokeColor={isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.2)"}
        strokeWidth={1.0}
        rotation={rotation}
        dropShadow={true}
        shadowColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)"}
        shadowOpacity={isDark ? 0.6 : 0.4}
      />
    </AbsoluteFill>
  );
};
