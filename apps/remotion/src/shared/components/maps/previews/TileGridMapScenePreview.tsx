import React from "react";
import type { RankingEntry, RankingMeta, ThemeName } from "@/shared";
import { SafetyZoneOverlay } from "@/shared";
import { resolveRankingData } from "@/shared/utils/mock-data";
import { TileGridMapScene } from "../TileGridMapScene";

interface TileGridMapScenePreviewProps {
  theme?: ThemeName;
  mode?: "static" | "progressive";
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  showSafeAreas?: boolean;
  hookText?: string;
}

/**
 * TileGridMapScene の単体プレビュー用コンポジション
 *
 * - static: 全タイル一括ポップインを確認
 * - progressive: 1エントリ分のタイル出現 + インフォカードを確認
 */
export const TileGridMapScenePreview: React.FC<TileGridMapScenePreviewProps> = ({
  theme = "dark",
  mode = "static",
  meta,
  allEntries,
  showSafeAreas = false,
  hookText,
}) => {
  const { meta: resolved, entries, precision } = resolveRankingData({ meta, allEntries });

  if (mode === "progressive") {
    const sorted = [...entries].sort((a, b) => b.rank - a.rank);
    const revealCount = 25;
    const revealSchedule = sorted.slice(0, revealCount).map((_, i) => ({
      startFrame: i * 60,
      duration: 60,
    }));

    return (
      <>
        <TileGridMapScene
          entries={sorted}
          meta={resolved}
          theme={theme}
          mode="progressive"
          precision={precision}
          revealSchedule={revealSchedule}
        />
        {showSafeAreas && <SafetyZoneOverlay />}
      </>
    );
  }

  return (
    <>
      <TileGridMapScene
        entries={entries}
        meta={resolved}
        theme={theme}
        mode="static"
        precision={precision}
        hookText={hookText}
      />
      {showSafeAreas && <SafetyZoneOverlay />}
    </>
  );
};
