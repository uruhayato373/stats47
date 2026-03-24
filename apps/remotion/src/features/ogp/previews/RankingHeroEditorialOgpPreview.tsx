import {
    computeChoroplethPaths,
    type ChoroplethPathInfo,
    type ThemeName,
} from "@/shared";
import { getMaxDecimalPlaces } from "@stats47/utils";
import type { RankingEntry, RankingMeta } from "@/shared/types/ranking";
import { RankingHeroEditorialOgp } from "../RankingHeroEditorialOgp";
import { getMockRankingData, type MockDataKey } from "@/shared/utils/mock-data";
import React, { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import type { Topology } from "topojson-specification";

interface RankingHeroEditorialOgpPreviewProps {
    theme?: ThemeName;
    mockDataKey?: MockDataKey;
    showGuides?: boolean;
    meta?: RankingMeta;
    entries?: RankingEntry[];
    colorScheme?: string;
}

export const RankingHeroEditorialOgpPreview: React.FC<RankingHeroEditorialOgpPreviewProps> = ({
    theme = "light",
    mockDataKey = "annual-sales-amount-per-employee",
    showGuides = false,
    meta: propMeta,
    entries: propEntries,
    colorScheme = "interpolateBlues",
}) => {
    const [handle] = useState(() => delayRender("Loading TopoJSON"));
    const [mapPaths, setMapPaths] = useState<ChoroplethPathInfo[] | null>(null);

    const mockData = getMockRankingData(mockDataKey);
    const meta = propMeta ?? mockData.meta;
    const entries = propEntries ?? mockData.entries;
    const precision = getMaxDecimalPlaces(entries.map((e) => e.value));

    useEffect(() => {
        let cancelled = false;

        async function loadMap() {
            try {
                const url = staticFile("prefecture.topojson");
                const res = await fetch(url);
                const topology = (await res.json()) as Topology;

                if (cancelled) return;

                const paths = computeChoroplethPaths(topology, entries, {
                    colorScheme,
                    noDataColor: theme === "dark" ? "#1E293B" : "#e0e0e0",
                    width: 400,
                    height: 400,
                    padding: -40,
                    offsetX: 0,
                    offsetY: 40,
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
    }, [entries, handle, theme, colorScheme]);

    return (
        <RankingHeroEditorialOgp
            meta={meta}
            topEntries={entries.slice(0, 3)}
            mapPaths={mapPaths ?? undefined}
            theme={theme}
            showGuides={showGuides}
            precision={precision}
        />
    );
};
