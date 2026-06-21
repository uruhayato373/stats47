import type { RankingItem } from "@stats47/ranking";
import type { MapDataPoint, MapVisualizationConfig } from "@stats47/visualization/d3";

type NullableMapValue = {
  areaCode: string;
  value: number | null;
};

export const LEAFLET_BORDER_COLOR_LIGHT = "#94a3b8";
export const LEAFLET_BORDER_COLOR_DARK = "#475569";

export function getLeafletBorderColor(theme: string | undefined): string {
  return theme === "dark" ? LEAFLET_BORDER_COLOR_DARK : LEAFLET_BORDER_COLOR_LIGHT;
}

export function rankingItemToMapConfig(rankingItem: Pick<RankingItem, "visualization">): MapVisualizationConfig {
  const vis = rankingItem.visualization;

  if (!vis) {
    return {
      colorScheme: "interpolateBlues",
      colorSchemeType: "sequential",
      isReversed: false,
      minValueType: "data-min",
    };
  }

  const baseConfig = {
    colorScheme: vis.colorScheme,
    isReversed: vis.isReversed,
  };

  if (vis.colorSchemeType === "diverging") {
    return {
      ...baseConfig,
      colorSchemeType: "diverging",
      divergingMidpoint: vis.divergingMidpoint,
      divergingMidpointValue: vis.divergingMidpointValue ?? undefined,
      isSymmetrized: vis.isSymmetrized,
    };
  }

  if (vis.colorSchemeType === "categorical") {
    return {
      ...baseConfig,
      colorSchemeType: "categorical",
    };
  }

  return {
    ...baseConfig,
    colorSchemeType: "sequential",
    minValueType: vis.minValueType ?? "data-min",
  };
}

export function filterMapDataPoints<T extends NullableMapValue>(values: T[]): MapDataPoint[] {
  return values.filter(
    (item): item is T & { value: number } => item.areaCode !== "00000" && item.value !== null
  );
}
