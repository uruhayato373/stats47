import React from "react";
import { useCurrentFrame } from "remotion";

import {
  StationPassengersReel,
  type StationPassengersReelProps,
} from "@stats47/station-passengers";

/**
 * Remotion 用ラッパー。StationPassengersReel に
 * useCurrentFrame() を frame として注入する。
 */
export const StationPassengersReelRemotion: React.FC<
  Omit<StationPassengersReelProps, "frame">
> = (props) => <StationPassengersReel frame={useCurrentFrame()} {...props} />;
