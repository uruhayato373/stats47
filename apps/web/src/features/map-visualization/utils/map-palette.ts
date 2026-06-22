export const LEAFLET_MAP_COLORS = {
  border: {
    light: "#94a3b8",
    dark: "#475569",
  },
  depopulationMedical: {
    insideArea: "#dc2626",
    outsideArea: "#94a3b8",
    areaPolygon: "#f97316",
  },
} as const;

export function getLeafletBorderColor(theme: string | undefined): string {
  return theme === "dark"
    ? LEAFLET_MAP_COLORS.border.dark
    : LEAFLET_MAP_COLORS.border.light;
}
