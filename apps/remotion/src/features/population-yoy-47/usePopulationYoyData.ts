import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import type { Topology } from "topojson-specification";
import type { YoyTimeseries } from "./types";
import type { CityPathInfo } from "../population-choropleth/types";
import {
  computeYearPaths,
  createSharedColorScale,
  getProjection,
} from "./projection";

export interface YearFrame {
  year: number;
  paths: CityPathInfo[];
}

export interface YoyDataResult {
  timeseries: YoyTimeseries | null;
  topology: Topology | null;
  frames: YearFrame[];
  loading: boolean;
}

interface Options {
  format: "landscape" | "portrait";
  mapWidth: number;
  mapHeight: number;
  /** 配色 domain の上限（|ratio-1| の最大値）。指定すると timeseries.maxAbs を上書き */
  clampMaxAbs?: number;
}

export function usePopulationYoyData({
  format,
  mapWidth,
  mapHeight,
  clampMaxAbs,
}: Options): YoyDataResult {
  const [handle] = useState(() => delayRender("Loading YoY timeseries"));
  const [result, setResult] = useState<YoyDataResult>({
    timeseries: null,
    topology: null,
    frames: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [topoRes, dataRes] = await Promise.all([
          fetch(staticFile("prefecture.topojson")),
          fetch(staticFile("population-yoy-47/timeseries.json")),
        ]);
        const [topology, timeseries] = await Promise.all([
          topoRes.json() as Promise<Topology>,
          dataRes.json() as Promise<YoyTimeseries>,
        ]);
        if (cancelled) return;

        const effectiveMaxAbs = clampMaxAbs ?? timeseries.maxAbs;
        const colorScale = createSharedColorScale(effectiveMaxAbs);
        const projConfig = getProjection(format, mapWidth, mapHeight);
        const frames: YearFrame[] = timeseries.frames.map((f) => ({
          year: f.year,
          paths: computeYearPaths(topology, f.yoy, colorScale, projConfig),
        }));

        setResult({ timeseries, topology, frames, loading: false });
        continueRender(handle);
      } catch (err) {
        console.error("Failed to load YoY data:", err);
        continueRender(handle);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [handle, format, mapWidth, mapHeight, clampMaxAbs]);

  return result;
}
