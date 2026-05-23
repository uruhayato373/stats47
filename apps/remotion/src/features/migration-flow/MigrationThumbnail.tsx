import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";
import { geoMercator, geoPath } from "d3-geo";
import { scaleDiverging } from "d3-scale";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import { FONT } from "@stats47/migration-flow";

import { PREF_MIGRATION_2025 } from "./pref-net-2025";

const W = 1280;
const H = 720;
const MAP_W = 650;
const MAP_H = 712;
const MAP_X = W - MAP_W;
const MAP_Y = (H - MAP_H) / 2;

const BG = "#0F172A";
const OUT_HEX = "#EF4444"; // 転出超過
const IN_HEX = "#2DD4BF"; // 転入超過
const OUT_RGB = [239, 68, 68];
const MID_RGB = [51, 65, 85]; // 暗背景になじむ中間
const IN_RGB = [45, 212, 191];

function mix(a: number[], b: number[], u: number): string {
  const c = (i: number) => Math.round(a[i] + (b[i] - a[i]) * u);
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}

/** t: 0 = 転出超過(赤) → 0.5 = 中間 → 1 = 転入超過(青緑) */
function divergingColor(t: number): string {
  return t < 0.5
    ? mix(OUT_RGB, MID_RGB, t / 0.5)
    : mix(MID_RGB, IN_RGB, (t - 0.5) / 0.5);
}

/** 東京へ矢印を引く転出超過県（地理的に分散させて「全国から」感を出す） */
const ARROW_FROM = ["01", "02", "04", "07", "15", "22", "33", "34", "38", "46"];

interface ThumbState {
  paths: { code: string; d: string; fill: string }[];
  arrows: string[];
  tokyo: [number, number];
}

/** YouTube サムネイル（1280×720）。全国から東京へ人が集まる図 */
export const MigrationThumbnail: React.FC = () => {
  const [state, setState] = useState<ThumbState | null>(null);
  const [handle] = useState(() => delayRender("migration-thumbnail-topojson"));

  useEffect(() => {
    let cancelled = false;
    fetch(staticFile("prefecture.topojson"))
      .then((r) => r.json())
      .then((topo: Topology) => {
        if (cancelled) return;
        const geo = feature(
          topo,
          topo.objects.pref as GeometryCollection,
        ) as FeatureCollection;
        const proj = geoMercator().fitExtent(
          [
            [14, 14],
            [MAP_W - 14, MAP_H - 14],
          ],
          geo,
        );
        const pathGen = geoPath(proj);
        const netByCode = new Map(
          PREF_MIGRATION_2025.map((p) => [p.code, p.net]),
        );
        const scale = scaleDiverging(divergingColor)
          .domain([-7000, 0, 7000])
          .clamp(true);

        const centroid = new Map<string, [number, number]>();
        const paths = geo.features.map((f: Feature) => {
          const code = (f.properties?.N03_007 ?? "") as string;
          centroid.set(code, pathGen.centroid(f) as [number, number]);
          return {
            code,
            d: pathGen(f) ?? "",
            fill: scale(netByCode.get(code) ?? 0),
          };
        });

        const tokyo = centroid.get("13") ?? [MAP_W / 2, MAP_H / 2];
        const arrows: string[] = [];
        for (const code of ARROW_FROM) {
          const from = centroid.get(code);
          if (!from) continue;
          const dx = tokyo[0] - from[0];
          const dy = tokyo[1] - from[1];
          const len = Math.hypot(dx, dy) || 1;
          const bulge = 0.16 * len;
          const cx = (from[0] + tokyo[0]) / 2 - (dy / len) * bulge;
          const cy = (from[1] + tokyo[1]) / 2 + (dx / len) * bulge;
          arrows.push(`M${from[0]},${from[1]} Q${cx},${cy} ${tokyo[0]},${tokyo[1]}`);
        }
        setState({ paths, arrows, tokyo });
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
    return () => {
      cancelled = true;
    };
  }, [handle]);

  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily: FONT.family }}>
      {/* 地図（右） */}
      <div
        style={{
          position: "absolute",
          left: MAP_X,
          top: MAP_Y,
          width: MAP_W,
          height: MAP_H,
        }}
      >
        {state && (
          <svg width={MAP_W} height={MAP_H}>
            <defs>
              <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {state.paths.map((p) => (
              <path
                key={p.code}
                d={p.d}
                fill={p.fill}
                stroke={BG}
                strokeWidth={1}
                strokeLinejoin="round"
              />
            ))}
            {state.arrows.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={IN_HEX}
                strokeWidth={5}
                strokeLinecap="round"
                opacity={0.85}
                filter="url(#glow)"
              />
            ))}
            <circle
              cx={state.tokyo[0]}
              cy={state.tokyo[1]}
              r={14}
              fill={IN_HEX}
              stroke="#FFFFFF"
              strokeWidth={3}
              filter="url(#glow)"
            />
          </svg>
        )}
      </div>

      {/* 東京 callout */}
      {state && (
        <div
          style={{
            position: "absolute",
            left: MAP_X + state.tokyo[0] + 26,
            top: MAP_Y + state.tokyo[1] - 34,
            backgroundColor: IN_HEX,
            color: BG,
            fontWeight: FONT.weight.black,
            padding: "6px 16px",
            borderRadius: 10,
            fontSize: 34,
            boxShadow: "0 4px 18px rgba(0,0,0,0.5)",
          }}
        >
          東京 +65,219人
        </div>
      )}

      {/* テキスト（左） */}
      <div
        style={{
          position: "absolute",
          left: 70,
          top: 0,
          bottom: 0,
          width: 560,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 25,
            color: "#94A3B8",
            fontWeight: FONT.weight.bold,
            letterSpacing: 1,
            marginBottom: 16,
          }}
        >
          47都道府県 人口移動 2025
        </div>
        <div
          style={{
            fontSize: 104,
            fontWeight: FONT.weight.black,
            color: "#FFFFFF",
            lineHeight: 1.08,
          }}
        >
          全国から、
        </div>
        <div
          style={{
            fontSize: 104,
            fontWeight: FONT.weight.black,
            color: IN_HEX,
            lineHeight: 1.08,
          }}
        >
          東京へ。
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            color: "#E2E8F0",
            fontWeight: FONT.weight.bold,
          }}
        >
          人を<span style={{ color: IN_HEX }}>集める県</span>・
          <span style={{ color: OUT_HEX }}>失う県</span>を地図で
        </div>
      </div>
    </AbsoluteFill>
  );
};
