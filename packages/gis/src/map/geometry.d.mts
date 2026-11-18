import type { GeoPermissibleObjects, GeoProjection } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Topology } from 'topojson-specification';

export type MapExtent = [[number, number], [number, number]];

export function topologyFeatures(topology: Topology, objectName?: string): FeatureCollection;
export function fittedMercator(extent: MapExtent, target: GeoPermissibleObjects): GeoProjection;
export function heightFittedMercator(height: number, target: GeoPermissibleObjects): GeoProjection;
export function centeredMercator(options: { center: [number, number]; scale: number; translate: [number, number] }): GeoProjection;
export function mercator(): GeoProjection;
export function largestPolygon<T extends Feature<Geometry>>(target: T): T;

export interface LonLatBox {
  readonly west: number;
  readonly east: number;
  readonly south: number;
  readonly north: number;
}
export const MAINLAND_BBOX: LonLatBox;
export function inMainlandBox(lon: number, lat: number, bbox?: LonLatBox): boolean;
export function isMainlandFeature(target: GeoPermissibleObjects, bbox?: LonLatBox): boolean;
export function isMainlandPolygon(coordinates: number[][][], bbox?: LonLatBox): boolean;
export function polygonAreaKm2(coordinates: number[][][]): number;
export function dropSmallIslands<T extends Feature<Geometry>>(target: T, minAreaKm2: number): T;
