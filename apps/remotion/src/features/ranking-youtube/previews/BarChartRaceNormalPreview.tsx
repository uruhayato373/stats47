import React from "react";
import type { ThemeName } from "../../../shared/themes/brand";
import type { EventLabel } from "../../../shared/utils/bar-chart-race";
import { BarChartRaceNormal } from "../BarChartRaceNormal";

interface Props {
  frames?: any;
  title?: string;
  unit?: string;
  topN?: number;
  framesPerYear?: number;
  theme?: ThemeName;
  hookText?: string;
  eventLabels?: EventLabel[];
  enableSpoilerHook?: boolean;
  endHoldFrames?: number;
}

export const BarChartRaceNormalPreview: React.FC<Props> = (props) => {
  return <BarChartRaceNormal {...props} />;
};
