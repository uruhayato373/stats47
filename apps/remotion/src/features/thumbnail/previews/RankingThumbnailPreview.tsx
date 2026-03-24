import {
  computeChoroplethPaths,
  type ChoroplethPathInfo,
  type RankingEntry,
  type RankingMeta,
  type ThemeName,
  resolveRankingData,
} from "@/shared";
import { RankingThumbnail } from "../RankingThumbnail";
import React, { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import type { Topology } from "topojson-specification";
interface RankingThumbnailPreviewProps {
  theme?: ThemeName;
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  rotation?: number;
}

export const RankingThumbnailPreview: React.FC<RankingThumbnailPreviewProps> = ({
  theme = "dark",
  meta,
  allEntries,
  rotation = 0,
}) => {
  const [handle] = useState(() => delayRender("Loading TopoJSON"));
  const [mapPaths, setMapPaths] = useState<ChoroplethPathInfo[] | null>(null);
  const { entries } = resolveRankingData({ meta, allEntries });

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      try {
        const url = staticFile("prefecture.topojson");
        const res = await fetch(url);
        const topology = (await res.json()) as Topology;

        if (cancelled) return;

        const paths = computeChoroplethPaths(topology, entries, {
          colorScheme: "interpolateBlues",
          noDataColor: theme === "dark" ? "#2d3748" : "#e2e8f0",
          padding: -300,
          offsetY: 180,
          offsetX: 50,
        });

        setMapPaths(paths);
        continueRender(handle);
      } catch (err) {
        console.error("Failed to load TopoJSON:", err);
        continueRender(handle);
      }
    }

    loadMap();
    return () => { cancelled = true; };
  }, [handle, theme, entries]);

  if (!mapPaths) return null;

  return <RankingThumbnail mapPaths={mapPaths} theme={theme} rotation={rotation} />;
};
