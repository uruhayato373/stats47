import {
  computeChoroplethPaths,
  type ChoroplethPathInfo,
  type RankingEntry,
  type RankingMeta,
  type ThemeName,
  resolveRankingData,
} from "@/shared";
import { NoteCover } from "../NoteCover";
import React, { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import type { Topology } from "topojson-specification";

interface NoteCoverPreviewProps {
  theme?: ThemeName;
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  colorScheme?: string;
  colorSchemeType?: "sequential" | "diverging";
  divergingMidpointValue?: number;
}

/**
 * note カバー画像のプレビュー用コンポジション
 * TopoJSON を非同期ロードしてコロプレス地図を表示
 */
export const NoteCoverPreview: React.FC<NoteCoverPreviewProps> = ({
  theme = "dark",
  meta,
  allEntries,
  colorScheme = "interpolateBlues",
  colorSchemeType,
  divergingMidpointValue,
}) => {
  const [handle] = useState(() => delayRender("Loading TopoJSON"));
  const [mapPaths, setMapPaths] = useState<ChoroplethPathInfo[] | null>(null);
  const { meta: resolved, entries, precision } = resolveRankingData({ meta, allEntries });

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      try {
        const url = staticFile("prefecture.topojson");
        const res = await fetch(url);
        const topology = (await res.json()) as Topology;

        if (cancelled) return;

        // RankingHeroOgpPreview と同じパラメータ (1280x670 に合わせて微調整)
        const paths = computeChoroplethPaths(topology, entries, {
          colorScheme,
          colorSchemeType,
          divergingMidpointValue,
          noDataColor: theme === "dark" ? "#1E293B" : "#e0e0e0",
          width: 740,
          height: 740,
          padding: -80,
          offsetX: 0,
          offsetY: 80,
        });

        setMapPaths(paths);
        continueRender(handle);
      } catch (err) {
        console.error("Failed to load TopoJSON:", err);
        continueRender(handle);
      }
    }

    loadMap();
    return () => {
      cancelled = true;
    };
  }, [handle, theme, entries]);

  return (
    <NoteCover
      meta={resolved}
      topEntries={entries.slice(0, 3)}
      mapPaths={mapPaths ?? undefined}
      precision={precision}
      theme={theme}
    />
  );
};
