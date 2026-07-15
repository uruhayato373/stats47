import React from "react";

import { BuzzMapReel } from "../BuzzMapReel";
import { reelDurationInFrames } from "../lib";
import { BUZZ_MAP_REEL_DEFAULTS, type BuzzMapRatio } from "../tokens";
import type { BuzzMapSpec } from "../types";
import sampleB from "../specs/sample-anim.json";

export interface BuzzMapReelPreviewProps {
  /** spec 全体。CLI からは --props='{"spec": {...}}'（specs/*.json はこの形で保存） */
  spec?: BuzzMapSpec;
  ratio?: BuzzMapRatio;
}

export const BuzzMapReelPreview: React.FC<BuzzMapReelPreviewProps> = ({
  spec,
  ratio = "11",
}) => <BuzzMapReel spec={spec ?? (sampleB.spec as unknown as BuzzMapSpec)} ratio={ratio} />;

/** Root.tsx の calculateMetadata 用: spec から尺（フレーム数）を算出する */
export function calculateBuzzMapReelMetadata({
  props,
}: {
  props: BuzzMapReelPreviewProps;
}) {
  const spec = props.spec ?? (sampleB.spec as unknown as BuzzMapSpec);
  return {
    durationInFrames: reelDurationInFrames(spec, BUZZ_MAP_REEL_DEFAULTS.fps),
    fps: BUZZ_MAP_REEL_DEFAULTS.fps,
  };
}
