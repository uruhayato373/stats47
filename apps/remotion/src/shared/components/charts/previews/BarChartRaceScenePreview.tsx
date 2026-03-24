import React from "react";
import type { BarChartRaceFrame } from "@stats47/visualization";
import type { ThemeName } from "@/shared";
import type { EventLabel } from "../../../utils/bar-chart-race";
import {
  MOCK_BAR_CHART_RACE_FRAMES,
  MOCK_EVENT_LABELS,
} from "../../../utils/mock-bar-chart-race-data";
import { BarChartRaceScene } from "../BarChartRaceScene";

interface BarChartRaceScenePreviewProps {
  frames?: BarChartRaceFrame[];
  title?: string;
  unit?: string;
  topN?: number;
  framesPerYear?: number;
  theme?: ThemeName;
  eventLabels?: EventLabel[];
}

export const BarChartRaceScenePreview: React.FC<BarChartRaceScenePreviewProps> = ({
  frames,
  title = "都道府県別 人口ランキング",
  unit = "千人",
  topN = 10,
  framesPerYear = 36,
  theme = "dark",
  eventLabels,
}) => {
  return (
    <BarChartRaceScene
      frames={frames || MOCK_BAR_CHART_RACE_FRAMES}
      title={title}
      unit={unit}
      topN={topN}
      framesPerYear={framesPerYear}
      theme={theme}
      eventLabels={eventLabels || MOCK_EVENT_LABELS}
    />
  );
};
