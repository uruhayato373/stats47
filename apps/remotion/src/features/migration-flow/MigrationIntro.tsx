import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { scaleDiverging } from "d3-scale";
import { COLOR_SCHEMES, FONT, type ThemeName } from "@stats47/migration-flow";

import type {
  CityPathInfo,
  PopulationRecord,
} from "../population-choropleth/types";
import { computeDivergingPathsWithScale } from "../../shared/utils/choropleth-diverging";
import { PREF_MIGRATION_2025 } from "./pref-net-2025";

const FRAME_W = 1920;
const MAP_W = 960;
const MAP_H = 730;
/** 純移動の色クランプ上限。±10,000 で飽和させ、各県のコントラストを出す */
const NET_DOMAIN = 10000;

const OUT_HEX = "#DC2626"; // 転出超過
const MID_HEX = "#EDF2F7";
const IN_HEX = "#0D9488"; // 転入超過
const OUT_RGB = [220, 38, 38];
const MID_RGB = [237, 242, 247];
const IN_RGB = [13, 148, 136];

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

/** イントロの尺（16秒 @30fps。ナレーション約14秒を収める） */
export const MIGRATION_INTRO_DURATION = 480;

/**
 * 47都道府県まとめ動画のイントロ。
 * タイトル + 全国コロプレス地図（純移動で着色）。
 */
export const MigrationIntro: React.FC<{ theme?: ThemeName }> = ({
  theme = "light",
}) => {
  const colors = COLOR_SCHEMES[theme];
  const frame = useCurrentFrame();
  const [paths, setPaths] = useState<CityPathInfo[] | null>(null);
  const [handle] = useState(() => delayRender("migration-intro-topojson"));

  useEffect(() => {
    let cancelled = false;
    fetch(staticFile("prefecture.topojson"))
      .then((r) => r.json())
      .then((topo) => {
        if (cancelled) return;
        const scale = scaleDiverging(divergingColor)
          .domain([-NET_DOMAIN, 0, NET_DOMAIN])
          .clamp(true);
        const data: PopulationRecord[] = PREF_MIGRATION_2025.map((p) => ({
          areaCode: p.code,
          areaName: p.name,
          pop2025: 0,
          pop2045: 0,
          ratio: p.net,
        }));
        setPaths(
          computeDivergingPathsWithScale(topo, data, scale, {
            width: MAP_W,
            height: MAP_H,
            padding: 16,
          }),
        );
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
    return () => {
      cancelled = true;
    };
  }, [handle]);

  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
  const titleOp = interpolate(frame, [0, 18], [0, 1], clamp);
  const titleY = interpolate(frame, [0, 18], [26, 0], clamp);
  const mapOp = interpolate(frame, [14, 44], [0, 1], clamp);
  const legendOp = interpolate(frame, [38, 62], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{ backgroundColor: colors.background, fontFamily: FONT.family }}
    >
      {/* タイトル */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
            letterSpacing: 2,
          }}
        >
          住民基本台帳人口移動報告 2025年
        </div>
        <div
          style={{
            fontSize: 66,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
            marginTop: 6,
          }}
        >
          47都道府県 人口移動フロー
        </div>
        <div
          style={{
            fontSize: 25,
            fontWeight: FONT.weight.medium,
            color: colors.muted,
            marginTop: 10,
          }}
        >
          <span style={{ color: OUT_HEX, fontWeight: FONT.weight.bold }}>
            転出超過が大きい県
          </span>
          {" から "}
          <span style={{ color: IN_HEX, fontWeight: FONT.weight.bold }}>
            転入超過が大きい県
          </span>
          {" まで"}
        </div>
      </div>

      {/* 全国コロプレス地図 */}
      <div
        style={{
          position: "absolute",
          top: 210,
          left: (FRAME_W - MAP_W) / 2,
          width: MAP_W,
          height: MAP_H,
          opacity: mapOp,
        }}
      >
        {paths && (
          <svg
            width={MAP_W}
            height={MAP_H}
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            style={{ display: "block" }}
          >
            {paths.map((p) => (
              <path
                key={p.areaCode}
                d={p.path}
                fill={p.fill}
                stroke={colors.background}
                strokeWidth={0.9}
                strokeLinejoin="round"
              />
            ))}
          </svg>
        )}
      </div>

      {/* レジェンド */}
      <div
        style={{
          position: "absolute",
          bottom: 88,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          opacity: legendOp,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span
            style={{ fontSize: 20, fontWeight: FONT.weight.bold, color: OUT_HEX }}
          >
            転出超過
          </span>
          <div
            style={{
              width: 460,
              height: 16,
              borderRadius: 8,
              background: `linear-gradient(to right, ${OUT_HEX}, ${MID_HEX}, ${IN_HEX})`,
            }}
          />
          <span
            style={{ fontSize: 20, fontWeight: FONT.weight.bold, color: IN_HEX }}
          >
            転入超過
          </span>
        </div>
        <span style={{ fontSize: 15, color: colors.muted }}>
          色が濃いほど超過数が大きい
        </span>
      </div>

      {/* 出典 */}
      <div
        style={{
          position: "absolute",
          bottom: 38,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 17,
          color: colors.muted,
        }}
      >
        データ出典: 総務省統計局「住民基本台帳人口移動報告」2025年（e-Stat）　｜　stats47.jp
      </div>
    </AbsoluteFill>
  );
};
