import { GeoJsonObject, Feature, Geometry } from 'geojson';

export interface PrefectureFeature extends Feature<Geometry> {
  properties: {
    code: string;
    name: string;
    name_en?: string;
    region?: string;
    [key: string]: any;
  };
}

export interface PrefectureGeoJSON extends GeoJsonObject {
  type: 'FeatureCollection';
  features: PrefectureFeature[];
}

export interface PrefectureData {
  code: string;
  name: string;
  value: number;
  coordinates?: [number, number];
  region?: string;
}

export interface MapConfig {
  width: number;
  height: number;
  colorScheme: 'blues' | 'reds' | 'greens' | 'purples' | 'oranges';
  showLegend: boolean;
  interactive: boolean;
  projection?: 'mercator' | 'albers' | 'geoEquirectangular';
  center?: [number, number];
  scale?: number;
}

export interface MapLegendConfig {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  orientation: 'horizontal' | 'vertical';
  width: number;
  height: number;
  title?: string;
}

export interface TooltipData {
  prefecture: string;
  value: number;
  unit?: string;
  rank?: number;
  deviation?: number;
  x: number;
  y: number;
}

export interface RegionBoundary {
  name: string;
  prefectures: string[];
  color?: string;
}