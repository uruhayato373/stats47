import {
  ChoroplethMapStill,
  computeChoroplethPaths,
  type ChoroplethPathInfo,
  type RankingEntry,
  type RankingMeta,
  type ThemeName,
  resolveRankingData,
} from "@/shared";
import React, { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import type { Topology } from "topojson-specification";
import { PREFECTURE_TOPOJSON_FILE } from "../../../shared/utils/static-files";
import { DEFAULT_PREFECTURE_MAP_PROPS } from "@stats47/visualization";
interface ChoroplethMapStillPreviewProps {
  theme?: ThemeName;
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  displayTitle?: string;
  hookText?: string;
  colorScheme?: string;
  colorSchemeType?: "sequential" | "diverging";
  divergingMidpointValue?: number;
}

export const ChoroplethMapStillPreview: React.FC<ChoroplethMapStillPreviewProps> = ({
  theme = "light",
  meta,
  allEntries,
  displayTitle,
  hookText,
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
        const url = staticFile(PREFECTURE_TOPOJSON_FILE);
        const res = await fetch(url);
        const topology = (await res.json()) as Topology;

        if (cancelled) return;

        const paths = computeChoroplethPaths(topology, entries, {
          colorScheme,
          colorSchemeType,
          divergingMidpointValue,
          noDataColor: theme === "dark" ? "#1E293B" : DEFAULT_PREFECTURE_MAP_PROPS.noDataFillColor,
          padding: 60,
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

  const topEntries = entries.slice(0, 3);
  const bottomEntries = [...entries].sort((a, b) => a.rank - b.rank).slice(-3);

  return (
    <ChoroplethMapStill
      meta={resolved}
      topEntries={topEntries}
      bottomEntries={bottomEntries}
      mapPaths={mapPaths ?? undefined}
      precision={precision}
      theme={theme}
      displayTitle={displayTitle}
      hookText={hookText}
    />
  );
};
