import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

import { BuzzMapCard } from "./BuzzMapCard";
import { buildSummary } from "./BuzzMapStill";
import { animSeconds, rampColor, valueAtYear, yearAtSeconds } from "./lib";
import { BUZZ_MAP_COLORS, type BuzzMapRatio } from "./tokens";
import type { BuzzMapSpec } from "./types";
import { useBuzzMapFonts } from "./useBuzzMapFonts";
import { useBuzzMapGeo } from "./useBuzzMapGeo";

interface BuzzMapReelProps {
  spec: BuzzMapSpec;
  ratio: BuzzMapRatio;
}

/**
 * 型B（時系列アニメ）— 年カウンターを回しながら連続量の塗りが変化する動画。
 * 減速カーブは spec.speed、ラストは holdSeconds 静止してサマリー（最大・最小）を出す。
 * 尺は Root.tsx の calculateMetadata が spec から算出する。
 */
export const BuzzMapReel: React.FC<BuzzMapReelProps> = ({ spec, ratio }) => {
  useBuzzMapFonts();
  const geo = useBuzzMapGeo(spec, ratio);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!geo) return null;

  const seconds = frame / fps;
  const anim = animSeconds(spec);
  const inHold = seconds >= anim;
  const t = yearAtSeconds(spec, seconds);

  const series = spec.data.series ?? {};
  const domain = spec.ramp?.domain ?? [0, 1];
  const fillFor = (code: string) => {
    const v = series[code] ? valueAtYear(series[code], t) : undefined;
    return v === undefined ? BUZZ_MAP_COLORS.land : rampColor(v, domain);
  };

  return (
    <BuzzMapCard
      spec={spec}
      geo={geo}
      ratio={ratio}
      fillFor={fillFor}
      yearLabel={`${Math.floor(t)}年`}
      summary={inHold ? buildSummary(spec, t) : undefined}
    />
  );
};
