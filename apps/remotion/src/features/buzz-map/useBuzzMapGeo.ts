/**
 * spec.level に応じた TopoJSON をロードし、ジオパスを計算する hook
 *
 * - pref     → prefecture.topojson
 * - muni(:NN)→ buzz-map/municipalities.topojson（＋県境オーバーレイ用に prefecture.topojson）
 */

import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import type { Topology } from "topojson-specification";

import { computeBuzzMapGeo, type BuzzMapGeo } from "./geo";
import type { BuzzMapRatio } from "./tokens";
import type { BuzzMapSpec } from "./types";

export function useBuzzMapGeo(spec: BuzzMapSpec, ratio: BuzzMapRatio): BuzzMapGeo | null {
  const [geo, setGeo] = useState<BuzzMapGeo | null>(null);
  const [handle] = useState(() => delayRender("Loading buzz-map TopoJSON"));
  const isMuni = spec.level.startsWith("muni");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const mainUrl = staticFile(
          isMuni ? "buzz-map/municipalities.topojson" : "prefecture.topojson"
        );
        const main = (await (await fetch(mainUrl)).json()) as Topology;
        let pref: Topology | null = null;
        if (isMuni && spec.level === "muni") {
          pref = (await (
            await fetch(staticFile("prefecture.topojson"))
          ).json()) as Topology;
        }
        if (cancelled) return;
        setGeo(
          computeBuzzMapGeo(main, pref, {
            level: spec.level,
            ratio,
            type: spec.type,
            points: spec.type === "C" ? spec.data.points : undefined,
          })
        );
        continueRender(handle);
      } catch (err) {
        cancelRender(err);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.level, spec.type, ratio]);

  return geo;
}
