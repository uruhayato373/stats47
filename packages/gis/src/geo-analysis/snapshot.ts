export type GeoAnalysisValueFormat =
  | "integer"
  | "decimal1"
  | "percent1"
  | "signedPercent1";

export interface GeoAnalysisMetricDefinition {
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly format: GeoAnalysisValueFormat;
  readonly description: string;
}

export interface GeoAnalysisSnapshotRow {
  readonly areaCode: string;
  readonly areaName: string;
  readonly rank: number;
  readonly values: Readonly<Record<string, number | null>>;
}

export interface GeoAnalysisSource {
  readonly name: string;
  readonly url: string;
  readonly datasetId: string;
  readonly version: string;
  readonly license: string;
}

export interface GeoAnalysisSnapshot {
  readonly schemaVersion: 1;
  readonly slug: string;
  readonly generatedAt: string;
  readonly dataVersion: string;
  readonly geography: "prefecture";
  readonly title: string;
  readonly question: string;
  readonly primaryMetricKey: string;
  readonly metrics: readonly GeoAnalysisMetricDefinition[];
  readonly rows: readonly GeoAnalysisSnapshotRow[];
  readonly summary: {
    readonly observationCount: number;
    readonly medianValue: number;
    readonly topAreaCodes: readonly string[];
    readonly bottomAreaCodes: readonly string[];
  };
  readonly method: readonly string[];
  readonly sources: readonly GeoAnalysisSource[];
  readonly caveats: readonly string[];
  readonly dataQuality: {
    readonly expectedAreas: 47;
    readonly actualAreas: number;
    readonly missingAreaCodes: readonly string[];
    readonly inputCounts: Readonly<Record<string, number>>;
    readonly coverageNote: string;
  };
}

export type GeoAnalysisLayerRole =
  | "calculation-input"
  | "context-only"
  | "derived"
  | "aggregate";

export type GeoAnalysisStageKind =
  | "source"
  | "spatial-operation"
  | "context"
  | "aggregate";

export interface GeoAnalysisArtifactEvidence {
  readonly key: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly recordCount: number;
  readonly areaCode?: string;
}

export interface GeoAnalysisInputEvidence {
  readonly layerId: string;
  readonly datasetId: string;
  readonly version: string;
  readonly key: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly geometry: "mesh" | "point" | "line" | "polygon";
  readonly role: Extract<GeoAnalysisLayerRole, "calculation-input" | "context-only">;
  readonly usedInCalculation: boolean;
}

export interface GeoAnalysisStageEvidence {
  readonly id: string;
  readonly label: string;
  readonly kind: GeoAnalysisStageKind;
  readonly role: GeoAnalysisLayerRole;
  readonly inputIds: readonly string[];
  readonly operation: string;
  readonly outputKeyPattern: string;
  readonly outputs: readonly GeoAnalysisArtifactEvidence[];
}

/**
 * Geo分析の入力から配信結果までを追跡するlineage manifest。
 * 数値の主張は aggregate、地図上の途中経過は stages から再現する。
 */
export interface GeoAnalysisEvidenceManifest {
  readonly schemaVersion: 1;
  readonly slug: string;
  readonly generatedAt: string;
  readonly definitionSha256: string;
  readonly inputs: readonly GeoAnalysisInputEvidence[];
  readonly stages: readonly GeoAnalysisStageEvidence[];
  readonly aggregate: GeoAnalysisArtifactEvidence;
  readonly quality: {
    readonly expectedAreas: 47;
    readonly detailAreas: number;
    readonly conservationChecks: number;
    readonly sourceRecords: number;
    readonly derivedRecords: number;
    readonly stationGroups?: number;
    readonly populatedMeshes: number;
    readonly accessibleMeshes?: number;
    readonly exposedMeshes?: number;
    readonly maxDetailBytes: number;
  };
}

/** [meshId, westE6, southE6, eastE6, northE6, population2020, population2050] */
export type GeoPopulationMeshCell = readonly [
  meshId: string,
  westE6: number,
  southE6: number,
  eastE6: number,
  northE6: number,
  population2020: number,
  population2050: number,
];

/** [pointId, longitudeE6, latitudeE6, priceYenPerM2, changePercent] */
export type GeoLandPricePoint = readonly [
  pointId: string,
  longitudeE6: number,
  latitudeE6: number,
  priceYenPerM2: number,
  changePercent: number | null,
];

export interface GeoLandPricePrefDetail {
  readonly schemaVersion: 1;
  readonly slug: "population-land-price";
  readonly generatedAt: string;
  readonly areaCode: string;
  readonly areaName: string;
  readonly meshes: readonly GeoPopulationMeshCell[];
  readonly landPricePoints: readonly GeoLandPricePoint[];
  readonly summary: {
    readonly meshCount: number;
    readonly pointCount: number;
    readonly population2020: number;
    readonly population2050: number;
    readonly medianResidentialLandPrice: number;
    readonly medianLandPriceChange: number;
    readonly populationChangeRate: number;
  };
}

/** 最後の要素は想定最大規模の浸水深区分。0は今回入力で包含されなかったことだけを表す。 */
export type GeoFloodMeshCell = readonly [
  meshId: string,
  westE6: number,
  southE6: number,
  eastE6: number,
  northE6: number,
  population2020: number,
  population2050: number,
  floodDepthClass: number,
];

export interface GeoFloodPrefDetail {
  readonly schemaVersion: 1;
  readonly slug: "population-flood-risk";
  readonly generatedAt: string;
  readonly areaCode: string;
  readonly areaName: string;
  readonly meshMethod: "center-point";
  readonly meshes: readonly GeoFloodMeshCell[];
  readonly summary: {
    readonly meshCount: number;
    readonly exposedMeshCount: number;
    readonly population2020: number;
    readonly population2050: number;
    readonly exposedPopulation2020: number;
    readonly exposedPopulation2050: number;
    readonly floodExposureShare2020: number;
    readonly floodExposureShare2050: number;
  };
}

export type GeoAnalysisPrefDetail =
  | GeoLandPricePrefDetail
  | GeoFloodPrefDetail
  | GeoStationAccessPrefDetail;

export function geoAnalysisManifestKey(slug: string): string {
  return `app/geo/${slug}/manifest.json`;
}

export function geoAnalysisPrefKey(slug: string, prefCode2: string): string {
  return `app/geo/${slug}/pref/${prefCode2}.json`;
}

/**
 * 県別1kmメッシュを小さく配信するためのtuple。
 * [meshId, westE6, southE6, eastE6, northE6, population2020, population2050, accessible]
 */
export type GeoStationAccessMeshCell = readonly [
  meshId: string,
  westE6: number,
  southE6: number,
  eastE6: number,
  northE6: number,
  population2020: number,
  population2050: number,
  accessible: 0 | 1,
];

/** [stationGroupId, stationName, longitudeE6, latitudeE6] */
export type GeoStationAccessStation = readonly [
  stationGroupId: string,
  stationName: string,
  longitudeE6: number,
  latitudeE6: number,
];

export interface GeoStationAccessPrefDetail {
  readonly schemaVersion: 1;
  readonly slug: "population-station-access";
  readonly generatedAt: string;
  readonly areaCode: string;
  readonly areaName: string;
  readonly accessRadiusMeters: 800;
  readonly meshMethod: "center-point";
  readonly meshes: readonly GeoStationAccessMeshCell[];
  readonly stations: readonly GeoStationAccessStation[];
  readonly summary: {
    readonly meshCount: number;
    readonly accessibleMeshCount: number;
    readonly displayedStationCount: number;
    readonly population2020: number;
    readonly population2050: number;
    readonly accessiblePopulation2020: number;
    readonly accessiblePopulation2050: number;
    readonly stationAccessShare2020: number;
    readonly stationAccessShare2050: number;
  };
}

export const GEO_STATION_ACCESS_MANIFEST_KEY =
  "app/geo/population-station-access/manifest.json";

export function geoStationAccessPrefKey(prefCode2: string): string {
  return geoAnalysisPrefKey("population-station-access", prefCode2);
}
