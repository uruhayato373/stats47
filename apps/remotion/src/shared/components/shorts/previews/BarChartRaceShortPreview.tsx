import React from "react";
import type { BarChartRaceFrame } from "@stats47/visualization";
import type { ThemeName } from "@/shared";
import type { EventLabel } from "../../../utils/bar-chart-race";
import { BarChartRaceShort } from "../BarChartRaceShort";

interface BarChartRaceShortPreviewProps {
  frames?: BarChartRaceFrame[];
  title?: string;
  unit?: string;
  topN?: number;
  framesPerYear?: number;
  theme?: ThemeName;
  variant?: "youtube" | "instagram" | "tiktok";
  showSafeAreas?: boolean;
  hookText?: string;
  eventLabels?: EventLabel[];
  enableSpoilerHook?: boolean;
}

export const BarChartRaceShortPreview: React.FC<BarChartRaceShortPreviewProps> = (props) => {
  return <BarChartRaceShort {...props} />;
};
