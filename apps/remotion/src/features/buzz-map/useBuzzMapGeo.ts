/**
 * spec.level に応じた TopoJSON をロードし、ジオパスを計算する hook
 *
 * - pref     → prefecture.topojson
 * - muni(:NN)→ buzz-map/municipalities.topojson（＋県境オーバーレイ用に prefecture.topojson）
 */

import type { Feature } from "geojson";
import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

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

        // 型D/E: 線 asset (topojson or GeoJSON) を Feature[] に展開
        let lineFeatures: Feature[] | undefined;
        if ((spec.type === "D" || spec.type === "E") && spec.data.linesAsset) {
          const raw = (await (await fetch(staticFile(spec.data.linesAsset))).json()) as
            | Topology
            | { type: "FeatureCollection"; features: Feature[] };
          if (raw.type === "Topology") {
            const objName = Object.keys(raw.objects)[0];
            lineFeatures = feature(raw, raw.objects[objName] as GeometryCollection).features;
          } else if (raw.type === "FeatureCollection") {
            lineFeatures = raw.features;
          }
        }

        if (cancelled) return;
        setGeo(
          computeBuzzMapGeo(main, pref, {
            level: spec.level,
            ratio,
            type: spec.type,
            // 型C/E は点、型D/E は線を読む
            points: spec.type === "C" || spec.type === "E" ? spec.data.points : undefined,
            lineFeatures,
            lineYearProp: spec.lineYearProp,
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
  }, [spec.level, spec.type, ratio, spec.data.linesAsset, spec.lineYearProp]);

  return geo;
}
