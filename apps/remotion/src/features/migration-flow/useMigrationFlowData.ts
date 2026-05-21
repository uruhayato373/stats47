import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import type { Topology } from "topojson-specification";

import type { MigrationFlowData, MunicipalityData } from "@stats47/migration-flow";

export interface MigrationFlowDataResult {
  topology: Topology | null;
  data: MigrationFlowData | null;
  /** 焦点県の市区町村境界 */
  cityTopology: Topology | null;
  /** 焦点県の市区町村別 純移動 */
  municipalities: MunicipalityData | null;
  loading: boolean;
}

/** 焦点県コードを 2 桁に正規化 ("28000" / "28" / "8" → "28" / "08") */
export function normalizeFocusCode(code: string): string {
  return String(code).padStart(2, "0").slice(0, 2);
}

/** 市区町村境界 topojson は R2 の既存 GIS データを利用（public に複製しない） */
const R2_GIS_BASE = "https://storage.stats47.jp/gis/mlit/20240101";

/**
 * 県境 topojson・県間フロー・市区町村別純移動は staticFile、
 * 市区町村境界 topojson は R2 から読み込む。
 */
export function useMigrationFlowData(
  focusPrefCode: string,
): MigrationFlowDataResult {
  const [handle] = useState(() => delayRender("Loading migration flow data"));
  const [result, setResult] = useState<MigrationFlowDataResult>({
    topology: null,
    data: null,
    cityTopology: null,
    municipalities: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const code = normalizeFocusCode(focusPrefCode);

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
        const [topology, data, cityTopology, municipalities] =
          await Promise.all([
            fetchJson<Topology>(staticFile("prefecture.topojson")),
            fetchJson<MigrationFlowData>(
              staticFile(`migration-flow/${code}.json`),
            ),
            fetchJson<Topology>(
              `${R2_GIS_BASE}/${code}/${code}_city_dc.topojson`,
            ),
            fetchJson<MunicipalityData>(
              staticFile(`migration-flow/municipalities/${code}.json`),
            ),
          ]);
        if (cancelled) return;
        setResult({
          topology,
          data,
          cityTopology,
          municipalities,
          loading: false,
        });
        continueRender(handle);
      } catch (err) {
        console.error("Failed to load migration flow data:", err);
        continueRender(handle);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [handle, focusPrefCode]);

  return result;
}
