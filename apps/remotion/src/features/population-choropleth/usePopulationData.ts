import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import type { Topology } from "topojson-specification";
import type { CityPathInfo, PopulationRecord } from "./types";
import {
  computeDivergingPathsWithScale,
  computeSharedDomain,
  createSharedColorScale,
} from "../../shared/utils/choropleth-diverging";

const R2_BASE = "https://storage.stats47.jp";

const R2_URLS = {
  tokyoTopo: `${R2_BASE}/gis/mlit/20240101/13/13_city_dc.topojson`,
  osakaTopo: `${R2_BASE}/gis/mlit/20240101/27/27_city_dc.topojson`,
  tokyoData: `${R2_BASE}/blog/population-choropleth/data/population-ratio-tokyo.json`,
  osakaData: `${R2_BASE}/blog/population-choropleth/data/population-ratio-osaka.json`,
} as const;

/** 東京都の除外コード（島嶼部 + 所属未定地） */
const TOKYO_EXCLUDE_CODES = new Set([
  "13000",
  "13361", "13362", "13363", "13364",
  "13381", "13382",
  "13401", "13402",
  "13421",
]);

const MAP_SIZE = 800;

export interface PopulationDataResult {
  tokyoPaths: CityPathInfo[];
  osakaPaths: CityPathInfo[];
  tokyoData: PopulationRecord[];
  osakaData: PopulationRecord[];
  sharedDomain: { min: number; max: number; maxAbs: number };
  loading: boolean;
}

export function usePopulationData(): PopulationDataResult {
  const [handle] = useState(() => delayRender("Loading population data"));
  const [result, setResult] = useState<PopulationDataResult>({
    tokyoPaths: [],
    osakaPaths: [],
    tokyoData: [],
    osakaData: [],
    sharedDomain: { min: 0.5, max: 1.1, maxAbs: 0.5 },
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [tokyoTopoRes, osakaTopoRes, tokyoDataRes, osakaDataRes] =
          await Promise.all([
            fetch(R2_URLS.tokyoTopo),
            fetch(R2_URLS.osakaTopo),
            fetch(R2_URLS.tokyoData),
            fetch(R2_URLS.osakaData),
          ]);

        const [tokyoTopo, osakaTopo, tokyoData, osakaData] = await Promise.all([
          tokyoTopoRes.json() as Promise<Topology>,
          osakaTopoRes.json() as Promise<Topology>,
          tokyoDataRes.json() as Promise<PopulationRecord[]>,
          osakaDataRes.json() as Promise<PopulationRecord[]>,
        ]);

        if (cancelled) return;

        const sharedDomain = computeSharedDomain(tokyoData, osakaData);
        const colorScale = createSharedColorScale(sharedDomain.maxAbs);

        const tokyoPaths = computeDivergingPathsWithScale(
          tokyoTopo,
          tokyoData,
          colorScale,
          {
            width: MAP_SIZE,
            height: MAP_SIZE,
            excludeCodes: TOKYO_EXCLUDE_CODES,
            padding: 30,
          },
        );

        const osakaPaths = computeDivergingPathsWithScale(
          osakaTopo,
          osakaData,
          colorScale,
          {
            width: MAP_SIZE,
            height: MAP_SIZE,
            padding: 30,
          },
        );

        setResult({
          tokyoPaths,
          osakaPaths,
          tokyoData,
          osakaData,
          sharedDomain,
          loading: false,
        });

        continueRender(handle);
      } catch (err) {
        console.error("Failed to load population data:", err);
        continueRender(handle);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  return result;
}
