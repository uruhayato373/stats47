// client / server 共有型 (server-only に依存しない)

export const SUNSHINE_MAP_RASTER_PATH = "app/gis-cross/sunshine-map/raster.png";

export interface SunshineMapMeta {
  generatedAt: string;
  source: string;
  meshCount: number;
  bounds: [[number, number], [number, number]];
  valueRangeHours: { min: number; median: number; max: number };
  legend: { lowHours: number; midHours: number; highHours: number };
}
