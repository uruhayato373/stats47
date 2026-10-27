import type { FeatureCollection } from "geojson";
import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import type { Topology } from "topojson-specification";

import type { StationPassengerData } from "@stats47/station-passengers";
import { PREFECTURE_TOPOJSON_FILE } from "../../shared/utils/static-files";
import { to2DigitPrefCode } from "@stats47/area";

export interface StationPassengersDataResult {
  topology: Topology | null;
  data: StationPassengerData | null;
  /** N02 路線ライン (GeoJSON)。無ければ null */
  railLines: FeatureCollection | null;
  loading: boolean;
}

/** 県コードを 2 桁に正規化 ("22000" / "22" / "2" → "22" / "02")。`@stats47/area` の単一実装 */
export function normalizePrefCode(code: string): string {
  return to2DigitPrefCode(code);
}

/**
 * 県境 topojson と駅別乗降客数 JSON を staticFile から読み込む。
 * 駅データは scripts/fetch-station-passengers.ts が生成する。
 */
export function useStationPassengersData(
  prefCode: string,
): StationPassengersDataResult {
  const [handle] = useState(() => delayRender("Loading station passengers data"));
  const [result, setResult] = useState<StationPassengersDataResult>({
    topology: null,
    data: null,
    railLines: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const code = normalizePrefCode(prefCode);

    async function fetchJson<T>(url: string): Promise<T | null> {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return (await res.json()) as T;
      } catch {
        return null;
      }
    }

    async function load() {
      try {
        const [topology, data, railLines] = await Promise.all([
          fetchJson<Topology>(staticFile(PREFECTURE_TOPOJSON_FILE)),
          fetchJson<StationPassengerData>(
            staticFile(`station-passengers/${code}.json`),
          ),
          fetchJson<FeatureCollection>(
            staticFile(`station-passengers/lines-${code}.json`),
          ),
        ]);
        if (cancelled) return;
        setResult({ topology, data, railLines, loading: false });
        continueRender(handle);
      } catch (err) {
        console.error("Failed to load station passengers data:", err);
        continueRender(handle);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [handle, prefCode]);

  return result;
}
